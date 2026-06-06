import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';

const notificationService = {

  // ─── CREATE NOTIFICATION RECORD ─────────────────────────────────────────────

  createNotification: async ({ type, title, body, metadata = null }) => {
    if (!type || !title || !body) {
      throw new AppError('type, title, and body are required.', 400);
    }

    const result = await query(
      `INSERT INTO notifications (type, title, body, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [type, title, body, metadata ?? null]
    );

    return result.rows[0];
  },

  // ─── SEND TO ONE USER ───────────────────────────────────────────────────────

  sendToUser: async ({ userId, type, title, body, metadata = null }) => {
    if (!userId) throw new AppError('userId is required.', 400);

    const userCheck = await query(
      `SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE`,
      [userId]
    );
    if (userCheck.rows.length === 0) throw new AppError('User not found.', 404);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const notif = await client.query(
        `INSERT INTO notifications (type, title, body, metadata)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [type, title, body, metadata ?? null]
      );

      await client.query(
        `INSERT INTO notification_recipients (notification_id, user_id)
         VALUES ($1, $2)`,
        [notif.rows[0].id, userId]
      );

      await client.query('COMMIT');
      return notif.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ─── SEND TO ALL USERS ──────────────────────────────────────────────────────

  sendToAllUsers: async ({ type, title, body, metadata = null }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const notif = await client.query(
        `INSERT INTO notifications (type, title, body, metadata)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [type, title, body, metadata ?? null]
      );

      const users = await client.query(
        `SELECT id FROM users WHERE is_deleted = FALSE AND is_active = TRUE`
      );

      if (users.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('No active users found.', 404);
      }

      const notificationId = notif.rows[0].id;
      const values = users.rows
        .map((_, i) => `($1, $${i + 2})`)
        .join(', ');
      const params = [notificationId, ...users.rows.map((u) => u.id)];

      await client.query(
        `INSERT INTO notification_recipients (notification_id, user_id) VALUES ${values}`,
        params
      );

      await client.query('COMMIT');
      return { notification: notif.rows[0], recipientCount: users.rows.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ─── SEND BY USER STATUS ────────────────────────────────────────────────────

  sendByStatus: async ({ status, type, title, body, metadata = null }) => {
    const validStatuses = ['pending', 'active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const notif = await client.query(
        `INSERT INTO notifications (type, title, body, metadata)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [type, title, body, metadata ?? null]
      );

      const users = await client.query(
        `SELECT u.id FROM users u
         JOIN user_status us ON us.user_id = u.id
         WHERE u.is_deleted = FALSE
           AND us.account_status = $1`,
        [status]
      );

      if (users.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError(`No users found with status '${status}'.`, 404);
      }

      const notificationId = notif.rows[0].id;
      const values = users.rows
        .map((_, i) => `($1, $${i + 2})`)
        .join(', ');
      const params = [notificationId, ...users.rows.map((u) => u.id)];

      await client.query(
        `INSERT INTO notification_recipients (notification_id, user_id) VALUES ${values}`,
        params
      );

      await client.query('COMMIT');
      return { notification: notif.rows[0], recipientCount: users.rows.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ─── GET USER NOTIFICATIONS ─────────────────────────────────────────────────

  getUserNotifications: async (userId, { page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
         nr.id          AS notification_id,
         n.title,
         n.body,
         n.type,
         nr.is_read,
         nr.read_at,
         n.created_at
       FROM notification_recipients nr
       JOIN notifications n ON n.id = nr.notification_id
       WHERE nr.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM notification_recipients WHERE user_id = $1`,
      [userId]
    );

    return {
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  // ─── GET ADMIN NOTIFICATIONS ────────────────────────────────────────────────

  getAdminNotifications: async ({ page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
         n.id           AS notification_id,
         n.title,
         n.type,
         n.created_at,
         COUNT(nr.id)                                      AS total_recipients,
         COUNT(nr.id) FILTER (WHERE nr.is_read = TRUE)     AS read_count,
         COUNT(nr.id) FILTER (WHERE nr.is_read = FALSE)    AS unread_count
       FROM notifications n
       LEFT JOIN notification_recipients nr ON nr.notification_id = n.id
       GROUP BY n.id
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) FROM notifications`);

    return {
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  // ─── MARK AS READ ───────────────────────────────────────────────────────────

  markAsRead: async (notificationId, userId) => {
    const result = await query(
      `UPDATE notification_recipients
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found or does not belong to this user.', 404);
    }

    return result.rows[0];
  },
};

export default notificationService;
