import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';

const walletService = {

  // ─── CORE BALANCE OPERATIONS ────────────────────────────────────────────────

  /**
   * Credit user wallet
   * @param {string} userId - User UUID
   * @param {string} currency - Currency code (BTC, ETH, USDT, etc.)
   * @param {number} amount - Amount to credit
   * @param {string} ref - Reference/description
   * @param {object} trx - Sequelize transaction object
   */
  credit: async (userId, currency, amount, ref, trx) => {
    if (amount <= 0) throw new AppError('Credit amount must be positive', 400);

    // Ensure wallet exists
    await trx.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

    // Update balance
    const walletResult = await trx.query(
      `UPDATE wallets
       SET balance = balance + $1
       WHERE user_id = $2 AND currency = $3
       RETURNING id, balance`,
      [amount, userId, currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet update failed', 500);
    }

    const wallet = walletResult.rows[0];

    // Record transaction
    await trx.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, status, tx_hash, confirmed_at)
       VALUES ($1, $2, 'deposit', $3, $4, 'completed', $5, CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount, ref]
    );

    return wallet;
  },

  /**
   * Debit user wallet
   * @param {string} userId - User UUID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to debit
   * @param {string} ref - Reference/description
   * @param {object} trx - Sequelize transaction object
   */
  debit: async (userId, currency, amount, ref, trx) => {
    if (amount <= 0) throw new AppError('Debit amount must be positive', 400);

    // Lock and check balance
    const walletResult = await trx.query(
      `SELECT id, balance FROM wallets
       WHERE user_id = $1 AND currency = $2
       FOR UPDATE`,
      [userId, currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    if (parseFloat(wallet.balance) < amount) {
      throw new AppError('INSUFFICIENT_BALANCE', 400);
    }

    // Update balance
    await trx.query(
      `UPDATE wallets
       SET balance = balance - $1
       WHERE id = $2`,
      [amount, wallet.id]
    );

    // Record transaction
    await trx.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, status, tx_hash, confirmed_at)
       VALUES ($1, $2, 'withdrawal', $3, $4, 'completed', $5, CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount, ref]
    );

    return wallet;
  },

  /**
   * Lock amount in wallet (move from balance to locked_balance)
   * @param {string} userId - User UUID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to lock
   * @param {object} trx - Sequelize transaction object
   */
  lock: async (userId, currency, amount, trx) => {
    if (amount <= 0) throw new AppError('Lock amount must be positive', 400);

    // Lock and check balance
    const walletResult = await trx.query(
      `SELECT id, balance FROM wallets
       WHERE user_id = $1 AND currency = $2
       FOR UPDATE`,
      [userId, currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    if (parseFloat(wallet.balance) < amount) {
      throw new AppError('INSUFFICIENT_BALANCE', 400);
    }

    // Move from balance to locked_balance
    await trx.query(
      `UPDATE wallets
       SET balance = balance - $1, locked_balance = locked_balance + $1
       WHERE id = $2`,
      [amount, wallet.id]
    );

    // Record transaction
    await trx.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, status, tx_hash, confirmed_at)
       VALUES ($1, $2, 'withdrawal', $3, $4, 'LOCKED', CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount]
    );

    return wallet;
  },

  /**
   * Release locked amount (move from locked_balance back to balance)
   * @param {string} userId - User UUID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to release
   * @param {object} trx - Sequelize transaction object
   */
  release: async (userId, currency, amount, trx) => {
    if (amount <= 0) throw new AppError('Release amount must be positive', 400);

    // Lock and check locked balance
    const walletResult = await trx.query(
      `SELECT id, locked_balance FROM wallets
       WHERE user_id = $1 AND currency = $2
       FOR UPDATE`,
      [userId, currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    if (parseFloat(wallet.locked_balance) < amount) {
      throw new AppError('Insufficient locked balance', 400);
    }

    // Move from locked_balance back to balance
    await trx.query(
      `UPDATE wallets
       SET locked_balance = locked_balance - $1, balance = balance + $1
       WHERE id = $2`,
      [amount, wallet.id]
    );

    // Record transaction
    await trx.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, status, tx_hash, confirmed_at)
       VALUES ($1, $2, 'deposit', $3, $4, 'RELEASED', CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount]
    );

    return wallet;
  },

  /**
   * Burn locked amount (remove from locked_balance permanently)
   * @param {string} userId - User UUID
   * @param {string} currency - Currency code
   * @param {number} amount - Amount to burn
   * @param {object} trx - Sequelize transaction object
   */
  burn: async (userId, currency, amount, trx) => {
    if (amount <= 0) throw new AppError('Burn amount must be positive', 400);

    // Lock and check locked balance
    const walletResult = await trx.query(
      `SELECT id, locked_balance FROM wallets
       WHERE user_id = $1 AND currency = $2
       FOR UPDATE`,
      [userId, currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    if (parseFloat(wallet.locked_balance) < amount) {
      throw new AppError('Insufficient locked balance', 400);
    }

    // Remove from locked_balance
    await trx.query(
      `UPDATE wallets
       SET locked_balance = locked_balance - $1
       WHERE id = $2`,
      [amount, wallet.id]
    );

    // Record transaction
    await trx.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, status, tx_hash, confirmed_at)
       VALUES ($1, $2, 'withdrawal', $3, $4, 'BURNED', CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount]
    );

    return wallet;
  },

  // ─── USER WALLET INFO ────────────────────────────────────────────────────────

  getBalance: async (userId) => {
    const result = await query(
      `SELECT id, currency, balance, locked_balance, created_at
       FROM wallets
       WHERE user_id = $1
       ORDER BY currency`,
      [userId]
    );
    return result.rows;
  },

  getTransactions: async (userId, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, type, currency, amount, fee, status, tx_hash, 
              from_address, to_address, created_at, confirmed_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM transactions WHERE user_id = $1`,
      [userId]
    );

    return {
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  // ─── ADMIN ────────────────────────────────────────────────────────────────────

  getAllWallets: async (page = 1, limit = 50) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT w.id, w.user_id, u.username, u.email,
              w.currency, w.balance, w.locked_balance, w.created_at
       FROM wallets w
       JOIN users u ON w.user_id = u.id
       WHERE u.is_deleted = FALSE
       ORDER BY w.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM wallets w
       JOIN users u ON w.user_id = u.id
       WHERE u.is_deleted = FALSE`
    );

    return {
      wallets: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  adminTopup: async (userId, currency, amount) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await walletService.credit(userId, currency, amount, 'ADMIN_TOPUP', client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  adminDebit: async (userId, currency, amount) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await walletService.debit(userId, currency, amount, 'ADMIN_DEBIT', client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

export default walletService;
