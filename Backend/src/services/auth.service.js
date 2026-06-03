import bcrypt from 'bcrypt';
import pool, { query } from '../config/db.config.js';

const authService = {
    /**
     * Executes account creation and lifecycle tracking maps.
     */
    register: async (email, username, phone_number, password) => {
        // 1. Structural check for conflicting existing identities
        const existingUserCheck = await query(
            'SELECT 1 FROM users WHERE email = $1 OR phone_number = $2',
            [email, phone_number]
        );

        if (existingUserCheck.rows.length > 0) {
            const error = new Error('An account with this email or phone number already exists.');
            error.statusCode = 409;
            throw error;
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
                throw new Error('Default user role not found. Please run role seeding.');
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

            await client.query('COMMIT');
            return newUser;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Validates identity combinations and signs updates to database access indicators.
     */
    login: async (email, password) => {
        // 1. Dynamic lookup checking email OR username vectors
        try {
     const userQuery = `
              SELECT 
                u.id,
                u.email,
                u.username,
                u.is_active,
                u.is_deleted,
                u.password_hash,
                r.id AS role_id,
                r.name AS role_name
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  WHERE u.email = $1;
`;
        const result = await query(userQuery, [email]);

        if (result.rows.length === 0) {
            const error = new Error('Invalid identification credentials.');
            error.statusCode = 401;
            throw error;
        }

        const user = result.rows[0];
        
        if (!user.is_active || user.is_deleted) {
            const error = new Error('This user account is suspended or deactivated.');
            error.statusCode = 403;
            throw error;
        }

        // 3. Cryptographic authentication processing
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            const error = new Error('Invalid identification credentials.');
            error.statusCode = 401;
            throw error;
        }

        // 4. Update timeline indicators
        await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            profile_image: user.profile_image,
            role: user.role_name
        };

        } catch (error) {
            throw error;    
            next(error);
        
        }
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
                SELECT id, email, username, is_active, is_deleted, profile_image, profile_picture_url,
                       oauth_provider, oauth_provider_id, password_hash
                FROM users 
                WHERE email = $1;
            `;
            const result = await client.query(userQuery, [email]);

            // 2. EXISTING ACCOUNT - Link OAuth if not already linked
            if (result.rows.length > 0) {
                const user = result.rows[0];
                
                // Security check: Account status
                if (!user.is_active || user.is_deleted) {
                    const error = new Error('This user account is suspended or deactivated.');
                    error.statusCode = 403;
                    throw error;
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
                    profile_image: user.profile_image || user.profile_picture_url
                };
            }

            // 3. NEW ACCOUNT - Create with Google OAuth
            // Get the 'user' role UUID
            const roleQuery = await client.query(
                "SELECT id FROM roles WHERE name = 'user' LIMIT 1"
            );
            
            if (roleQuery.rows.length === 0) {
                throw new Error('Default user role not found. Please run role seeding.');
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
                profile_image: newUser.profile_picture_url
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

export default authService;