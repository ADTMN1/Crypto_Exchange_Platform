import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import redisClient from '../config/redis.config.js';
import logger from '../utils/logger.js';

const CACHE_KEY = 'trading_gate_status';
const CACHE_TTL_SEC = 30; // Reasonable TTL — balances freshness with reduced DB load

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

      await tradingGateService._ensureGateExists(client);

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

      const updated = result.rows[0];

      // Write-through cache (never invalidate with DEL alone which can silently fail)
      try {
        await redisClient.setex(
          CACHE_KEY,
          CACHE_TTL_SEC,
          JSON.stringify({ status: updated.status, changed_at: updated.changed_at })
        );
      } catch (err) {
        logger.warn('Failed to write trading gate to cache after openGate', { error: err.message });
        // Best-effort: try to delete any stale cached value so next read goes to DB
        redisClient.del(CACHE_KEY).catch(() => {});
      }
      
      return updated;

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

      await tradingGateService._ensureGateExists(client);

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

      const updated = result.rows[0];

      // Write-through cache — ALWAYS cache closed immediately, never rely on invalidation only
      try {
        await redisClient.setex(
          CACHE_KEY,
          CACHE_TTL_SEC,
          JSON.stringify({ status: updated.status, changed_at: updated.changed_at })
        );
      } catch (err) {
        logger.warn('Failed to write trading gate to cache after closeGate', { error: err.message });
        redisClient.del(CACHE_KEY).catch(() => {});
      }
      
      return updated;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // ─── STATUS CHECK OPERATIONS ────────────────────────────────────────────────────────

  /**
   * Get current trading gate status (lightweight cached version)
   * For display / middleware usage. Falls back to CLOSED on error — fail-safe.
   * @returns {Object} Current status and timestamp
   */
  getCurrentStatus: async () => {
    try {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { status: parsed.status, changed_at: parsed.changed_at };
      }

      await tradingGateService._ensureGateExists();

      const statusQuery = `
        SELECT status, changed_at 
        FROM trading_gate 
        ORDER BY changed_at DESC 
        LIMIT 1
      `;

      const result = await query(statusQuery);
      
      if (result.rows.length === 0) {
        // Fail-safe: default CLOSED — gate status not found → don't let users win by default
        const fallback = { status: 'closed', changed_at: new Date() };
        logger.warn('Trading gate record missing, defaulting to CLOSED');
        try {
          await redisClient.setex(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(fallback));
        } catch (_) { /* ignore */ }
        return fallback;
      }

      const row = result.rows[0];
      const status = { status: row.status, changed_at: row.changed_at };

      try {
        await redisClient.setex(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(status));
      } catch (_) { /* ignore cache write */ }

      return status;

    } catch (error) {
      // FAIL-SAFE: If Redis or DB errors, default to CLOSED — never default to payout conditions
      logger.error('Error getting trading gate status, defaulting to CLOSED', { error: error.message });
      return { status: 'closed', changed_at: new Date() };
    }
  },

  /**
   * Get current trading gate status — DIRECT DB READ, no cache.
   * For CRITICAL paths (binary trade resolver) where a stale read
   * could result in an incorrect payout.
   *
   * Fail-safe: defaults to CLOSED on any error.
   * @returns {Promise<boolean>} true if open, false if closed (or on error)
   */
  isTradingOpenDirect: async () => {
    try {
      const statusQuery = `
        SELECT status 
        FROM trading_gate 
        ORDER BY changed_at DESC 
        LIMIT 1
      `;
      const result = await query(statusQuery);

      if (result.rows.length === 0) {
        logger.warn('isTradingOpenDirect: no gate record found, defaulting CLOSED');
        return false;
      }

      const isOpen = result.rows[0].status === 'open';
      if (!isOpen) {
        logger.debug('isTradingOpenDirect: gate is CLOSED (direct DB read)');
      }
      return isOpen;

    } catch (error) {
      logger.error('isTradingOpenDirect DB error, defaulting to CLOSED', { error: error.message });
      return false;
    }
  },

  /**
   * Get full trading gate details (admin use) — always direct DB read
   * @returns {Object} Complete gate record
   */
  getGateDetails: async () => {
    try {
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
   * Check if trading is currently open (cached — for middleware / display)
   * Fail-safe: returns false (closed) on error.
   * @returns {boolean} True if trading is open, false if closed
   */
  isTradingOpen: async () => {
    try {
      const status = await tradingGateService.getCurrentStatus();
      return status.status === 'open';
    } catch (error) {
      // FAIL-SAFE: Default to CLOSED on error
      logger.error('Error checking if trading is open, defaulting to CLOSED', { error: error.message });
      return false;
    }
  },

  // ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────

  /**
   * Ensure trading gate record exists, create if not
   * @param {Object} client - Database client (optional, uses pool if not provided)
   */
  _ensureGateExists: async (client = null) => {
    const dbClient = client || pool;
    
    try {
      const checkQuery = 'SELECT COUNT(*) as count FROM trading_gate';
      const checkResult = await (client ? client.query(checkQuery) : query(checkQuery));
      
      const recordCount = parseInt(checkResult.rows[0].count);
      
      if (recordCount === 0) {
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
