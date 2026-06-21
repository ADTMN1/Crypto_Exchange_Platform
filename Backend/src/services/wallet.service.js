import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import binanceService from './binance.service.js';
import cloudinaryV2 from '../config/cloudinary.config.js';
import { Readable } from 'stream';

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
    console.error('Error fetching price for', currency, err);
  }
  
  return 0;
};

const walletService = {
  // --- Core Balance Operations ---

  credit: async (userId, currency, amount, ref, client) => {
    if (amount <= 0) throw new AppError('Credit amount must be positive', 400);

    await client.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, $2, 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

    // Calculate the USD value for the amount being credited
    const usdValueToAdd = await calculateUsdValue(currency, amount);

    const walletResult = await client.query(
      `UPDATE wallets
       SET balance = balance + $1, usd_value = usd_value + $2
       WHERE user_id = $3 AND currency = $4
       RETURNING id, balance, usd_value`,
      [amount, usdValueToAdd, userId, currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet update failed', 500);
    }

    const wallet = walletResult.rows[0];

    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
       VALUES ($1, $2, 'deposit', $3, $4, 0, 'completed', CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount]
    );

    return wallet;
  },

  debit: async (userId, currency, amount, ref, client) => {
    if (amount <= 0) throw new AppError('Debit amount must be positive', 400);

    await client.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance, usd_value)
       VALUES ($1, $2, 0, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

    const walletResult = await client.query(
      `SELECT id, balance, usd_value FROM wallets
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

    // Calculate the proportion of usd_value to subtract
    const currentTotalBalance = parseFloat(wallet.balance) + parseFloat(wallet.locked_balance);
    const usdValueToSubtract = currentTotalBalance > 0 
      ? (amount / currentTotalBalance) * parseFloat(wallet.usd_value) 
      : 0;

    await client.query(
      `UPDATE wallets
       SET balance = balance - $1, usd_value = usd_value - $2
       WHERE id = $3`,
      [amount, usdValueToSubtract, wallet.id]
    );

    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
       VALUES ($1, $2, 'withdrawal', $3, $4, 0, 'completed', CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount]
    );

    return wallet;
  },

  lock: async (userId, currency, amount, client) => {
    console.log('[wallet.service] Lock starting:', { userId, currency, amount });
    if (amount <= 0) throw new AppError('Lock amount must be positive', 400);

    console.log('[wallet.service] Ensuring wallet exists');
    await client.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

    console.log('[wallet.service] Fetching and locking wallet');
    const walletResult = await client.query(
      `SELECT id, balance FROM wallets
       WHERE user_id = $1 AND currency = $2
       FOR UPDATE`,
      [userId, currency]
    );

    if (walletResult.rows.length === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const wallet = walletResult.rows[0];
    console.log('[wallet.service] Found wallet:', wallet);

    if (parseFloat(wallet.balance) < amount) {
      throw new AppError('INSUFFICIENT_BALANCE', 400);
    }

    console.log('[wallet.service] Moving balance to locked_balance');
    await client.query(
      `UPDATE wallets
       SET balance = balance - $1, locked_balance = locked_balance + $1
       WHERE id = $2`,
      [amount, wallet.id]
    );

    console.log('[wallet.service] Recording transaction');
    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
       VALUES ($1, $2, 'withdrawal', $3, $4, 0, 'completed', CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount]
    );

    console.log('[wallet.service] Lock completed');
    return wallet;
  },

  release: async (userId, currency, amount, client) => {
    if (amount <= 0) throw new AppError('Release amount must be positive', 400);

    await client.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

    const walletResult = await client.query(
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

    await client.query(
      `UPDATE wallets
       SET locked_balance = locked_balance - $1, balance = balance + $1
       WHERE id = $2`,
      [amount, wallet.id]
    );

    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
       VALUES ($1, $2, 'deposit', $3, $4, 0, 'completed', CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount]
    );

    return wallet;
  },

  burn: async (userId, currency, amount, client) => {
    if (amount <= 0) throw new AppError('Burn amount must be positive', 400);

    await client.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

    const walletResult = await client.query(
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

    await client.query(
      `UPDATE wallets
       SET locked_balance = locked_balance - $1
       WHERE id = $2`,
      [amount, wallet.id]
    );

    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
       VALUES ($1, $2, 'withdrawal', $3, $4, 0, 'completed', CURRENT_TIMESTAMP)`,
      [userId, wallet.id, currency, amount]
    );

    return wallet;
  },

  // --- User Wallet Info ---

  getBalance: async (userId) => {
    const result = await query(
      `SELECT id, currency, balance, locked_balance, usd_value, created_at
       FROM wallets
       WHERE user_id = $1
       ORDER BY currency`,
      [userId]
    );
    const wallets = result.rows;
    
    let totalUSD = 0;
    
    const walletsWithUsd = wallets.map(wallet => {
      totalUSD += parseFloat(wallet.usd_value);
      return {
        ...wallet,
        usdValue: parseFloat(wallet.usd_value)
      };
    });
    
    return {
      wallets: walletsWithUsd,
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

      // Calculate USD value to add
      const usdValueToAdd = await calculateUsdValue(transaction.currency, transaction.amount);

      const walletResult = await client.query(
        `UPDATE wallets
         SET balance = balance + $1, usd_value = usd_value + $2
         WHERE id = $3 AND user_id = $4 AND currency = $5
         RETURNING id, user_id, currency, balance, locked_balance, usd_value`,
        [
          transaction.amount,
          usdValueToAdd,
          transaction.wallet_id,
          transaction.user_id,
          transaction.currency
        ]
      );

      if (walletResult.rows.length === 0) {
        throw new AppError('Wallet update failed', 500);
      }

      await client.query(
        `UPDATE transactions 
         SET status = 'completed', confirmed_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [transactionId]
      );

      await client.query('COMMIT');
      return {
        success: true,
        message: 'Deposit approved',
        userId: transaction.user_id,
        wallet: walletResult.rows[0],
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
    // Update transaction status to failed
    await query(
      `UPDATE transactions 
       SET status = 'failed' 
       WHERE id = $1`,
      [transactionId]
    );

    return { success: true, message: 'Deposit rejected' };
  },
};

export default walletService;
