import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';

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
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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