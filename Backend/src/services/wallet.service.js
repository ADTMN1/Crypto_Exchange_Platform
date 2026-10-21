import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import binanceService from './binance.service.js';
import cloudinaryV2 from '../config/cloudinary.config.js';
import { Readable } from 'stream';
import logger from '../utils/logger.js';

const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      { folder: 'deposit_screenshots' },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    bufferToStream(file.buffer).pipe(uploadStream);
  });
};

// Helper function to calculate USD value for a given currency and amount
const calculateUsdValue = async (currency, amount) => {
  // If currency is USDT, amount is already USD value
  if (currency === 'USDT') {
    return amount;
  }
  
  // For other currencies, fetch price from Binance ONCE when needed
  try {
    const prices = await binanceService.getAllPrices();
    const priceMap = new Map(prices.map(p => [p.symbol, p.price]));
    const symbol = `${currency}USDT`;
    const price = priceMap.get(symbol);
    if (price) {
      return amount * price;
    }
  } catch (err) {
    logger.error('Error fetching price for currency', { currency, error: err.message });
  }
  
  return 0;
};

const walletService = {
  // --- Core Balance Operations ---

  add: async (userId, amount, ref, client) => {
    if (amount <= 0) throw new AppError('Amount must be positive', 400);

    // Determine which database interface to use
    const db = client || pool;

    // Ensure user has a USDT wallet
    await db.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, 'USDT', 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId]
    );

    // Lock the wallet row for atomic update
    const walletResult = await db.query(
      `SELECT id, balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    // USDT is the single total asset, so balance and usd_value move 1:1.
    await db.query(
      `UPDATE wallets
       SET balance = balance + $1,
           usd_value = usd_value + $1
       WHERE id = $2 AND user_id = $3 AND currency = 'USDT'`,
      [amount, wallet.id, userId]
    );

    // Re-fetch the updated wallet
    const updatedWalletResult = await db.query(
      `SELECT id, balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'`,
      [userId]
    );

    if (updatedWalletResult.rows.length === 0) {
      throw new AppError('Wallet update failed', 500);
    }

    const updatedWallet = updatedWalletResult.rows[0];

    // Record transaction if needed (within same transaction context)
    if (ref) {
      await db.query(
        `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
         VALUES ($1, $2, $3, 'USDT', $4, 0, 'completed', CURRENT_TIMESTAMP)`,
        [userId, updatedWallet.id, ref, amount]
      );
    }

    return updatedWallet;
  },

  subtract: async (userId, amount, ref, client) => {
    if (amount <= 0) throw new AppError('Amount must be positive', 400);

    // Determine which database interface to use
    const db = client || pool;

    // Ensure user has a USDT wallet
    await db.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, 'USDT', 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId]
    );

    // Lock the wallet row for atomic update
    const walletResult = await db.query(
      `SELECT id, balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    // Atomic balance guard: only subtract when sufficient funds exist.
    const updateResult = await db.query(
      `UPDATE wallets
       SET balance = balance - $1,
           usd_value = usd_value - $1
       WHERE id = $2 AND user_id = $3 AND currency = 'USDT' AND balance >= $1`,
      [amount, wallet.id, userId]
    );

    if (updateResult.rowCount === 0) {
      throw new AppError('INSUFFICIENT_BALANCE', 400);
    }

    // Re-fetch the updated wallet
    const updatedWalletResult = await db.query(
      `SELECT id, balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'`,
      [userId]
    );

    if (updatedWalletResult.rows.length === 0) {
      throw new AppError('Wallet not found after update', 404);
    }

    const updatedWallet = updatedWalletResult.rows[0];

    // Record transaction if needed
    if (ref) {
      await db.query(
        `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
         VALUES ($1, $2, $3, 'USDT', $4, 0, 'completed', CURRENT_TIMESTAMP)`,
        [userId, updatedWallet.id, ref, amount]
      );
    }

    return updatedWallet;
  },

  credit: async (userId, currency, amount, ref, client) => {
    if (amount <= 0) throw new AppError('Credit amount must be positive', 400);

    // Determine which database interface to use
    const db = client || pool;

    // Ensure user has a USDT wallet
    await db.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, 'USDT', 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId]
    );

    // Lock the USDT wallet row
    const walletResult = await db.query(
      `SELECT id, balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    // Calculate USD value using the service helper (fetches market price)
    const usdValueToAdd = await calculateUsdValue(currency, amount);

    // Never credit a zero/non-finite valuation silently (e.g. price feed failure).
    if (currency !== 'USDT' && (!Number.isFinite(usdValueToAdd) || usdValueToAdd <= 0)) {
      throw new AppError('Unable to determine USD value for currency', 503);
    }

    // Update USDT wallet balance and usd_value atomically
    await db.query(
      `UPDATE wallets
       SET balance = balance + $1, usd_value = usd_value + $2
       WHERE id = $3 AND user_id = $4 AND currency = 'USDT'`,
      [usdValueToAdd, usdValueToAdd, wallet.id, userId]
    );

    // Re-fetch updated wallet
    const updatedWalletResult = await db.query(
      `SELECT id, balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'`,
      [userId]
    );

    if (updatedWalletResult.rows.length === 0) {
      throw new AppError('Wallet update failed', 500);
    }

    const updatedWallet = updatedWalletResult.rows[0];

    // Record a ledger entry only when a reference is supplied. Callers that
    // already manage their own transaction row (e.g. approveDeposit) pass null
    // to avoid recording a duplicate deposit entry.
    if (ref) {
      await db.query(
        `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
         VALUES ($1, $2, 'deposit', $3, $4, 0, 'completed', CURRENT_TIMESTAMP)`,
        [userId, updatedWallet.id, currency, usdValueToAdd]
      );
    }

    return updatedWallet;
  },

  debit: async (userId, currency, amount, ref, client) => {
    if (amount <= 0) throw new AppError('Debit amount must be positive', 400);

    // Determine which database interface to use
    const db = client || pool;

    // Ensure user has a USDT wallet
    await db.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, 'USDT', 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId]
    );

    // Lock the USDT wallet row
    const walletResult = await db.query(
      `SELECT id, balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    // Calculate USD value if debiting a non-USDT currency
    let usdValueToSubtract = amount;
    if (currency !== 'USDT') {
      usdValueToSubtract = await calculateUsdValue(currency, amount);
      if (!Number.isFinite(usdValueToSubtract) || usdValueToSubtract <= 0) {
        throw new AppError('Unable to determine USD value for currency', 503);
      }
    }

    // Atomic balance guard: only subtract when sufficient funds exist.
    const updateResult = await db.query(
      `UPDATE wallets
       SET balance = balance - $1, usd_value = usd_value - $1
       WHERE id = $2 AND user_id = $3 AND currency = 'USDT' AND balance >= $1`,
      [usdValueToSubtract, wallet.id, userId]
    );

    if (updateResult.rowCount === 0) {
      throw new AppError('INSUFFICIENT_BALANCE', 400);
    }

    // Re-fetch updated wallet
    const updatedWalletResult = await db.query(
      `SELECT id, balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'`,
      [userId]
    );

    if (updatedWalletResult.rows.length === 0) {
      throw new AppError('Wallet not found after update', 404);
    }

    const updatedWallet = updatedWalletResult.rows[0];

    // Record a ledger entry only when a reference is supplied.
    if (ref) {
      await db.query(
        `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
         VALUES ($1, $2, 'withdrawal', $3, $4, 0, 'completed', CURRENT_TIMESTAMP)`,
        [userId, updatedWallet.id, currency, usdValueToSubtract]
      );
    }

    return updatedWallet;
  },

  lock: async (userId, currency, amount, client) => {
    if (amount <= 0) throw new AppError('Lock amount must be positive', 400);

    // Determine which database interface to use
    const db = client || pool;

    // Ensure user has a USDT wallet
    await db.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, 'USDT', 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId]
    );

    // Get USDT wallet and lock it
    const walletResult = await db.query(
      `SELECT id, balance FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    // Atomic balance guard: only lock when sufficient funds exist.
    const updateResult = await db.query(
      `UPDATE wallets
       SET balance = balance - $1, locked_balance = locked_balance + $1
       WHERE id = $2 AND user_id = $3 AND currency = 'USDT' AND balance >= $1`,
      [amount, wallet.id, userId]
    );

    if (updateResult.rowCount === 0) {
      throw new AppError('INSUFFICIENT_BALANCE', 400);
    }

    return wallet;
  },

  release: async (userId, currency, amount, client) => {
    if (amount <= 0) throw new AppError('Release amount must be positive', 400);

    // Determine which database interface to use
    const db = client || pool;

    // Ensure user has a USDT wallet
    await db.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, 'USDT', 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId]
    );

    // Get USDT wallet and lock it
    const walletResult = await db.query(
      `SELECT id, locked_balance FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    // Atomic guard: only release when sufficient locked funds exist.
    const updateResult = await db.query(
      `UPDATE wallets
       SET locked_balance = locked_balance - $1, balance = balance + $1
       WHERE id = $2 AND user_id = $3 AND currency = 'USDT' AND locked_balance >= $1`,
      [amount, wallet.id, userId]
    );

    if (updateResult.rowCount === 0) {
      throw new AppError('Insufficient locked balance', 400);
    }

    return wallet;
  },

  burn: async (userId, currency, amount, client) => {
    if (amount <= 0) throw new AppError('Burn amount must be positive', 400);

    // Determine which database interface to use
    const db = client || pool;

    // Ensure user has a USDT wallet
    await db.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, 'USDT', 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId]
    );

    // Get USDT wallet and lock it
    const walletResult = await db.query(
      `SELECT id, locked_balance, usd_value FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];

    // Atomic guard: only burn when sufficient locked funds exist.
    const updateResult = await db.query(
      `UPDATE wallets
       SET locked_balance = locked_balance - $1, usd_value = usd_value - $1
       WHERE id = $2 AND user_id = $3 AND currency = 'USDT' AND locked_balance >= $1`,
      [amount, wallet.id, userId]
    );

    if (updateResult.rowCount === 0) {
      throw new AppError('Insufficient locked balance', 400);
    }

    return wallet;
  },

  // --- User Wallet Info ---

  getBalance: async (userId) => {
    // Get ONLY the USDT wallet (this is our single total asset)
    const result = await query(
      `SELECT id, currency, balance, locked_balance, usd_value, created_at
       FROM wallets
       WHERE user_id = $1 AND currency = 'USDT'`,
      [userId]
    );

    // If no USDT wallet exists yet, create one
    let usdtWallet;
    if (result.rows.length === 0) {
      const createResult = await query(
        `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
         VALUES ($1, 'USDT', 0, 0, 0)
         RETURNING id, currency, balance, locked_balance, usd_value, created_at`,
        [userId]
      );
      usdtWallet = createResult.rows[0];
    } else {
      usdtWallet = result.rows[0];
    }

    // Use the database usd_value directly (already includes balance + locked_balance valuation)
    const totalUSD = parseFloat(usdtWallet.usd_value) || 0;

    const walletWithUsd = {
      ...usdtWallet,
      usdValue: totalUSD
    };

    return {
      wallets: [walletWithUsd], // Only return the single USDT wallet
      totalUSD
    };
  },

  getTransactions: async (userId, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, type, currency, amount, fee, status,
              created_at, confirmed_at
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

  // --- Admin ---

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

  createDepositRequest: async (userId, currency, amount, screenshotFile) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure wallet exists
      await client.query(
        `INSERT INTO wallets (user_id, currency, balance, locked_balance)
         VALUES ($1, $2, 0, 0)
         ON CONFLICT (user_id, currency) DO NOTHING`,
        [userId, currency]
      );

      const walletResult = await client.query(
        `SELECT id FROM wallets WHERE user_id = $1 AND currency = $2`,
        [userId, currency]
      );
      const walletId = walletResult.rows[0].id;

      let screenshotUrl = null;
      if (screenshotFile) {
        const uploadResult = await uploadToCloudinary(screenshotFile);
        if (uploadResult) {
          screenshotUrl = uploadResult.secure_url;
        }
      }

      // Insert transaction with pending status and screenshot URL
      const txResult = await client.query(
        `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, screenshot_url)
         VALUES ($1, $2, 'deposit', $3, $4, 0, 'pending', $5)
         RETURNING *`,
        [userId, walletId, currency, amount, screenshotUrl]
      );

      await client.query('COMMIT');
      return txResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getPendingDeposits: async (page = 1, limit = 50) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT t.id, t.user_id, u.username, u.email,
              t.wallet_id, t.currency, t.amount, t.status,
              t.screenshot_url, t.created_at
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.type = 'deposit' AND t.status = 'pending'
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM transactions t
       WHERE t.type = 'deposit' AND t.status = 'pending'`
    );

    return {
      deposits: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  getDepositsByStatus: async (status, page = 1, limit = 50) => {
    const offset = (page - 1) * limit;
    let statusCondition = '';
    const params = [limit, offset];
    
    if (status && status !== 'all') {
      statusCondition = `AND t.status = $3`;
      params.splice(2, 0, status);
    }

    const result = await query(
      `SELECT t.id, t.user_id, u.username, u.email,
              t.wallet_id, t.currency, t.amount, t.status,
              t.screenshot_url, t.created_at
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.type = 'deposit' ${statusCondition}
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const countParams = status && status !== 'all' ? [status] : [];
    const countResult = await query(
      `SELECT COUNT(*) FROM transactions t
       WHERE t.type = 'deposit' ${statusCondition ? 'AND t.status = $1' : ''}`,
      countParams
    );

    return {
      deposits: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  approveDeposit: async (transactionId, adminUserId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the pending deposit so it cannot be approved twice.
      const txResult = await client.query(
        `SELECT * FROM transactions
         WHERE id = $1 AND type = 'deposit'
         FOR UPDATE`,
        [transactionId]
      );
      if (txResult.rows.length === 0) {
        throw new AppError('Deposit transaction not found', 404);
      }
      const transaction = txResult.rows[0];

      if (transaction.status !== 'pending') {
        throw new AppError(`Deposit is already ${transaction.status}`, 400);
      }

      // Credit the USDT wallet. Pass a null reference so credit() does not
      // insert a second ledger row; this original deposit row is marked
      // completed below, yielding exactly one ledger entry per deposit.
      await walletService.credit(transaction.user_id, transaction.currency, transaction.amount, null, client);

      // Update transaction status
      await client.query(
        `UPDATE transactions 
         SET status = 'completed', confirmed_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [transactionId]
      );

      await client.query('COMMIT');

      // Get updated USDT wallet to return
      const updatedWalletResult = await client.query(
        `SELECT id, user_id, currency, balance, locked_balance, usd_value
         FROM wallets
         WHERE user_id = $1 AND currency = 'USDT'`,
        [transaction.user_id]
      );

      return {
        success: true,
        message: 'Deposit approved',
        userId: transaction.user_id,
        wallet: updatedWalletResult.rows[0],
        transaction: {
          id: transaction.id,
          currency: transaction.currency,
          amount: transaction.amount,
          status: 'completed'
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  rejectDeposit: async (transactionId, adminUserId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the deposit and verify it is still pending before rejecting.
      const txResult = await client.query(
        `SELECT * FROM transactions
         WHERE id = $1 AND type = 'deposit'
         FOR UPDATE`,
        [transactionId]
      );
      if (txResult.rows.length === 0) {
        throw new AppError('Deposit transaction not found', 404);
      }
      const transaction = txResult.rows[0];

      if (transaction.status !== 'pending') {
        throw new AppError(`Deposit is already ${transaction.status}`, 400);
      }

      await client.query(
        `UPDATE transactions
         SET status = 'failed'
         WHERE id = $1`,
        [transactionId]
      );

      await client.query('COMMIT');
      return { success: true, message: 'Deposit rejected' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

export default walletService;
