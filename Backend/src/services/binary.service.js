import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import walletService from './wallet.service.js';
import priceService from './price.service.js';

// Helper to normalize pair (e.g., "BTCUSDT" → "BTC/USDT")
const normalizePair = (pair) => {
  if (pair.includes('/')) return pair;
  if (pair.endsWith('USDT')) {
    const base = pair.slice(0, -4);
    return `${base}/USDT`;
  }
  return pair;
};

// Helper to get binary settings
const getBinarySettings = async () => {
  const result = await query('SELECT * FROM binary_settings LIMIT 1');
  if (result.rows.length === 0) {
    throw new AppError('Binary settings not found', 500);
  }
  return result.rows[0];
};

const binaryService = {
  // ─── GET BINARY SETTINGS ────────────────────────────────────────────────────
  getSettings: async () => {
    return await getBinarySettings();
  },

  // ─── UPDATE BINARY SETTINGS (ADMIN) ─────────────────────────────────────────
  updateSettings: async (settings, adminId) => {
    const { is_enabled, payout_percentage, min_trade_amount, max_trade_amount, allowed_expirations, allowed_pairs } = settings;
    const result = await query(
      `UPDATE binary_settings 
       SET is_enabled = COALESCE($1, is_enabled),
           payout_percentage = COALESCE($2, payout_percentage),
           min_trade_amount = COALESCE($3, min_trade_amount),
           max_trade_amount = COALESCE($4, max_trade_amount),
           allowed_expirations = COALESCE($5, allowed_expirations),
           allowed_pairs = COALESCE($6, allowed_pairs),
           updated_at = NOW(),
           updated_by = $7
       RETURNING *`,
      [is_enabled, payout_percentage, min_trade_amount, max_trade_amount, allowed_expirations, allowed_pairs, adminId]
    );
    return result.rows[0];
  },

  // ─── PLACE TRADE ────────────────────────────────────────────────────────────
  placeTrade: async (userId, pair, direction, amount, duration) => {
    console.log('[binary.service] Starting placeTrade with:', { userId, pair, direction, amount, duration });
    try {
      // Get binary settings first
      const settings = await getBinarySettings();
      
      // Check if binary trading is enabled
      if (!settings.is_enabled) {
        throw new AppError('Binary trading is currently disabled', 403);
      }

      // Validate direction
      if (direction !== 'BUY' && direction !== 'SELL') {
        throw new AppError('Direction must be BUY or SELL', 400);
      }
      console.log('[binary.service] Direction validated');

      // Validate amount against settings
      if (amount < settings.min_trade_amount || amount > settings.max_trade_amount) {
        throw new AppError(`Trade amount must be between ${settings.min_trade_amount} and ${settings.max_trade_amount}`, 400);
      }
      console.log('[binary.service] Amount validated');

      // Validate duration against allowed expirations
      if (!settings.allowed_expirations.includes(duration)) {
        throw new AppError(`Invalid duration. Allowed durations: ${settings.allowed_expirations.join(', ')} seconds`, 400);
      }
      console.log('[binary.service] Duration validated');

      // Validate pair against allowed pairs
      const normalizedPair = normalizePair(pair);
      console.log('[binary.service] Normalized pair:', normalizedPair);
      if (!settings.allowed_pairs.includes(normalizedPair)) {
        throw new AppError(`Unsupported pair. Allowed pairs: ${settings.allowed_pairs.join(', ')}`, 400);
      }
      console.log('[binary.service] Pair validated');

      // Get entry price
    console.log('[binary.service] Getting entry price');
    console.log('[binary.service] Trading pair from frontend:', pair);
    console.log('[binary.service] Normalized pair:', normalizedPair);
    const entryPrice = await priceService.getPrice(normalizedPair);
    console.log('[binary.service] Got entry price:', entryPrice);

      // Calculate expiry
      const expiresAt = new Date(Date.now() + duration * 1000);
      console.log('[binary.service] Expires at:', expiresAt);

      console.log('[binary.service] Getting database client');
      const client = await pool.connect();
      try {
        console.log('[binary.service] Starting transaction');
        await client.query('BEGIN');

        // Lock USDT from user's wallet
        console.log('[binary.service] Locking USDT from wallet');
        await walletService.lock(userId, 'USDT', amount, client);
        console.log('[binary.service] Locked USDT successfully');

        // Create trade record (store normalized pair)
        console.log('[binary.service] Inserting trade record');
        const result = await client.query(
          `INSERT INTO binary_trades 
           (user_id, pair, direction, amount, duration, entry_price, status, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'running', $7)
           RETURNING *`,
          [userId, normalizedPair, direction, amount, duration, entryPrice, expiresAt]
        );
        console.log('[binary.service] Inserted trade:', result.rows[0]);

        await client.query('COMMIT');
        console.log('[binary.service] Committed transaction');

        return result.rows[0];
      } catch (error) {
        console.error('[binary.service] Error in transaction, rolling back:', error);
        await client.query('ROLLBACK');
        throw error;
      } finally {
        console.log('[binary.service] Releasing database client');
        client.release();
      }
    } catch (error) {
      console.error('[binary.service] placeTrade failed:', error);
      throw error;
    }
  },

  // ─── GET USER TRADES ────────────────────────────────────────────────────────

  getMyTrades: async (userId, status, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const params = [userId];
    let whereClause = 'WHERE user_id = $1';

    if (status && status !== 'all') {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT id, pair, direction, amount, duration, entry_price, 
              close_price, status, payout, created_at, expires_at, resolved_at
       FROM binary_trades
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) FROM binary_trades ${whereClause}`,
      countParams
    );

    return {
      trades: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  // ─── ADMIN: GET ALL TRADES ──────────────────────────────────────────────────

  getAdminTrades: async (status, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = '';

    if (status && status !== 'all') {
      params.push(status);
      whereClause = `WHERE status = $${params.length}`;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT bt.id, bt.user_id, u.username, u.email,
              bt.pair, bt.direction, bt.amount, bt.duration,
              bt.entry_price, bt.close_price, bt.status, bt.payout,
              bt.created_at, bt.expires_at, bt.resolved_at
       FROM binary_trades bt
       JOIN users u ON bt.user_id = u.id
       ${whereClause}
       ORDER BY bt.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) FROM binary_trades ${whereClause ? whereClause : ''}`,
      countParams.length > 0 ? countParams : []
    );

    return {
      trades: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },
};

export default binaryService;
