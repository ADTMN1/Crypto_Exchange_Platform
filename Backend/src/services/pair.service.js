import { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import binanceService from './binance.service.js';

const pairService = {

  // ─── GET ALL TRADING PAIRS ──────────────────────────────────────────────────

  getAllPairs: async (includeInactive = true) => {
    let whereClause = '';
    if (!includeInactive) {
      whereClause = "WHERE is_active = true";
    }

    const result = await query(
      `SELECT 
         id, 
         base_currency, 
         quote_currency,
         CONCAT(base_currency, '/', quote_currency) as symbol,
         min_order_size, 
         max_order_size,
         price_precision,
         qty_precision,
         maker_fee,
         taker_fee,
         is_active
       FROM trading_pairs
       ${whereClause}
       ORDER BY base_currency, quote_currency`
    );

    const pairs = result.rows;

    // Fetch live prices from Binance
    let priceMap = {};
    try {
      const prices = await binanceService.getAllPrices();
      priceMap = prices.reduce((acc, p) => {
        acc[p.symbol] = p.price;
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to fetch Binance prices:', error.message);
    }

    // Merge prices with pairs
    return pairs.map(pair => {
      const binanceSymbol = `${pair.base_currency}${pair.quote_currency}`;
      return {
        ...pair,
        current_price: priceMap[binanceSymbol] || null,
      };
    });
  },

  // ─── GET SINGLE PAIR ────────────────────────────────────────────────────────

  getPairById: async (id) => {
    const result = await query(
      `SELECT 
         id, 
         base_currency, 
         quote_currency,
         CONCAT(base_currency, '/', quote_currency) as symbol,
         min_order_size, 
         max_order_size,
         price_precision,
         qty_precision,
         maker_fee,
         taker_fee,
         is_active
       FROM trading_pairs
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Trading pair not found', 404);
    }

    const pair = result.rows[0];

    // Fetch live price
    try {
      const binanceSymbol = `${pair.base_currency}${pair.quote_currency}`;
      const priceData = await binanceService.getPrice(binanceSymbol);
      pair.current_price = priceData.price;
    } catch (error) {
      console.error(`Failed to fetch price for ${pair.symbol}:`, error.message);
      pair.current_price = null;
    }

    return pair;
  },

  // ─── CREATE PAIR ────────────────────────────────────────────────────────────

  createPair: async (data) => {
    const {
      base_currency,
      quote_currency,
      min_order_size = '0.00000001',
      max_order_size = '1000000.00000000',
      price_precision = 8,
      qty_precision = 8,
      maker_fee = '0.0010',
      taker_fee = '0.0010',
      is_active = true,
    } = data;

    if (!base_currency || !quote_currency) {
      throw new AppError('Base currency and quote currency are required', 400);
    }

    const upperBase = base_currency.toUpperCase();
    const upperQuote = quote_currency.toUpperCase();

    // Check if pair already exists
    const existing = await query(
      'SELECT id FROM trading_pairs WHERE base_currency = $1 AND quote_currency = $2',
      [upperBase, upperQuote]
    );

    if (existing.rows.length > 0) {
      throw new AppError(`Trading pair ${upperBase}/${upperQuote} already exists`, 409);
    }

    // Validate pair exists on Binance
    try {
      const binanceSymbol = `${upperBase}${upperQuote}`;
      await binanceService.getPrice(binanceSymbol);
    } catch (error) {
      throw new AppError(`Invalid pair: ${upperBase}/${upperQuote} not found on Binance`, 400);
    }

    const result = await query(
      `INSERT INTO trading_pairs 
       (base_currency, quote_currency, min_order_size, max_order_size, 
        price_precision, qty_precision, maker_fee, taker_fee, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [upperBase, upperQuote, min_order_size, max_order_size, 
       price_precision, qty_precision, maker_fee, taker_fee, is_active]
    );

    return result.rows[0];
  },

  // ─── UPDATE PAIR ────────────────────────────────────────────────────────────

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
      is_active,
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

  // ─── UPDATE STATUS ──────────────────────────────────────────────────────────

  updateStatus: async (id, is_active) => {
    if (typeof is_active !== 'boolean') {
      throw new AppError('is_active must be a boolean', 400);
    }

    const result = await query(
      `UPDATE trading_pairs
       SET is_active = $1
       WHERE id = $2
       RETURNING *`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Trading pair not found', 404);
    }

    return result.rows[0];
  },

  // ─── DELETE PAIR ────────────────────────────────────────────────────────────

  deletePair: async (id) => {
    // Check if pair has associated orders or trades
    const ordersCheck = await query(
      'SELECT COUNT(*) as count FROM orders WHERE pair_id = $1',
      [id]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      throw new AppError('Cannot delete pair with existing orders. Disable it instead.', 400);
    }

    const result = await query(
      'DELETE FROM trading_pairs WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Trading pair not found', 404);
    }

    return result.rows[0];
  },

  // ─── GET ENABLED PAIRS (USER ENDPOINT) ──────────────────────────────────────

  getEnabledPairs: async () => {
    const result = await query(
      `SELECT 
         id, 
         base_currency, 
         quote_currency,
         CONCAT(base_currency, '/', quote_currency) as symbol,
         min_order_size, 
         max_order_size,
         price_precision,
         qty_precision,
         maker_fee,
         taker_fee
       FROM trading_pairs
       WHERE is_active = true
       ORDER BY base_currency, quote_currency`
    );

    const pairs = result.rows;

    // Fetch live prices
    let priceMap = {};
    try {
      const prices = await binanceService.getAllPrices();
      priceMap = prices.reduce((acc, p) => {
        acc[p.symbol] = p.price;
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to fetch Binance prices:', error.message);
    }

    return pairs.map(pair => {
      const binanceSymbol = `${pair.base_currency}${pair.quote_currency}`;
      return {
        ...pair,
        current_price: priceMap[binanceSymbol] || null,
      };
    });
  },
};

export default pairService;
