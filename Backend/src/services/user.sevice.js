import bcrypt from 'bcrypt';
import cloudinary from '../config/cloudinary.config.js';
import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import { Readable } from 'stream';

const userService = {

  // ─── PROFILE ────────────────────────────────────────────────────────────────

  getProfile: async (userId) => {
    const result = await query(
      `SELECT 
         u.id, u.email, u.username, u.phone_number,
         u.profile_picture_url, u.oauth_provider,
         u.created_at, u.last_login_at,
         r.name AS role,
         us.account_status, us.email_verified,
         us.phone_verified, us.two_fa_enabled
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN user_status us ON us.user_id = u.id
       WHERE u.id = $1 AND u.is_deleted = FALSE`,
      [userId]
    );

    if (result.rows.length === 0) throw new AppError('User not found', 404);
    return result.rows[0];
  },

  updateProfile: async (userId, { username, email, phone_number }) => {
    // Check uniqueness conflicts (excluding current user)
    if (email || phone_number || username) {
      const conflict = await query(
        `SELECT 1 FROM users 
         WHERE (email = $1 OR phone_number = $2 OR username = $3) AND id != $4`,
        [email, phone_number, username, userId]
      );
      if (conflict.rows.length > 0) {
        throw new AppError('Email, phone or username already in use by another account.', 409);
      }
    }

    const result = await query(
      `UPDATE users 
       SET 
         username    = COALESCE($1, username),
         email       = COALESCE($2, email),
         phone_number = COALESCE($3, phone_number),
         updated_at  = CURRENT_TIMESTAMP
       WHERE id = $4 AND is_deleted = FALSE
       RETURNING id, email, username, phone_number, profile_picture_url`,
      [username, email, phone_number, userId]
    );

    if (result.rows.length === 0) throw new AppError('User not found', 404);
    return result.rows[0];
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_deleted = FALSE',
      [userId]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);

    const { password_hash } = result.rows[0];

    // OAuth-only accounts have no password
    if (password_hash === 'OAUTH_NO_PASSWORD') {
      throw new AppError('OAuth accounts cannot use password change.', 400);
    }

    const isMatch = await bcrypt.compare(currentPassword, password_hash);
    if (!isMatch) throw new AppError('Current password is incorrect.', 401);

    const newHash = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, userId]
    );
  },

  // ─── PROFILE IMAGE ──────────────────────────────────────────────────────────

  uploadProfileImage: async (userId, fileBuffer) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'crypto_exchange/profiles',
          public_id: `user_${userId}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
          ],
        },
        async (error, cloudResult) => {
          if (error) return reject(new AppError('Failed to upload image to Cloudinary', 500));

          try {
            const dbResult = await query(
              `UPDATE users 
               SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $2 AND is_deleted = FALSE
               RETURNING id, email, username, profile_picture_url`,
              [cloudResult.secure_url, userId]
            );

            if (dbResult.rows.length === 0) return reject(new AppError('User not found', 404));
            resolve({ imageUrl: cloudResult.secure_url, user: dbResult.rows[0] });
          } catch (dbError) {
            reject(new AppError('Failed to save profile image to database', 500));
          }
        }
      );

      Readable.from(fileBuffer).pipe(uploadStream);
    });
  },

  deleteProfileImage: async (userId) => {
    const result = await query(
      'SELECT profile_picture_url FROM users WHERE id = $1 AND is_deleted = FALSE',
      [userId]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);

    const { profile_picture_url } = result.rows[0];

    if (profile_picture_url) {
      const publicId = `crypto_exchange/profiles/user_${userId}`;
      await cloudinary.uploader.destroy(publicId);
    }

    await query(
      'UPDATE users SET profile_picture_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  },

  // ─── EMAIL VERIFICATION ─────────────────────────────────────────────────────

  verifyEmail: async (userId) => {
    const result = await query(
      `UPDATE user_status 
       SET email_verified = TRUE, 
           account_status = CASE WHEN account_status = 'pending' THEN 'active'::account_status_enum ELSE account_status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING email_verified, account_status`,
      [userId]
    );
    if (result.rows.length === 0) throw new AppError('User status record not found', 404);
    return result.rows[0];
  },

  // ─── ACCOUNT SELF-DELETION ──────────────────────────────────────────────────

  deleteAccount: async (userId, password) => {
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_deleted = FALSE',
      [userId]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);

    const { password_hash } = result.rows[0];

    if (password_hash !== 'OAUTH_NO_PASSWORD') {
      const isMatch = await bcrypt.compare(password, password_hash);
      if (!isMatch) throw new AppError('Password is incorrect.', 401);
    }

    // Soft delete
    await query(
      `UPDATE users 
       SET is_deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [userId]
    );
  },

  // ─── ADMIN: USER MANAGEMENT ─────────────────────────────────────────────────

  getAllUsers: async ({ page = 1, limit = 20, status, search } = {}) => {
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE u.is_deleted = FALSE';

    if (status) {
      params.push(status);
      where += ` AND us.account_status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.email ILIKE $${params.length} OR u.username ILIKE $${params.length})`;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT 
         u.id, u.email, u.username, u.phone_number,
         u.is_active, u.created_at, u.last_login_at,
         r.name AS role,
         us.account_status, us.email_verified, us.two_fa_enabled
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN user_status us ON us.user_id = u.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users u
       LEFT JOIN user_status us ON us.user_id = u.id
       ${where.replace(/LIMIT.+/, '')}`,
      params.slice(0, -2) // exclude limit/offset
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  getActiveUsers: async (page = 1, limit = 20) => {
    return userService.getAllUsers({ page, limit, status: 'active' });
  },

  getBannedUsers: async (page = 1, limit = 20) => {
    return userService.getAllUsers({ page, limit, status: 'banned' });
  },

  getUserById: async (targetUserId) => {
    const result = await query(
      `SELECT 
         u.id, u.email, u.username, u.phone_number,
         u.is_active, u.created_at, u.last_login_at,
         r.name AS role,
         us.account_status, us.email_verified, us.phone_verified, us.two_fa_enabled
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN user_status us ON us.user_id = u.id
       WHERE u.id = $1 AND u.is_deleted = FALSE`,
      [targetUserId]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);
    return result.rows[0];
  },

  setUserStatus: async (targetUserId, newStatus) => {
    const validStatuses = ['pending', 'active', 'suspended', 'banned'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE user_status 
         SET account_status = $1::account_status_enum, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $2`,
        [newStatus, targetUserId]
      );

      // Sync is_active flag on users table
      const isActive = newStatus === 'active';
      await client.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [isActive, targetUserId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  banUser: async (targetUserId) => {
    return userService.setUserStatus(targetUserId, 'banned');
  },

  unbanUser: async (targetUserId) => {
    return userService.setUserStatus(targetUserId, 'active');
  },

  adminDeleteUser: async (targetUserId) => {
    const result = await query(
      `UPDATE users 
       SET is_deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND is_deleted = FALSE
       RETURNING id`,
      [targetUserId]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);
  },
};

export default userService;
