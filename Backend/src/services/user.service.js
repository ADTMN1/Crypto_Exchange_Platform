import bcrypt from 'bcrypt';
import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import { Readable } from 'stream';

// Cache for Cloudinary instance
let cloudinary = null;
let cloudinaryInitialized = false;

const initCloudinary = async () => {
  if (cloudinaryInitialized) return cloudinary;
  
  try {
    const cloudinaryConfig = await import('../config/cloudinary.config.js');
    const cl = cloudinaryConfig.default;
    
    // Check if Cloudinary is properly configured
    const config = cl.config();
    if (config.cloud_name) {
      cloudinary = cl;
    } else {
      cloudinary = null;
    }
  } catch (e) {
    console.warn('⚠️ Cloudinary not available');
    cloudinary = null;
  }
  
  cloudinaryInitialized = true;
  return cloudinary;
};

const userService = {

  // ─── PROFILE ────────────────────────────────────────────────────────────────

  getProfile: async (userId) => {
    const result = await query(
      `SELECT
         u.id, u.email, u.username, u.phone_number,
         u.profile_picture_url, u.oauth_provider,
         u.is_active, u.created_at, u.updated_at, u.last_login_at,
         r.name AS role,
         us.account_status, us.email_verified,
         us.phone_verified, us.two_fa_enabled,
         us.kyc_status, us.kyc_submitted_at, us.kyc_verified_at,
         us.kyc_rejected_at, us.kyc_rejection_reason
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
    if (email || phone_number || username) {
      const conflict = await query(
        `SELECT 1 FROM users
         WHERE (email = $1 OR phone_number = $2 OR username = $3)
           AND id != $4 AND is_deleted = FALSE`,
        [email ?? null, phone_number ?? null, username ?? null, userId]
      );
      if (conflict.rows.length > 0) {
        throw new AppError('Email, phone or username already in use by another account.', 409);
      }
    }

    const result = await query(
      `UPDATE users
       SET
         username     = COALESCE($1, username),
         email        = COALESCE($2, email),
         phone_number = COALESCE($3, phone_number),
         updated_at   = CURRENT_TIMESTAMP
       WHERE id = $4 AND is_deleted = FALSE
       RETURNING id, email, username, phone_number, profile_picture_url`,
      [username ?? null, email ?? null, phone_number ?? null, userId]
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
    const cloudinary = await initCloudinary();
    if (!cloudinary) {
      throw new AppError('Cloudinary not configured', 500);
    }
    
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
      const cloudinary = await initCloudinary();
      if (cloudinary) {
        try {
          await cloudinary.uploader.destroy(`crypto_exchange/profiles/user_${userId}`);
        } catch (error) {
          console.warn('Failed to delete profile image from Cloudinary:', error);
        }
      }
    }

    await query(
      'UPDATE users SET profile_picture_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  },

  // ─── EMAIL VERIFICATION ─────────────────────────────────────────────────────
  // user_status.account_status uses account_status_enum: 'pending','active','suspended','banned'

  verifyEmail: async (userId) => {
    const result = await query(
      `UPDATE user_status
       SET
         email_verified = TRUE,
         account_status = CASE
           WHEN account_status = 'pending' THEN 'active'
           ELSE account_status
         END,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING email_verified, account_status`,
      [userId]
    );
    if (result.rows.length === 0) throw new AppError('User status record not found', 404);

    // Sync is_active on users table when activating
    await query(
      `UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND is_deleted = FALSE`,
      [userId]
    );

    return result.rows[0];
  },

  // ─── ACCOUNT SELF-DELETION (soft delete on users table) ─────────────────────

  deleteAccount: async (userId) => {
    const result = await query(
      `UPDATE users
       SET is_deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND is_deleted = FALSE
       RETURNING id`,
      [userId]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);
  },

  // ─── ADMIN: USER LISTING ────────────────────────────────────────────────────

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

    const countParams = [...params];
    params.push(limit, offset);

    const result = await query(
      `SELECT
         u.id, u.email, u.username, u.phone_number,
         u.is_active, u.created_at, u.last_login_at,
         r.name AS role,
         us.account_status, us.email_verified, us.phone_verified,
         us.two_fa_enabled,
         us.kyc_status, us.kyc_submitted_at, us.kyc_verified_at,
         us.kyc_rejected_at, us.kyc_rejection_reason
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
       ${where}`,
      countParams
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  getActiveUsers: async (page = 1, limit = 20) =>
    userService.getAllUsers({ page, limit, status: 'active' }),

  getBannedUsers: async (page = 1, limit = 20) =>
    userService.getAllUsers({ page, limit, status: 'banned' }),

  getUserById: async (targetUserId) => {
    const result = await query(
      `SELECT
         u.id, u.email, u.username, u.phone_number,
         u.profile_picture_url, u.oauth_provider,
         u.is_active, u.created_at, u.last_login_at,
         r.name AS role,
         us.account_status, us.email_verified,
         us.phone_verified, us.two_fa_enabled,
         us.kyc_status, us.kyc_submitted_at, us.kyc_verified_at,
         us.kyc_rejected_at, us.kyc_rejection_reason
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN user_status us ON us.user_id = u.id
       WHERE u.id = $1 AND u.is_deleted = FALSE`,
      [targetUserId]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);
    return result.rows[0];
  },

  // ─── ADMIN: USER STATUS ──────────────────────────────────────────────────────
  // Updates user_status.account_status (enum) AND syncs users.is_active

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
         SET account_status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [newStatus, targetUserId]
      );

      await client.query(
        `UPDATE users
         SET is_active = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND is_deleted = FALSE`,
        [newStatus === 'active', targetUserId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  banUser: async (targetUserId) => userService.setUserStatus(targetUserId, 'banned'),

  unbanUser: async (targetUserId) => userService.setUserStatus(targetUserId, 'active'),

  // ─── ADMIN: DELETE USER ──────────────────────────────────────────────────────

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

  // ─── ADMIN: USER TRANSACTIONS ────────────────────────────────────────────────

  getUserTransactions: async (targetUserId, page = 1, limit = 20) => {
    // Verify user exists
    const userCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE',
      [targetUserId]
    );
    if (userCheck.rows.length === 0) throw new AppError('User not found', 404);

    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT id, type, currency, amount, fee, status, tx_hash,
              from_address, to_address, created_at, confirmed_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [targetUserId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
      [targetUserId]
    );
    return {
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  // ─── ADMIN: USER WALLETS ─────────────────────────────────────────────────────

  getUserWallets: async (targetUserId) => {
    const userCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE',
      [targetUserId]
    );
    if (userCheck.rows.length === 0) throw new AppError('User not found', 404);

    const result = await query(
      `SELECT id, currency, balance, locked_balance, created_at
       FROM wallets
       WHERE user_id = $1
       ORDER BY currency`,
      [targetUserId]
    );
    return result.rows;
  },
};

export default userService;
