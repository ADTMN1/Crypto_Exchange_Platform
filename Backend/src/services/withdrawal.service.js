import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import walletService from './wallet.service.js';
import logger from '../utils/logger.js';

const withdrawalService = {

  // ─── USER: Create Withdrawal Request ────────────────────────────────────────
  createWithdrawal: async (userId, { amount, currency, withdrawalAddress, network, paymentMethod, fee = 0 }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure USDT wallet exists (create if needed)
      await client.query(
        `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
         VALUES ($1, 'USDT', 0, 0, 0)
         ON CONFLICT (user_id, currency) DO NOTHING`,
        [userId]
      );

      // Get USDT wallet with lock
      const walletRes = await client.query(
        `SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = 'USDT' FOR UPDATE`,
        [userId]
      );

      if (walletRes.rows.length === 0) {
        throw new AppError('No USDT wallet found', 404);
      }

      const wallet = walletRes.rows[0];
      const parsedAmount = parseFloat(amount);
      const parsedFee = parseFloat(fee);

      // Calculate USD value if withdrawing non-USDT currency
      let usdAmountToLock = parsedAmount;
      if (currency !== 'USDT') {
        // Calculate USD value (we can use calculateUsdValue from wallet.service, but let's just import it or duplicate it here? Wait, let's see—wait, calculateUsdValue is a helper in wallet.service.js, but it's not exported. Let's just handle it here for now
        const binanceService = (await import('./binance.service.js')).default;
        try {
          const prices = await binanceService.getAllPrices();
          const priceMap = new Map(prices.map(p => [p.symbol, p.price]));
          const symbol = `${currency}USDT`;
          const price = priceMap.get(symbol);
          if (price) {
            usdAmountToLock = parsedAmount * price;
          }
        } catch (err) {
          logger.error('Error fetching price for withdrawal', { error: err.message });
        }
      }

      if (parseFloat(wallet.balance) < usdAmountToLock) {
        throw new AppError(
          `Insufficient available balance. Available: ${parseFloat(wallet.balance).toFixed(2)} USDT, Required: ${usdAmountToLock.toFixed(2)} USDT. Some funds may be locked in pending trades or withdrawals.`,
          400
        );
      }

      // Lock the withdrawal amount (in USD value)
      await walletService.lock(userId, currency, usdAmountToLock, client);

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

      // The amount that was locked at request time (always USDT value)
      const lockedAmount = parseFloat(withdrawal.amount);

      // Get the wallet to check actual locked_balance
      const walletRes = await client.query(
        `SELECT id, locked_balance FROM wallets
         WHERE user_id = $1 AND currency = 'USDT'
         FOR UPDATE`,
        [withdrawal.user_id]
      );

      if (walletRes.rows.length === 0) throw new AppError('User wallet not found', 404);
      const wallet = walletRes.rows[0];
      const actualLocked = parseFloat(wallet.locked_balance);

      // Use the lesser of the two to avoid "Insufficient locked balance" on sync issues
      // but never deduct more than was originally locked for this withdrawal
      const amountToBurn = Math.min(lockedAmount, actualLocked);

      if (amountToBurn <= 0) {
        throw new AppError('No locked balance available to settle this withdrawal', 400);
      }

      // Burn from locked_balance and reduce usd_value
      await client.query(
        `UPDATE wallets
         SET locked_balance = locked_balance - $1,
             usd_value = GREATEST(0, usd_value - $1)
         WHERE id = $2`,
        [amountToBurn, wallet.id]
      );

      // Record the withdrawal transaction
      await client.query(
        `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
         VALUES ($1, $2, 'withdrawal', 'USDT', $3, $4, 'completed', NOW())`,
        [withdrawal.user_id, wallet.id, amountToBurn, parseFloat(withdrawal.fee || 0)]
      );

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

      const lockedAmount = parseFloat(withdrawal.amount);

      // Get wallet to check actual locked_balance
      const walletRes = await client.query(
        `SELECT id, locked_balance FROM wallets
         WHERE user_id = $1 AND currency = 'USDT'
         FOR UPDATE`,
        [withdrawal.user_id]
      );

      if (walletRes.rows.length === 0) throw new AppError('User wallet not found', 404);
      const wallet = walletRes.rows[0];
      const actualLocked = parseFloat(wallet.locked_balance);

      // Release back to available balance — use the lesser to avoid going negative
      const amountToRelease = Math.min(lockedAmount, actualLocked);

      if (amountToRelease > 0) {
        await client.query(
          `UPDATE wallets
           SET locked_balance = locked_balance - $1,
               balance = balance + $1
           WHERE id = $2`,
          [amountToRelease, wallet.id]
        );
      }

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

      // First, ensure we're working with a USDT wallet
      const walletRes = await client.query(
        `SELECT id, user_id, currency, balance FROM wallets WHERE id = $1 AND currency = 'USDT' FOR UPDATE`,
        [walletId]
      );

      if (walletRes.rows.length === 0) throw new AppError('USDT wallet not found', 404);
      const wallet = walletRes.rows[0];
      const parsedAmount = parseFloat(amount);

      if (operation === 'DEBIT') {
        if (parseFloat(wallet.balance) < parsedAmount) {
          throw new AppError('Insufficient balance', 400);
        }
        await client.query(
          `UPDATE wallets SET balance = balance - $1, usd_value = usd_value - $1, updated_at = NOW() WHERE id = $2`,
          [parsedAmount, walletId]
        );
        await client.query(
          `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
           VALUES ($1, $2, 'withdrawal', 'USDT', $3, 0, 'completed', NOW())`,
          [wallet.user_id, walletId, parsedAmount]
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
