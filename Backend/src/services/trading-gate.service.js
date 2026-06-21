import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import walletService from './wallet.service.js';
import auditService from './audit.service.js';
import notificationService from './notification.service.js';

const tradingGateService = {

  // ─── CORE GATE OPERATIONS ──────────────────────────────────────────────────

  /**
   * Open the trading gate
   * @param {string} changedBy - Username or identifier of who made the change
   * @returns {Object} Updated gate record
   */
  openGate: async (changedBy) => {
    if (!changedBy) {
      throw new AppError('changedBy parameter is required', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if gate exists, create if not
      await tradingGateService._ensureGateExists(client);

      // Update gate to open status
      const updateQuery = `
        UPDATE trading_gate 
        SET status = 'open', 
            changed_by = $1, 
            changed_at = NOW()
        WHERE id = (SELECT id FROM trading_gate ORDER BY changed_at DESC LIMIT 1)
        RETURNING *
      `;

      const result = await client.query(updateQuery, [changedBy]);
      
      if (result.rows.length === 0) {
        throw new AppError('Failed to update trading gate', 500);
      }

      await client.query('COMMIT');

      // After gate is opened, immediately resolve any still-running trades as wins
      tradingGateService.forceWinBinaryTrades()
        .catch(err => console.error('Force-win binary trades failed:', err.message));

      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Close the trading gate
   * @param {string} changedBy - Username or identifier of who made the change
   * @returns {Object} Updated gate record
   */
  closeGate: async (changedBy) => {
    if (!changedBy) {
      throw new AppError('changedBy parameter is required', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if gate exists, create if not
      await tradingGateService._ensureGateExists(client);

      // Update gate to closed status
      const updateQuery = `
        UPDATE trading_gate 
        SET status = 'closed', 
            changed_by = $1, 
            changed_at = NOW()
        WHERE id = (SELECT id FROM trading_gate ORDER BY changed_at DESC LIMIT 1)
        RETURNING *
      `;

      const result = await client.query(updateQuery, [changedBy]);
      
      if (result.rows.length === 0) {
        throw new AppError('Failed to update trading gate', 500);
      }

      await client.query('COMMIT');

      // After gate is closed, immediately force-resolve all running binary trades as losses
      tradingGateService.forceResolveBinaryTrades()
        .catch(err => console.error('Force-resolve binary trades failed:', err.message));

      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Force-resolve all currently running binary trades as losses.
   * Called immediately when the trading gate is closed.
   * Adds: TRADE_LOSS transaction record, audit log, user notification.
   */
  forceResolveBinaryTrades: async () => {
    console.log('🔴 Gate closed — force-resolving all running binary trades as LOSE...');

    const runningTrades = await query(
      `SELECT id, user_id, amount, entry_price, duration, pair
       FROM binary_trades WHERE status = 'running'`
    );

    if (runningTrades.rows.length === 0) {
      console.log('✅ No running binary trades to force-resolve');
      return;
    }

    console.log(`📊 Force-resolving ${runningTrades.rows.length} running trade(s) as LOSE`);

    for (const trade of runningTrades.rows) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Get wallet id for transaction record
        const walletRow = await client.query(
          `SELECT id FROM wallets WHERE user_id = $1 AND currency = 'USDT' LIMIT 1`,
          [trade.user_id]
        );
        const walletId = walletRow.rows[0]?.id ?? null;

        await walletService.burn(trade.user_id, 'USDT', parseFloat(trade.amount), client);

        await client.query(
          `UPDATE binary_trades
           SET status = 'lose', close_price = $1, payout = 0, resolved_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [parseFloat(trade.entry_price), trade.id]
        );

        // TRADE_LOSS transaction record
        if (walletId) {
          await client.query(
            `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
             VALUES ($1, $2, 'TRADE_LOSS', 'USDT', $3, 0, 'completed', CURRENT_TIMESTAMP)`,
            [trade.user_id, walletId, parseFloat(trade.amount)]
          );
        }

        await client.query('COMMIT');
        console.log(`✅ Force-resolved trade ${trade.id} as LOSE [gate closed]`);

        // Audit log (fire-and-forget)
        auditService.createAudit({
          userId: trade.user_id,
          action: 'Trade settled as LOSS - market closed by admin',
          entityType: 'binary_trade',
          entityId: trade.id,
          metadata: { tradeId: trade.id, amount: trade.amount, payout: 0, marketStatus: 'closed' },
        }).catch(e => console.error('Audit log failed:', e.message));

        // User notification (fire-and-forget)
        notificationService.sendToUser({
          userId: trade.user_id,
          type: 'TRADE_LOSS',
          title: '📉 Trade Settled',
          body: `Your ${trade.pair} trade was settled. Amount of ${parseFloat(trade.amount).toFixed(2)} USDT has been deducted.`,
          metadata: { tradeId: trade.id, amount: trade.amount, pair: trade.pair },
        }).catch(e => console.error('Notification failed:', e.message));

      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to force-lose trade ${trade.id}:`, err.message);
      } finally {
        client.release();
      }
    }

    console.log('✅ Force-lose completed');
  },

  /**
   * Force-resolve all currently running binary trades as wins.
   * Called immediately when the trading gate is opened.
   * Adds: TRADE_WIN transaction record, audit log, user notification.
   */
  forceWinBinaryTrades: async () => {
    console.log('🟢 Gate opened — force-resolving all running binary trades as WIN...');

    const runningTrades = await query(
      `SELECT id, user_id, amount, entry_price, duration, pair
       FROM binary_trades WHERE status = 'running'`
    );

    if (runningTrades.rows.length === 0) {
      console.log('✅ No running binary trades to force-win');
      return;
    }

    console.log(`📊 Force-resolving ${runningTrades.rows.length} running trade(s) as WIN`);

    const getPayoutMultiplier = (duration) => {
      const map = { 30: 1.10, 60: 1.15, 90: 1.20, 120: 1.20, 180: 1.25, 300: 1.30 };
      return map[duration] || 1.10;
    };

    for (const trade of runningTrades.rows) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const multiplier = getPayoutMultiplier(trade.duration);
        const payout     = parseFloat(trade.amount) * multiplier;
        const profit     = payout - parseFloat(trade.amount);

        // Get wallet id for transaction record
        const walletRow = await client.query(
          `SELECT id FROM wallets WHERE user_id = $1 AND currency = 'USDT' LIMIT 1`,
          [trade.user_id]
        );
        const walletId = walletRow.rows[0]?.id ?? null;

        await walletService.release(trade.user_id, 'USDT', parseFloat(trade.amount), client);

        if (profit > 0) {
          await walletService.credit(
            trade.user_id, 'USDT', profit, `BINARY_WIN_${trade.id}`, client
          );
        }

        await client.query(
          `UPDATE binary_trades
           SET status = 'win', close_price = $1, payout = $2, resolved_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [parseFloat(trade.entry_price), payout, trade.id]
        );

        // TRADE_WIN transaction record
        if (walletId) {
          await client.query(
            `INSERT INTO transactions (user_id, wallet_id, type, currency, amount, fee, status, confirmed_at)
             VALUES ($1, $2, 'TRADE_WIN', 'USDT', $3, 0, 'completed', CURRENT_TIMESTAMP)`,
            [trade.user_id, walletId, payout]
          );
        }

        await client.query('COMMIT');
        console.log(`✅ Force-resolved trade ${trade.id} as WIN [gate opened] | Payout: ${payout}`);

        // Audit log (fire-and-forget)
        auditService.createAudit({
          userId: trade.user_id,
          action: 'Trade settled as WIN - market opened by admin',
          entityType: 'binary_trade',
          entityId: trade.id,
          metadata: { tradeId: trade.id, amount: trade.amount, payout, marketStatus: 'open' },
        }).catch(e => console.error('Audit log failed:', e.message));

        // User notification (fire-and-forget)
        notificationService.sendToUser({
          userId: trade.user_id,
          type: 'TRADE_WIN',
          title: '🎉 Trade Won!',
          body: `Your ${trade.pair} trade settled as a WIN. Payout: ${payout.toFixed(2)} USDT`,
          metadata: { tradeId: trade.id, payout, pair: trade.pair },
        }).catch(e => console.error('Notification failed:', e.message));

      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to force-win trade ${trade.id}:`, err.message);
      } finally {
        client.release();
      }
    }

    console.log('✅ Force-win completed');
  },

  // ─── STATUS CHECK OPERATIONS ───────────────────────────────────────────────

  /**
   * Get current trading gate status (lightweight version for public use)
   * @returns {Object} Current status and timestamp
   */
  getCurrentStatus: async () => {
    try {
      // First ensure gate exists
      await tradingGateService._ensureGateExists();

      const statusQuery = `
        SELECT status, changed_at 
        FROM trading_gate 
        ORDER BY changed_at DESC 
        LIMIT 1
      `;

      const result = await query(statusQuery);
      
      if (result.rows.length === 0) {
        // This should not happen after _ensureGateExists, but just in case
        return { status: 'open', changed_at: new Date() };
      }

      return result.rows[0];

    } catch (error) {
      // If any error occurs, default to open for safety
      console.error('Error getting trading gate status:', error);
      return { status: 'open', changed_at: new Date() };
    }
  },

  /**
   * Get full trading gate details (admin use)
   * @returns {Object} Complete gate record
   */
  getGateDetails: async () => {
    try {
      // Ensure gate exists
      await tradingGateService._ensureGateExists();

      const detailsQuery = `
        SELECT * 
        FROM trading_gate 
        ORDER BY changed_at DESC 
        LIMIT 1
      `;

      const result = await query(detailsQuery);
      
      if (result.rows.length === 0) {
        throw new AppError('Trading gate record not found', 404);
      }

      return result.rows[0];

    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if trading is currently open
   * @returns {boolean} True if trading is open, false if closed
   */
  isTradingOpen: async () => {
    try {
      const status = await tradingGateService.getCurrentStatus();
      return status.status === 'open';
    } catch (error) {
      // Default to open on error for safety
      console.error('Error checking if trading is open:', error);
      return true;
    }
  },

  // ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────────

  /**
   * Ensure trading gate record exists, create if not
   * @param {Object} client - Database client (optional, uses pool if not provided)
   */
  _ensureGateExists: async (client = null) => {
    const dbClient = client || pool;
    
    try {
      // Check if any record exists
      const checkQuery = 'SELECT COUNT(*) as count FROM trading_gate';
      const checkResult = await (client ? client.query(checkQuery) : query(checkQuery));
      
      const recordCount = parseInt(checkResult.rows[0].count);
      
      if (recordCount === 0) {
        // Create initial record
        const insertQuery = `
          INSERT INTO trading_gate (status, changed_by, changed_at)
          VALUES ('open', 'system', NOW())
          RETURNING *
        `;
        
        await (client ? client.query(insertQuery) : query(insertQuery));
      }
      
    } catch (error) {
      throw new AppError('Failed to ensure trading gate exists', 500);
    }
  }

};

export default tradingGateService;