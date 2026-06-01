import bcrypt from 'bcrypt';
import pool, { query } from '../config/db.config.js';

const authService = {
    /**
     * Executes account creation and lifecycle tracking maps.
     */
    register: async (email, username, phone_number, password, role_id) => {
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

            // 4. Populate structural Identity baseline
            const userInsertQuery = `
                INSERT INTO users (email, username, phone_number, password_hash, role_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, email, username, created_at;
            `;
            const userResult = await client.query(userInsertQuery, [
                email, username, phone_number, passwordHash, role_id
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
        const userQuery = `
            SELECT id, email, username, is_active, is_deleted,password_hash 
            FROM users 
            WHERE email = $1;
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
            username: user.username
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
    }
};

export default authService;