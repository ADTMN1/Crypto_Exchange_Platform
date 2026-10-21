import bcrypt from 'bcrypt';
import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import redisClient from '../config/redis.config.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// Configure Nodemailer with SMTP
let transporter = null;
let smtpConfigValid = false;
const isDev = process.env.NODE_ENV !== 'production';

async function initSmtp() {
    try {
        logger.info('Starting SMTP configuration', { 
            source: 'auth.service.js',
            nodeEnv: process.env.NODE_ENV || 'development',
            smtpHost: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
            smtpPort: process.env.SMTP_PORT ? 'SET' : 'NOT SET',
            smtpUser: process.env.SMTP_USER ? 'SET' : 'NOT SET',
        });

        const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            if (isDev) {
                logger.warn('Missing SMTP vars in dev mode', { missingVars });
            } else {
                logger.error('CRITICAL: Missing SMTP vars in production', { missingVars });
            }
            return;
        }

        const port = Number(process.env.SMTP_PORT);
        logger.info('Creating SMTP transporter', { 
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            requireTLS: port === 587,
        });
        
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: port,
            secure: port === 465,
            requireTLS: port === 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        logger.info('SMTP transporter created successfully');
        await transporter.verify();
        smtpConfigValid = true;
        logger.info('SMTP connection verified and ready');

    } catch (err) {
        logger.error('Failed to initialize SMTP', { 
            message: err.message,
            code: err.code,
            isDev,
        });
        if (!isDev) {
            logger.error('CRITICAL: SMTP failed in production');
        }
    }
}

// Export SMTP initialization function for controlled startup
export { initSmtp };

const authService = {
    /**
     * Executes account creation and lifecycle tracking maps.
     */
    register: async (email, username, phone_number, password, otp) => {
        // 1. Verify OTP first
        if (!otp) {
            throw new AppError('OTP is required for registration.', 400);
        }

        const attemptsKey = `otp-attempts:${email}`;
        const attempts = Number(await redisClient.get(attemptsKey)) || 0;

        if (attempts >= 5) {
            await redisClient.del(`otp:${email}`);
            await redisClient.del(attemptsKey);
            throw new AppError('Too many invalid OTP attempts. Please request a new OTP.', 429);
        }

        const storedOTP = await redisClient.get(`otp:${email}`);

        if (!storedOTP) {
            throw new AppError('OTP expired or not found. Please request a new one.', 400);
        }

        // Normalize both OTPs for comparison
        const normalizedStoredOTP = storedOTP.toString().trim();
        const normalizedInputOTP = otp.toString().trim();

        if (normalizedStoredOTP !== normalizedInputOTP) {
            const nextAttempts = attempts + 1;
            if (nextAttempts >= 5) {
                await redisClient.del(`otp:${email}`);
                await redisClient.del(attemptsKey);
                throw new AppError('Too many invalid OTP attempts. Please request a new OTP.', 429);
            }
            await redisClient.setEx(attemptsKey, 300, String(nextAttempts));
            throw new AppError('Invalid OTP. Please try again.', 400);
        }

        // 2. Structural check for conflicting existing identities
        const existingUserCheck = await query(
            'SELECT 1 FROM users WHERE email = $1 OR phone_number = $2',
            [email, phone_number]
        );

        if (existingUserCheck.rows.length > 0) {
            throw new AppError('An account with this email or phone number already exists.', 409);
        }

        // 2. Hash sensitive password credentials securely
        const passwordHash = await bcrypt.hash(password, 12);

        // 3. Lease dedicated pool client to assure atomic transactional consistency
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get the 'user' role UUID
            const roleQuery = await client.query(
                "SELECT id FROM roles WHERE name = 'user' LIMIT 1"
            );
            
            if (roleQuery.rows.length === 0) {
                throw new AppError('Default user role not found. Please run role seeding.', 500);
            }
            
            const userRoleId = roleQuery.rows[0].id;

            // 4. Populate structural Identity baseline
            const userInsertQuery = `
                INSERT INTO users (email, username, phone_number, password_hash, role_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, email, username, created_at;
            `;
            const userResult = await client.query(userInsertQuery, [
                email, username, phone_number, passwordHash, userRoleId
            ]);
            const newUser = userResult.rows[0];

            // 5. Populate structural Status tracking layer (Enum auto-evaluates to 'pending')
            const statusInsertQuery = `
                INSERT INTO user_status (user_id, account_status, email_verified, phone_verified, two_fa_enabled)
                VALUES ($1, 'pending', FALSE, FALSE, FALSE);
            `;
            await client.query(statusInsertQuery, [newUser.id]);

            // 6. Create default wallets for the user
            const defaultCurrencies = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'];
            const isDevelopment = process.env.NODE_ENV !== 'production';
            const initialUSDTBalance = isDevelopment ? (parseInt(process.env.TEST_INITIAL_USDT || '1000') || 0) : 0;
            
            for (const currency of defaultCurrencies) {
                // Insert wallet (only add test balance in development)
                const initialBalance = currency === 'USDT' ? initialUSDTBalance : 0;
                await client.query(
                    `INSERT INTO wallets (user_id, currency, balance, locked_balance)
                     VALUES ($1, $2, $3, 0)
                     ON CONFLICT (user_id, currency) DO NOTHING`,
                    [newUser.id, currency, initialBalance]
                );

                // If it's USDT and we added a balance, record the transaction
                if (currency === 'USDT' && initialBalance > 0) {
                    await client.query(
                        `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, status, confirmed_at)
                         SELECT $1, id, 'deposit', $2, $3, 'completed', CURRENT_TIMESTAMP
                         FROM wallets 
                         WHERE user_id = $1 AND currency = $2`,
                        [newUser.id, currency, initialBalance]
                    );
                }
            }

            await client.query('COMMIT');

        // Delete OTP after successful registration
        await redisClient.del(`otp:${email}`);
        await redisClient.del(`otp-attempts:${email}`);

        return newUser;

        } catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof AppError) {
                throw error;
            }
            // Handle PostgreSQL unique constraint violation (error code 23505)
            if (error.code === '23505') {
                logger.warn('Duplicate key violation during registration', { constraint: error.constraint });
                if (error.constraint === 'users_email_key') {
                    throw new AppError('Email already registered. Please login instead.', 400);
                }
                if (error.constraint === 'users_username_key') {
                    throw new AppError('Username already taken. Please choose another username.', 400);
                }
                if (error.constraint === 'users_phone_number_key') {
                    throw new AppError('Phone number already registered. Please use a different phone number.', 400);
                }
                throw new AppError('An account with this information already exists.', 400);
            }
            throw new AppError(error.message || 'Failed to register user.', 500);
        } finally {
            client.release();
        }
    },

    /**
     * Validates identity combinations and signs updates to database access indicators.
     */
    login: async (email, password) => {
        const requestId = `AUTH_SERVICE_LOGIN_${Date.now()}`;
        console.log(`[${requestId}] AUTH SERVICE LOGIN - Starting login for email: ${email}`);
        
        // 1. Dynamic lookup checking email OR username vectors
     const userQuery = `
              SELECT 
                u.id,
                u.email,
                u.username,
                u.is_active,
                u.is_deleted,
                u.password_hash,
                u.profile_image,
                u.profile_picture_url,
                r.id AS role_id,
                        r.name AS role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.email = $1;
        `;
        console.log(`[${requestId}] Executing user query...`);
        const queryStart = Date.now();
        const result = await query(userQuery, [email]);
        const queryDuration = Date.now() - queryStart;
        console.log(`[${requestId}] User query completed in ${queryDuration}ms, rows: ${result.rows.length}`);

        if (result.rows.length === 0) {
            console.log(`[${requestId}] No user found with email: ${email}`);
            throw new AppError('Invalid identification credentials.', 401);
        }

        const user = result.rows[0];
        console.log(`[${requestId}] User found:`, { id: user.id, email: user.email, is_active: user.is_active, is_deleted: user.is_deleted });
        
        if (!user.is_active || user.is_deleted) {
            console.log(`[${requestId}] User account suspended or deactivated`);
            throw new AppError('This user account is suspended or deactivated.', 403);
        }

        // 3. Cryptographic authentication processing
        console.log(`[${requestId}] Comparing password...`);
        const bcryptStart = Date.now();
        const isMatch = await bcrypt.compare(password, user.password_hash);
        const bcryptDuration = Date.now() - bcryptStart;
        console.log(`[${requestId}] Password comparison completed in ${bcryptDuration}ms, match: ${isMatch}`);
        if (!isMatch) {
            console.log(`[${requestId}] Password mismatch`);
            throw new AppError('Invalid identification credentials.', 401);
        }

        // 4. Update timeline indicators
        console.log(`[${requestId}] Updating last_login_at...`);
        const updateStart = Date.now();
        await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        const updateDuration = Date.now() - updateStart;
        console.log(`[${requestId}] last_login_at updated in ${updateDuration}ms`);

        const totalDuration = Date.now() - queryStart;
        console.log(`[${requestId}] AUTH SERVICE LOGIN - Completed successfully in ${totalDuration}ms`);
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            profile_image: user.profile_image || user.profile_picture_url,
            profile_picture_url: user.profile_picture_url || user.profile_image,
            role: user.role_name
        };
    },

    /**
     * Logout function (JWT-based authentication - no database session invalidation needed)
     * Session invalidation is handled by clearing HTTP-only cookies on the client side.
     * The sessions table was unused and has been removed.
     */
    logout: async (refreshToken) => {
        // JWT tokens are stateless - logout is handled by clearing cookies
        // No database operation needed
        return true;
    },

    /**
     * Google OAuth login - Professional implementation with account linking
     * Security: One email = one account, verified OAuth providers only
     */
    googleLogin: async (email, name, googleId, picture) => {
        const requestId = `AUTH_SERVICE_GOOGLE_LOGIN_${Date.now()}`;
        console.log(`[${requestId}] AUTH SERVICE GOOGLE LOGIN - Starting for email: ${email}`);
        
        console.log(`[${requestId}] Calling pool.connect()...`);
        const connectStart = Date.now();
        const client = await pool.connect();
        const connectDuration = Date.now() - connectStart;
        console.log(`[${requestId}] pool.connect() completed in ${connectDuration}ms`);
        console.log(`[${requestId}] Pool status:`, { totalCount: pool.totalCount, idleCount: pool.idleCount, waitingCount: pool.waitingCount });

        try {
            console.log(`[${requestId}] Starting transaction...`);
            await client.query('BEGIN');
            console.log(`[${requestId}] Transaction started`);

            // 1. Check if account exists with this email (primary identifier)
            const userQuery = `
                SELECT u.id, u.email, u.username, u.is_active, u.is_deleted, u.profile_image, u.profile_picture_url,
                       u.oauth_provider, u.oauth_provider_id, u.password_hash,
                       r.name AS role_name
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.email = $1;
            `;
            console.log(`[${requestId}] Executing user query...`);
            const queryStart = Date.now();
            const result = await client.query(userQuery, [email]);
            const queryDuration = Date.now() - queryStart;
            console.log(`[${requestId}] User query completed in ${queryDuration}ms, rows: ${result.rows.length}`);

            // 2. EXISTING ACCOUNT - Link OAuth if not already linked
            if (result.rows.length > 0) {
                const user = result.rows[0];
                console.log(`[${requestId}] Existing user found:`, { id: user.id, email: user.email, oauth_provider: user.oauth_provider });
                
                // Security check: Account status
                if (!user.is_active || user.is_deleted) {
                    console.log(`[${requestId}] User account suspended or deactivated`);
                    throw new AppError('This user account is suspended or deactivated.', 403);
                }

                // Link Google OAuth to existing account if not already linked
                if (!user.oauth_provider_id || user.oauth_provider_id !== googleId) {
                    console.log(`[${requestId}] Linking Google OAuth to existing account...`);
                    await client.query(
                        `UPDATE users 
                         SET oauth_provider = $1, 
                             oauth_provider_id = $2, 
                             profile_picture_url = $3,
                             last_login_at = CURRENT_TIMESTAMP,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = $4`,
                        ['google', googleId, picture, user.id]
                    );
                    console.log(`[${requestId}] OAuth linked successfully`);

                    // Audit log: OAuth linked to existing account
                    await client.query(
                        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
                         VALUES ($1, 'oauth_linked', 'user', $2, $3)`,
                        [user.id, user.id, JSON.stringify({ provider: 'google', method: 'google_login' })]
                    );
                } else {
                    console.log(`[${requestId}] OAuth already linked, updating profile picture...`);
                    // Just update login time and profile picture
                    await client.query(
                        `UPDATE users 
                         SET last_login_at = CURRENT_TIMESTAMP,
                             profile_picture_url = $1
                         WHERE id = $2`,
                        [picture, user.id]
                    );
                }

                console.log(`[${requestId}] Committing transaction...`);
                await client.query('COMMIT');
                console.log(`[${requestId}] Transaction committed`);

                const totalDuration = Date.now() - connectStart;
                console.log(`[${requestId}] AUTH SERVICE GOOGLE LOGIN - Completed successfully in ${totalDuration}ms`);
                return {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    profile_image: user.profile_image || user.profile_picture_url,
                    role: user.role_name
                };
            }

            // 3. NEW ACCOUNT - Create with Google OAuth
            console.log(`[${requestId}] Creating new user account...`);
            // Get the 'user' role UUID
            const roleQuery = await client.query(
                "SELECT id FROM roles WHERE name = 'user' LIMIT 1"
            );
            
            if (roleQuery.rows.length === 0) {
                throw new AppError('Default user role not found. Please run role seeding.', 500);
            }
            
            const userRoleId = roleQuery.rows[0].id;

            // Generate unique username from email or name
            let baseUsername = name || email.split('@')[0];
            let username = baseUsername;
            let attempts = 0;
            const maxAttempts = 10;
            
            // Ensure username uniqueness (professional approach)
            while (attempts < maxAttempts) {
                const usernameCheck = await client.query(
                    'SELECT 1 FROM users WHERE username = $1',
                    [username]
                );
                
                if (usernameCheck.rows.length === 0) {
                    break; // Username is unique
                }
                
                // Generate next variation
                attempts++;
                username = `${baseUsername}${attempts}`;
            }

            if (attempts >= maxAttempts) {
                // Fallback to UUID-based unique username
                username = `${baseUsername}_${Date.now()}`;
            }

            // Insert new user
            const userInsertQuery = `
                INSERT INTO users (
                    email, username, password_hash, role_id, 
                    profile_picture_url, oauth_provider, oauth_provider_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, email, username, profile_picture_url, created_at;
            `;
            const userResult = await client.query(userInsertQuery, [
                email, 
                username, 
                'OAUTH_NO_PASSWORD', // Clear marker for OAuth-only accounts
                userRoleId,
                picture,
                'google',
                googleId
            ]);
            const newUser = userResult.rows[0];
            console.log(`[${requestId}] New user created:`, { id: newUser.id, email: newUser.email });

            // Create user status (email auto-verified for OAuth)
            await client.query(
                `INSERT INTO user_status (user_id, account_status, email_verified, phone_verified, two_fa_enabled)
                 VALUES ($1, 'active', TRUE, FALSE, FALSE)`,
                [newUser.id]
            );

            // Create default wallets for the user
            const defaultCurrencies = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'];
            const isDevelopment = process.env.NODE_ENV !== 'production';
            const initialUSDTBalance = isDevelopment ? (parseInt(process.env.TEST_INITIAL_USDT || '1000') || 0) : 0;
            
            for (const currency of defaultCurrencies) {
                // Insert wallet (only add test balance in development)
                const initialBalance = currency === 'USDT' ? initialUSDTBalance : 0;
                await client.query(
                    `INSERT INTO wallets (user_id, currency, balance, locked_balance)
                     VALUES ($1, $2, $3, 0)
                     ON CONFLICT (user_id, currency) DO NOTHING`,
                    [newUser.id, currency, initialBalance]
                );

                // If it's USDT and we added a balance, record the transaction
                if (currency === 'USDT' && initialBalance > 0) {
                    await client.query(
                        `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, status, confirmed_at)
                         SELECT $1, id, 'deposit', $2, $3, 'completed', CURRENT_TIMESTAMP
                         FROM wallets 
                         WHERE user_id = $1 AND currency = $2`,
                        [newUser.id, currency, initialBalance]
                    );
                }
            }

            // Audit log: New account created via OAuth
            await client.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
                 VALUES ($1, 'account_created', 'user', $2, $3)`,
                [newUser.id, newUser.id, JSON.stringify({ provider: 'google', method: 'oauth_registration' })]
            );

            console.log(`[${requestId}] Committing transaction...`);
            await client.query('COMMIT');
            console.log(`[${requestId}] Transaction committed`);

            const totalDuration = Date.now() - connectStart;
            console.log(`[${requestId}] AUTH SERVICE GOOGLE LOGIN - Completed successfully in ${totalDuration}ms`);
            return {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                profile_image: newUser.profile_picture_url,
                role: 'user' // New OAuth accounts are always created with 'user' role
            };

        } catch (error) {
            console.error(`[${requestId}] ERROR in googleLogin:`, error.message, error.code);
            await client.query('ROLLBACK');
            console.log(`[${requestId}] Transaction rolled back`);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(error.message || 'Google login flow failed.', 500);
        } finally {
            console.log(`[${requestId}] Releasing client...`);
            client.release();
            console.log(`[${requestId}] Client released`);
        }
    },

    /**
     * Generates and sends OTP for registration
     */
    sendOTP: async (email, username = null) => {
        logger.debug('Sending OTP', { 
            smtpConfigValid,
            transporterExists: !!transporter,
            isDev,
        });
        
        // Check if user already exists by email
        const existingEmailCheck = await query(
            'SELECT 1 FROM users WHERE email = $1',
            [email]
        );

        if (existingEmailCheck.rows.length > 0) {
            logger.warn('OTP blocked: Email already registered', { email });
            throw new AppError('Email already registered. Please login instead.', 400);
        }

        // Check if username already exists (if provided)
        if (username) {
            const existingUsernameCheck = await query(
                'SELECT 1 FROM users WHERE username = $1',
                [username]
            );

            if (existingUsernameCheck.rows.length > 0) {
                logger.warn('OTP blocked: Username already taken', { username });
                throw new AppError('Username already taken. Please choose another username.', 400);
            }
        }

        // Check for cooldown (1 minute)
        const cooldownKey = `otp-cooldown:${email}`;
        const cooldown = await redisClient.get(cooldownKey);
        if (cooldown) {
            throw new AppError('Please wait 60 seconds before requesting a new OTP.', 429);
        }

        // Fail closed when email delivery is unavailable in production. We must
        // never report a successful send when no message can actually go out.
        const canSendEmail = smtpConfigValid && transporter;
        if (!canSendEmail && !isDev) {
            logger.error('CRITICAL: Cannot send OTP - SMTP is not configured in production', { email });
            throw new AppError('Email delivery is currently unavailable. Please try again later.', 503);
        }

        // Generate 6-digit OTP using a cryptographically secure RNG
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Store OTP in Redis with 5-minute expiration and reset the attempt counter
        await redisClient.setEx(`otp:${email}`, 300, otp);
        await redisClient.del(`otp-attempts:${email}`);
        // Set cooldown
        await redisClient.setEx(cooldownKey, 60, '1');

        // Send OTP via SMTP
        try {
            if (smtpConfigValid && transporter) {
                logger.info('Sending OTP email via SMTP');
                
                const mailOptions = {
                    from: '"Prime Alfa Trade" <noreply@primealfatrade.com>',
                    replyTo: 'support@primealfatrade.com',
                    to: email,
                    subject: 'Your Prime Alfa Trade Verification Code',
                    text: `
Welcome to Prime Alfa Trade!

Thank you for registering.

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for 5 minutes. Please don't share it with anyone.

If you didn't request this, please ignore this email.

Best regards,
Prime Alfa Trade Team
                    `,
                    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Prime Alfa Trade Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
    <h1 style="color: #1a73e8; margin-top: 0;">Welcome to Prime Alfa Trade!</h1>
    <p style="font-size: 16px; color: #666;">
      Thank you for registering.
    </p>
    <p style="background: #f0f7ff; padding: 12px; border-radius: 4px; border-left: 4px solid #1a73e8;">
      <strong>Your One-Time Password (OTP):</strong>
    </p>
    <div style="font-size: 32px; font-weight: bold; color: #1a73e8; padding: 20px; background: #f0f7ff; text-align: center; margin: 20px 0; border-radius: 8px; letter-spacing: 4px;">
      ${otp}
    </div>
    <p style="font-size: 14px; color: #888;">
      This OTP is valid for <strong>5 minutes</strong>. Please don't share it with anyone.
    </p>
    <p style="font-size: 13px; color: #999;">
      If you didn't request this, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    <p style="color: #666; font-size: 14px;">
      Best regards,<br>
      Prime Alfa Trade Team
    </p>
  </div>
</body>
</html>
                    `,
                    headers: {
                        'X-Priority': '3',
                        'X-MSMail-Priority': 'Normal',
                        'X-Mailer': 'PrimeAlfaTradeBackend',
                    },
                };
                
                const info = await transporter.sendMail(mailOptions);
                logger.info('OTP email sent successfully', { 
                    messageId: info.messageId,
                    response: info.response,
                    accepted: info.accepted,
                });
                
            } else {
                // Development fallback: OTP is stored in Redis; log it so local
                // flows can complete without SMTP configured.
                logger.warn('SMTP not configured - OTP issued but NOT emailed (dev mode)', { email, otp });
            }
        } catch (err) {
            logger.error('Failed to send OTP email', { error: err.message });
            // Invalidate the OTP so it cannot be used if delivery failed.
            await redisClient.del(`otp:${email}`).catch(() => {});
            if (!isDev) {
                throw new AppError('Failed to send OTP email. Please try again later.', 503);
            }
        }
        
        // OTP sent successfully

        return { message: 'OTP sent successfully' };
    },

    /**
     * Verifies OTP
     */
    verifyOTP: async (email, otp) => {
        const attemptsKey = `otp-attempts:${email}`;
        const attempts = Number(await redisClient.get(attemptsKey)) || 0;

        if (attempts >= 5) {
            await redisClient.del(`otp:${email}`);
            await redisClient.del(attemptsKey);
            throw new AppError('Too many invalid OTP attempts. Please request a new OTP.', 429);
        }

        const storedOTP = await redisClient.get(`otp:${email}`);

        if (!storedOTP) {
            throw new AppError('OTP expired or not found. Please request a new one.', 400);
        }

        // Normalize both OTPs
        const normalizedStoredOTP = storedOTP.toString().trim();
        const normalizedInputOTP = otp.toString().trim();

        if (normalizedStoredOTP !== normalizedInputOTP) {
            const nextAttempts = attempts + 1;
            if (nextAttempts >= 5) {
                await redisClient.del(`otp:${email}`);
                await redisClient.del(attemptsKey);
                throw new AppError('Too many invalid OTP attempts. Please request a new OTP.', 429);
            }
            await redisClient.setEx(attemptsKey, 300, String(nextAttempts));
            throw new AppError('Invalid OTP. Please try again.', 400);
        }

        // Consume the OTP so it cannot be replayed
        await redisClient.del(`otp:${email}`);
        await redisClient.del(attemptsKey);

        return { message: 'OTP verified successfully' };
    },

    /**
     * Sends password reset link to email
     */
    forgotPassword: async (email) => {
        logger.info('Password reset requested', { email });
        
        // Get frontend URL from environment
        const rawFrontendUrl = process.env.FRONTEND_URL;
        
        // Check if user exists
        const userResult = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // Don't reveal whether email exists for security
            return { message: 'If an account exists for this email, we have sent password reset instructions.' };
        }

        logger.info('User found for password reset', { email });

        // Generate reset token
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Store reset token in Redis with 1 hour expiration
        await redisClient.setEx(`reset-token:${resetToken}`, 3600, { email, userId: userResult.rows[0].id });
        logger.debug('Reset token stored in Redis');

        // Get and trim frontend URL - also remove any leading/trailing whitespace, newlines, etc.
        const frontendUrl = (rawFrontendUrl || 'http://localhost:5173').trim().replace(/\s+/g, '');

        // Send email with reset link (don't fail the request if email fails)
        try {
            const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
            
            if (transporter) {
                await transporter.sendMail({
                    from: '"Prime Alfa Trade" <noreply@primealfatrade.com>',
                    to: email,
                    subject: 'Reset Your Password',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #333;">Reset Your Password</h2>
                            <p style="font-size: 16px; color: #666;">
                                You requested to reset your password. Click the button below to set a new password.
                            </p>
                            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #1a73e8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                                Reset Password
                            </a>
                            <p style="font-size: 14px; color: #888;">
                                This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                            </p>
                        </div>
                    `,
                });
                logger.info('Password reset email sent successfully');
            } else {
                logger.warn('SMTP transporter not available - reset link logged to console');
            }
        } catch (err) {
            logger.error('Error sending reset email', { error: err.message });
        }
        
        logger.info('Password reset email processed');

        return { message: 'If an account exists for this email, we have sent password reset instructions.' };
    },

    /**
     * Resets password using reset token
     */
    resetPassword: async (token, newPassword) => {
        logger.info('Password reset requested', { tokenPrefix: token.substring(0, 10) + '...' });
        
        // Get reset token from Redis
        const storedData = await redisClient.get(`reset-token:${token}`);
        
        if (!storedData) {
            logger.warn('Reset token not found or expired');
            throw new AppError('Reset token expired or invalid. Please request a new password reset.', 400);
        }

        const { email, userId } = storedData;
        logger.info('Reset token valid for user');

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user's password
        await query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, userId]
        );
        logger.info('Password updated successfully');

        // Delete reset token from Redis
        await redisClient.del(`reset-token:${token}`);
        logger.debug('Reset token deleted from Redis');

        return { message: 'Password reset successfully. You can now login with your new password.' };
    }
};

export default authService;