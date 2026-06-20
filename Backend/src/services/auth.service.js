import bcrypt from 'bcrypt';
import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import redisClient from '../config/redis.config.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const authService = {
    /**
     * Executes account creation and lifecycle tracking maps.
     */
    register: async (email, username, phone_number, password, otp) => {
        // 1. Verify OTP first
        if (!otp) {
            throw new AppError('OTP is required for registration.', 400);
        }

        const storedOTP = await redisClient.get(`otp:${email}`);
        
        if (!storedOTP) {
            throw new AppError('OTP expired or not found. Please request a new one.', 400);
        }
        
        if (storedOTP !== otp) {
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

        return newUser;

        } catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof AppError) {
                throw error;
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
        const result = await query(userQuery, [email]);

        if (result.rows.length === 0) {
            throw new AppError('Invalid identification credentials.', 401);
        }

        const user = result.rows[0];
        
        if (!user.is_active || user.is_deleted) {
            throw new AppError('This user account is suspended or deactivated.', 403);
        }

        // 3. Cryptographic authentication processing
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new AppError('Invalid identification credentials.', 401);
        }

        // 4. Update timeline indicators
        await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

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
     * Performs structural invalidation sweeps over existing session records.
     */
    logout: async (refreshToken) => {
        if (!refreshToken) return false;
        
        const logoutQuery = 'UPDATE sessions SET is_revoked = TRUE WHERE refresh_token = $1;';
        const result = await query(logoutQuery, [refreshToken]);
        
        return result.rowCount > 0;
    },

    /**
     * Google OAuth login - Professional implementation with account linking
     * Security: One email = one account, verified OAuth providers only
     */
    googleLogin: async (email, name, googleId, picture) => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Check if account exists with this email (primary identifier)
            const userQuery = `
                SELECT u.id, u.email, u.username, u.is_active, u.is_deleted, u.profile_image, u.profile_picture_url,
                       u.oauth_provider, u.oauth_provider_id, u.password_hash,
                       r.name AS role_name
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.email = $1;
            `;
            const result = await client.query(userQuery, [email]);

            // 2. EXISTING ACCOUNT - Link OAuth if not already linked
            if (result.rows.length > 0) {
                const user = result.rows[0];
                
                // Security check: Account status
                if (!user.is_active || user.is_deleted) {
                    throw new AppError('This user account is suspended or deactivated.', 403);
                }

                // Link Google OAuth to existing account if not already linked
                if (!user.oauth_provider_id || user.oauth_provider_id !== googleId) {
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

                    // Audit log: OAuth linked to existing account
                    await client.query(
                        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
                         VALUES ($1, 'oauth_linked', 'user', $2, $3)`,
                        [user.id, user.id, JSON.stringify({ provider: 'google', method: 'google_login' })]
                    );
                } else {
                    // Just update login time and profile picture
                    await client.query(
                        `UPDATE users 
                         SET last_login_at = CURRENT_TIMESTAMP,
                             profile_picture_url = $1
                         WHERE id = $2`,
                        [picture, user.id]
                    );
                }

                await client.query('COMMIT');

                return {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    profile_image: user.profile_image || user.profile_picture_url,
                    role: user.role_name
                };
            }

            // 3. NEW ACCOUNT - Create with Google OAuth
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

            await client.query('COMMIT');

            return {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                profile_image: newUser.profile_picture_url,
                role: 'user' // New OAuth accounts are always created with 'user' role
            };

        } catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(error.message || 'Google login flow failed.', 500);
        } finally {
            client.release();
        }
    },

    /**
     * Generates and sends OTP for registration
     */
    sendOTP: async (email) => {
        // Check if user already exists
        const existingUserCheck = await query(
            'SELECT 1 FROM users WHERE email = $1',
            [email]
        );

        if (existingUserCheck.rows.length > 0) {
            throw new AppError('An account with this email already exists.', 409);
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in Redis with 5-minute expiration
        await redisClient.setEx(`otp:${email}`, 300, otp);
        
        // Send OTP via Resend
        try {
            const { data, error } = await resend.emails.send({
                from: 'Crypto Exchange <onboarding@resend.dev>',
                to: [email],
                subject: 'Your OTP for Crypto Exchange Registration',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #333;">Welcome to Crypto Exchange!</h2>
                        <p style="font-size: 16px; color: #666;">
                            Thank you for registering. Your One-Time Password (OTP) is:
                        </p>
                        <div style="font-size: 32px; font-weight: bold; color: #1a73e8; padding: 20px; background: #f0f7ff; text-align: center; margin: 20px 0; border-radius: 8px;">
                            ${otp}
                        </div>
                        <p style="font-size: 14px; color: #888;">
                            This OTP is valid for 5 minutes. Please don't share it with anyone.
                        </p>
                    </div>
                `,
            });

            if (error) {
                console.error('Resend error:', error);
                throw new AppError('Failed to send OTP email', 500);
            }
        } catch (err) {
            console.error('Error sending OTP:', err);
            // Fallback to logging OTP if email fails
            console.log(`🔐 OTP for ${email}: ${otp}`);
        }
        
        return { message: 'OTP sent successfully' };
    },

    /**
     * Verifies OTP
     */
    verifyOTP: async (email, otp) => {
        const storedOTP = await redisClient.get(`otp:${email}`);
        
        if (!storedOTP) {
            throw new AppError('OTP expired or not found. Please request a new one.', 400);
        }
        
        if (storedOTP !== otp) {
            throw new AppError('Invalid OTP. Please try again.', 400);
        }
        
        // Delete OTP after successful verification
        await redisClient.del(`otp:${email}`);
        
        return { message: 'OTP verified successfully' };
    },

    /**
     * Sends password reset link to email
     */
    forgotPassword: async (email) => {
        // Check if user exists
        const userResult = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // Don't reveal whether email exists for security
            return { message: 'If an account exists for this email, we have sent password reset instructions.' };
        }

        // Generate reset token
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Store reset token in Redis with 1 hour expiration
        await redisClient.setEx(`reset-token:${resetToken}`, 3600, JSON.stringify({ email, userId: userResult.rows[0].id }));

        // Send email with reset link
        try {
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
            const { error } = await resend.emails.send({
                from: 'Crypto Exchange <onboarding@resend.dev>',
                to: [email],
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

            if (error) {
                console.error('Resend error:', error);
            }
        } catch (err) {
            console.error('Error sending reset email:', err);
        }

        return { message: 'If an account exists for this email, we have sent password reset instructions.' };
    },

    /**
     * Resets password using reset token
     */
    resetPassword: async (token, newPassword) => {
        // Get reset token from Redis
        const storedData = await redisClient.get(`reset-token:${token}`);
        
        if (!storedData) {
            throw new AppError('Reset token expired or invalid. Please request a new password reset.', 400);
        }

        const { email, userId } = JSON.parse(storedData);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user's password
        await query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, userId]
        );

        // Delete reset token from Redis
        await redisClient.del(`reset-token:${token}`);

        return { message: 'Password reset successfully. You can now login with your new password.' };
    }
};

export default authService;