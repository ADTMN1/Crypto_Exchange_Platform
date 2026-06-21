import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import walletService from './wallet.service.js';

const withdrawalService = {

  // ─── USER: Create Withdrawal Request ────────────────────────────────────────
  createWithdrawal: async (userId, { amount, currency, withdrawalAddress, network, paymentMethod, fee = 0 }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get wallet with lock
      const walletRes = await client.query(
        `SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE`,
        [userId, currency]
      );

      if (walletRes.rows.length === 0) {
        throw new AppError(`No ${currency} wallet found`, 404);
      }

      const wallet = walletRes.rows[0];
      const parsedAmount = parseFloat(amount);
      const parsedFee = parseFloat(fee);

      if (parseFloat(wallet.balance) < parsedAmount) {
        throw new AppError('Insufficient balance', 400);
      }

      // Lock the withdrawal amount (moves from balance to locked_balance)
      await walletService.lock(userId, currency, parsedAmount, client);

      const result = await client.query(
        `INSERT INTO withdrawals
          (user_id, wallet_id, amount, fee, currency, payment_method, withdrawal_address, network, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
         RETURNING *`,
        [userId, wallet.id, parsedAmount, parsedFee, currency, paymentMethod || null, withdrawalAddress, network || null]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ─── USER: Get My Withdrawals ────────────────────────────────────────────────
  getUserWithdrawals: async (userId, status, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const params = [userId];
    let whereClause = `WHERE w.user_id = $1`;

    if (status && status !== 'ALL') {
      params.push(status);
      whereClause += ` AND w.status = $${params.length}`;
    }

    const [dataRes, countRes] = await Promise.all([
      query(
        `SELECT w.*,
                u.username, u.email,
                wal.currency as wallet_currency,
                p.username as processed_by_username
         FROM withdrawals w
         JOIN users u ON u.id = w.user_id
         JOIN wallets wal ON wal.id = w.wallet_id
         LEFT JOIN users p ON p.id = w.processed_by
         ${whereClause}
         ORDER BY w.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM withdrawals w ${whereClause}`, params),
    ]);

    return {
      withdrawals: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit,
    };
  },

  // ─── ADMIN: Get All Withdrawals ──────────────────────────────────────────────
  getAllWithdrawals: async (status, page = 1, limit = 50) => {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = '';

    if (status && status !== 'ALL') {
      params.push(status);
      whereClause = `WHERE w.status = $1`;
    }

    const [dataRes, countRes] = await Promise.all([
      query(
        `SELECT w.*,
                u.username, u.email,
                p.username as processed_by_username
         FROM withdrawals w
         JOIN users u ON u.id = w.user_id
         LEFT JOIN users p ON p.id = w.processed_by
         ${whereClause}
         ORDER BY w.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM withdrawals w ${whereClause}`, params),
    ]);

    return {
      withdrawals: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit,
    };
  },

  // ─── ADMIN: Get Single Withdrawal ───────────────────────────────────────────
  getWithdrawalById: async (withdrawalId) => {
    const res = await query(
      `SELECT w.*,
              u.username, u.email,
              p.username as processed_by_username
       FROM withdrawals w
       JOIN users u ON u.id = w.user_id
       LEFT JOIN users p ON p.id = w.processed_by
       WHERE w.id = $1`,
      [withdrawalId]
    );
    if (res.rows.length === 0) throw new AppError('Withdrawal not found', 404);
    return res.rows[0];
  },

  // ─── ADMIN: Approve Withdrawal ───────────────────────────────────────────────
  approveWithdrawal: async (withdrawalId, adminId, adminNote) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the withdrawal row to prevent concurrent processing
      const wRes = await client.query(
        `SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE`,
        [withdrawalId]
      );

      if (wRes.rows.length === 0) throw new AppError('Withdrawal not found', 404);
      const withdrawal = wRes.rows[0];

      if (withdrawal.status !== 'PENDING') {
        throw new AppError(`Cannot approve a ${withdrawal.status} withdrawal`, 400);
      }

      // Burn the locked withdrawal amount (permanently deduct from locked_balance)
      await walletService.burn(withdrawal.user_id, withdrawal.currency, parseFloat(withdrawal.amount), client);

      // Record the debit transaction (already done in burn, but let's make sure? Wait no, wallet.service.js burn does that!)
      // Wait let's check wallet.service.js burn() to confirm... Yes, it inserts a transaction!

      // Update withdrawal status
      const now = new Date();
      const updated = await client.query(
        `UPDATE withdrawals
         SET status = 'APPROVED', admin_note = $1, processed_by = $2,
             processed_at = $3, approved_at = $3, completed_at = $3, updated_at = $3
         WHERE id = $4
         RETURNING *`,
        [adminNote || null, adminId, now, withdrawalId]
      );

      await client.query('COMMIT');
      return updated.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ─── ADMIN: Reject Withdrawal ────────────────────────────────────────────────
  rejectWithdrawal: async (withdrawalId, adminId, adminNote, rejectionReason) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const wRes = await client.query(
        `SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE`,
        [withdrawalId]
      );

      if (wRes.rows.length === 0) throw new AppError('Withdrawal not found', 404);
      const withdrawal = wRes.rows[0];

      if (withdrawal.status !== 'PENDING') {
        throw new AppError(`Cannot reject a ${withdrawal.status} withdrawal`, 400);
      }

      if (!rejectionReason) {
        throw new AppError('Rejection reason is required', 400);
      }

      // Release the locked withdrawal amount (move back to available balance)
      await walletService.release(withdrawal.user_id, withdrawal.currency, parseFloat(withdrawal.amount), client);

      const now = new Date();
      const updated = await client.query(
        `UPDATE withdrawals
         SET status = 'REJECTED', admin_note = $1, rejection_reason = $2,
             processed_by = $3, processed_at = $4, updated_at = $4
         WHERE id = $5
         RETURNING *`,
        [adminNote || null, rejectionReason, adminId, now, withdrawalId]
      );

      await client.query('COMMIT');
      return updated.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ─── ADMIN: Update Wallet Balance (internal use only) ───────────────────────
  adminUpdateWallet: async (walletId, operation, amount, reason, adminId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(
        `SELECT id, user_id, currency, balance FROM wallets WHERE id = $1 FOR UPDATE`,
        [walletId]
      );

      if (walletRes.rows.length === 0) throw new AppError('Wallet not found', 404);
      const wallet = walletRes.rows[0];
      const parsedAmount = parseFloat(amount);

      if (operation === 'DEBIT') {
        if (parseFloat(wallet.balance) < parsedAmount) {
          throw new AppError('Insufficient balance', 400);
        }
        await client.query(
          `UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2`,
          [parsedAmount, walletId]
        );
        await client.query(
          `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
           VALUES ($1, $2, 'withdrawal', $3, $4, 0, 'completed', NOW())`,
          [wallet.user_id, walletId, wallet.currency, parsedAmount]
        );
      } else {
        throw new AppError('Only DEBIT operation supported on this endpoint', 400);
      }

      await client.query('COMMIT');
      const updated = await query(`SELECT id, balance, currency FROM wallets WHERE id = $1`, [walletId]);
      return updated.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

export default withdrawalService;
