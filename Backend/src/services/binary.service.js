import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import walletService from './wallet.service.js';
import priceService from './price.service.js';
import { activateResolverIfNeeded } from '../jobs/tradeResolver.js';

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
    const { is_enabled, payout_percentage, min_trade_amount, max_trade_amount, allowed_expirations, allowed_pairs, duration_payouts } = settings;
    const result = await query(
      `UPDATE binary_settings 
       SET is_enabled = COALESCE($1, is_enabled),
           payout_percentage = COALESCE($2, payout_percentage),
           min_trade_amount = COALESCE($3, min_trade_amount),
           max_trade_amount = COALESCE($4, max_trade_amount),
           allowed_expirations = COALESCE($5, allowed_expirations),
           allowed_pairs = COALESCE($6, allowed_pairs),
           duration_payouts = COALESCE($7, duration_payouts),
           updated_at = NOW(),
           updated_by = $8
       RETURNING *`,
      [is_enabled, payout_percentage, min_trade_amount, max_trade_amount, allowed_expirations, allowed_pairs, duration_payouts, adminId]
    );
    return result.rows[0];
  },

  // ─── PLACE TRADE ────────────────────────────────────────────────────────────
  placeTrade: async (userId, pair, direction, amount, duration) => {
        const traceId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`\n[${traceId}] ====== [placeTrade] START ======`);
        console.log(`[${traceId}] Input params:`, { userId, pair, direction, duration });
        
        try {
            console.log(`[${traceId}] Step 1: Getting binary settings`);
            const settings = await getBinarySettings();
            console.log(`[${traceId}] Binary settings:`, {
                is_enabled: settings.is_enabled,
                payout_percentage: settings.payout_percentage,
                min_trade_amount: settings.min_trade_amount,
                max_trade_amount: settings.max_trade_amount,
                allowed_expirations: settings.allowed_expirations,
                allowed_pairs: settings.allowed_pairs
            });
            
            console.log(`[${traceId}] Step 2: Validating direction`);
            if (direction !== 'BUY' && direction !== 'SELL') {
                throw new AppError('Direction must be BUY or SELL', 400);
            }
            console.log(`[${traceId}] ✅ Direction validated`);

            console.log(`[${traceId}] Step 3: Validating amount`);
            if (amount < settings.min_trade_amount || amount > settings.max_trade_amount) {
                throw new AppError(`Trade amount must be between ${settings.min_trade_amount} and ${settings.max_trade_amount}`, 400);
            }
            console.log(`[${traceId}] ✅ Amount validated`);

            console.log(`[${traceId}] Step 4: Validating duration`);
            if (!settings.allowed_expirations.includes(duration)) {
                throw new AppError(`Invalid duration. Allowed durations: ${settings.allowed_expirations.join(', ')} seconds`, 400);
            }
            console.log(`[${traceId}] ✅ Duration validated`);

            console.log(`[${traceId}] Step 5: Validating pair`);
            const normalizedPair = normalizePair(pair);
            console.log(`[${traceId}] Normalized pair:`, normalizedPair);
            if (!settings.allowed_pairs.includes(normalizedPair)) {
                throw new AppError(`Unsupported pair. Allowed pairs: ${settings.allowed_pairs.join(', ')}`, 400);
            }
            console.log(`[${traceId}] ✅ Pair validated`);

            console.log(`[${traceId}] Step 6: Getting entry price`);
            const entryPrice = await priceService.getPrice(normalizedPair);

            console.log(`[${traceId}] Step 7: Calculating expiry`);
            const expiresAt = new Date(Date.now() + duration * 1000);
            console.log(`[${traceId}] Expires at:`, expiresAt.toISOString());

            console.log(`[${traceId}] Step 8: Getting database client`);
            const client = await pool.connect();
            try {
                console.log(`[${traceId}] Step 9: Starting transaction`);
                await client.query('BEGIN');

                console.log(`[${traceId}] Step 10: Locking USDT in wallet`);
                await walletService.lock(userId, 'USDT', amount, client);
                console.log(`[${traceId}] ✅ USDT locked successfully`);

                console.log(`[${traceId}] Step 11: Creating trade record`);
                const result = await client.query(
                    `INSERT INTO binary_trades 
                     (user_id, pair, direction, amount, duration, entry_price, status, expires_at)
                     VALUES ($1, $2, $3, $4, $5, $6, 'running', $7)
                     RETURNING *`,
                    [userId, normalizedPair, direction, amount, duration, entryPrice, expiresAt]
                );
                console.log(`[${traceId}] ✅ Trade created:`, { tradeId: result.rows[0].id, status: result.rows[0].status });

                console.log(`[${traceId}] Step 12: Committing transaction`);
                await client.query('COMMIT');
                console.log(`[${traceId}] ✅ Transaction committed`);

                console.log(`[${traceId}] Step 13: Activating resolver if needed`);
                await activateResolverIfNeeded().catch(err => {
                    console.error(`[${traceId}] ⚠️ Failed to activate resolver:`, err.message);
                });
                console.log(`[${traceId}] ✅ Resolver activation check complete`);

                console.log(`[${traceId}] ====== [placeTrade] SUCCESS ======\n`);
                return result.rows[0];
            } catch (error) {
                console.error(`[${traceId}] ❌ Error in transaction, rolling back:`, {
                    message: error.message,
                    stack: error.stack
                });
                await client.query('ROLLBACK');
                throw error;
            } finally {
                console.log(`[${traceId}] Releasing database client`);
                client.release();
            }
        } catch (error) {
            console.error(`[${traceId}] ❌ ====== [placeTrade] FAILED ======`, {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    },

  // ─── GET SINGLE TRADE BY ID ─────────────────────────────────────────────────
  getTradeById: async (userId, tradeId) => {
    const result = await query(
      `SELECT id, pair, direction, amount, duration, entry_price, 
              close_price, status, payout, created_at, expires_at, resolved_at
       FROM binary_trades
       WHERE id = $1 AND user_id = $2`,
      [tradeId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
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
