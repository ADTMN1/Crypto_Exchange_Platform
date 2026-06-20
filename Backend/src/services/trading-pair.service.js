import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';

const tradingPairService = {
  // ─── GET ALL TRADING PAIRS ──────────────────────────────────────────────────
  getAllPairs: async (includeInactive = false) => {
    let whereClause = '';
    if (!includeInactive) {
      whereClause = 'WHERE is_active = TRUE';
    }

    const result = await query(
      `SELECT * FROM trading_pairs ${whereClause} ORDER BY base_currency, quote_currency`
    );
    return result.rows;
  },

  // ─── GET TRADING PAIR BY ID ─────────────────────────────────────────────────
  getPairById: async (id) => {
    const result = await query(
      'SELECT * FROM trading_pairs WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      throw new AppError('Trading pair not found', 404);
    }
    return result.rows[0];
  },

  // ─── CREATE TRADING PAIR ────────────────────────────────────────────────────
  createPair: async (data) => {
    const {
      base_currency,
      quote_currency,
      min_order_size,
      max_order_size,
      price_precision = 8,
      qty_precision = 8,
      maker_fee = 0.0000,
      taker_fee = 0.0000,
      is_active = true
    } = data;

    if (!base_currency || !quote_currency || min_order_size === undefined || max_order_size === undefined) {
      throw new AppError('Base currency, quote currency, min and max order size are required', 400);
    }

    // Check if pair already exists
    const existing = await query(
      'SELECT id FROM trading_pairs WHERE base_currency = $1 AND quote_currency = $2',
      [base_currency.toUpperCase(), quote_currency.toUpperCase()]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Trading pair already exists', 409);
    }

    const result = await query(
      `INSERT INTO trading_pairs 
       (base_currency, quote_currency, min_order_size, max_order_size, price_precision, qty_precision, maker_fee, taker_fee, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        base_currency.toUpperCase(),
        quote_currency.toUpperCase(),
        min_order_size,
        max_order_size,
        price_precision,
        qty_precision,
        maker_fee,
        taker_fee,
        is_active
      ]
    );
    return result.rows[0];
  },

  // ─── UPDATE TRADING PAIR ────────────────────────────────────────────────────
  updatePair: async (id, data) => {
    const {
      base_currency,
      quote_currency,
      min_order_size,
      max_order_size,
      price_precision,
      qty_precision,
      maker_fee,
      taker_fee,
      is_active
    } = data;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (base_currency !== undefined) {
      updates.push(`base_currency = $${paramCount++}`);
      values.push(base_currency.toUpperCase());
    }
    if (quote_currency !== undefined) {
      updates.push(`quote_currency = $${paramCount++}`);
      values.push(quote_currency.toUpperCase());
    }
    if (min_order_size !== undefined) {
      updates.push(`min_order_size = $${paramCount++}`);
      values.push(min_order_size);
    }
    if (max_order_size !== undefined) {
      updates.push(`max_order_size = $${paramCount++}`);
      values.push(max_order_size);
    }
    if (price_precision !== undefined) {
      updates.push(`price_precision = $${paramCount++}`);
      values.push(price_precision);
    }
    if (qty_precision !== undefined) {
      updates.push(`qty_precision = $${paramCount++}`);
      values.push(qty_precision);
    }
    if (maker_fee !== undefined) {
      updates.push(`maker_fee = $${paramCount++}`);
      values.push(maker_fee);
    }
    if (taker_fee !== undefined) {
      updates.push(`taker_fee = $${paramCount++}`);
      values.push(taker_fee);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(id);

    const result = await query(
      `UPDATE trading_pairs
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Trading pair not found', 404);
    }

    return result.rows[0];
  },

  // ─── DELETE TRADING PAIR ────────────────────────────────────────────────────
  deletePair: async (id) => {
    const result = await query(
      'DELETE FROM trading_pairs WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      throw new AppError('Trading pair not found', 404);
    }
    return result.rows[0];
  },
};

export default tradingPairService;
