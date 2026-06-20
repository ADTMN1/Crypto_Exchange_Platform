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

const walletService = {
  // --- Core Balance Operations ---

  credit: async (userId, currency, amount, ref, client) => {
    if (amount <= 0) throw new AppError('Credit amount must be positive', 400);

    await client.query(
      `INSERT INTO wallets (user_id, currency, balance, locked_balance)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

    const walletResult = await client.query(
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
      `INSERT INTO wallets (user_id, currency, balance, locked_balance)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

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

    if (parseFloat(wallet.balance) < amount) {
      throw new AppError('INSUFFICIENT_BALANCE', 400);
    }

    await client.query(
      `UPDATE wallets
       SET balance = balance - $1
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
      `SELECT id, currency, balance, locked_balance, created_at
       FROM wallets
       WHERE user_id = $1
       ORDER BY currency`,
      [userId]
    );
    const wallets = result.rows;
    
    try {
      // Get all prices from Binance
      const prices = await binanceService.getAllPrices();
      const priceMap = new Map(prices.map(p => [p.symbol, p.price]));
      
      let totalUSD = 0;
      
      const walletsWithUsd = wallets.map(wallet => {
        let usdValue = 0;
        
        // If currency is USDT, value is just balance
        if (wallet.currency === 'USDT') {
          usdValue = parseFloat(wallet.balance);
        } else {
          // Try to get price for {currency}USDT
          const symbol = `${wallet.currency}USDT`;
          const price = priceMap.get(symbol);
          if (price) {
            usdValue = parseFloat(wallet.balance) * price;
          }
        }
        
        totalUSD += usdValue;
        
        return {
          ...wallet,
          usdValue
        };
      });
      
      return {
        wallets: walletsWithUsd,
        totalUSD
      };
    } catch (err) {
      console.error('Error fetching prices for wallet balance:', err);
      // Fallback: return wallets without USD values
      return {
        wallets: wallets.map(w => ({ ...w, usdValue: 0 })),
        totalUSD: 0
      };
    }
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

  approveDeposit: async (transactionId, adminUserId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the transaction details
      const txResult = await client.query(
        `SELECT * FROM transactions WHERE id = $1`,
        [transactionId]
      );
      if (txResult.rows.length === 0) {
        throw new AppError('Transaction not found', 404);
      }
      const transaction = txResult.rows[0];

      // Credit the user's wallet
      await walletService.credit(transaction.user_id, transaction.currency, parseFloat(transaction.amount), 'ADMIN_APPROVE', client);

      // Update the transaction status
      await client.query(
        `UPDATE transactions 
         SET status = 'completed', confirmed_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [transactionId]
      );

      await client.query('COMMIT');
      return { success: true, message: 'Deposit approved' };
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
