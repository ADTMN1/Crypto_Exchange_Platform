import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import walletService from './wallet.service.js';
import priceService from './price.service.js';

const binaryService = {

  // ─── PLACE TRADE ────────────────────────────────────────────────────────────

  placeTrade: async (userId, pair, direction, amount, duration) => {
    // Validate direction
    if (direction !== 'UP' && direction !== 'DOWN') {
      throw new AppError('Direction must be UP or DOWN', 400);
    }

    // Validate amount
    if (amount <= 0) {
      throw new AppError('Amount must be positive', 400);
    }

    // Validate duration
    if (duration < 30 || duration > 3600) {
      throw new AppError('Duration must be between 30 and 3600 seconds', 400);
    }

    // Validate pair
    const supportedPairs = priceService.getSupportedPairs();
    if (!supportedPairs.includes(pair)) {
      throw new AppError(`Unsupported pair. Supported: ${supportedPairs.join(', ')}`, 400);
    }

    // Get entry price
    const entryPrice = await priceService.getPrice(pair);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + duration * 1000);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock USDT from user's wallet
      await walletService.lock(userId, 'USDT', amount, client);

      // Create trade record
      const result = await client.query(
        `INSERT INTO binary_trades 
         (user_id, pair, direction, amount, duration, entry_price, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'running', $7)
         RETURNING *`,
        [userId, pair, direction, amount, duration, entryPrice, expiresAt]
      );

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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
