import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import binanceService from './binance.service.js';

// Symbol to name mapping for bulk import
const SYMBOL_NAME_MAP = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum',
    'BNBUSDT': 'Binance Coin',
    'SOLUSDT': 'Solana',
    'XRPUSDT': 'Ripple',
    'ADAUSDT': 'Cardano',
    'DOGEUSDT': 'Dogecoin',
    'AVAXUSDT': 'Avalanche',
    'DOTUSDT': 'Polkadot',
    'MATICUSDT': 'Polygon',
    'LTCUSDT': 'Litecoin',
    'LINKUSDT': 'Chainlink',
    'UNIUSDT': 'Uniswap',
    'ATOMUSDT': 'Cosmos',
    'TRXUSDT': 'TRON',
};

const currencyService = {

  // ─── GET ALL CURRENCIES WITH LIVE PRICES ────────────────────────────────────

  getAllCurrencies: async (includeDisabled = true) => {
    let whereClause = '';
    if (!includeDisabled) {
      whereClause = "WHERE status = 'enabled'";
    }

    const result = await query(
      `SELECT id, name, symbol, logo, status, created_at, updated_at
       FROM currencies
       ${whereClause}
       ORDER BY created_at DESC`
    );

    const currencies = result.rows;

    // Fetch all Binance prices in one call
    let priceMap = {};
    try {
      const prices = await binanceService.getAllPrices();
      priceMap = prices.reduce((acc, p) => {
        acc[p.symbol] = p.price;
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to fetch Binance prices:', error.message);
      // Continue without prices - will show null
    }

    // Merge prices with currencies
    return currencies.map(currency => ({
      ...currency,
      price: priceMap[currency.symbol] || null,
    }));
  },

  // ─── GET SINGLE CURRENCY ────────────────────────────────────────────────────

  getCurrencyById: async (id) => {
    const result = await query(
      `SELECT id, name, symbol, logo, status, created_at, updated_at
       FROM currencies
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Currency not found', 404);
    }

    const currency = result.rows[0];

    // Fetch live price
    try {
      const priceData = await binanceService.getPrice(currency.symbol);
      currency.price = priceData.price;
    } catch (error) {
      console.error(`Failed to fetch price for ${currency.symbol}:`, error.message);
      currency.price = null;
    }

    return currency;
  },

  // ─── CREATE CURRENCY ────────────────────────────────────────────────────────

  createCurrency: async (data) => {
    const { name, symbol, logo, status = 'enabled' } = data;

    if (!name || !symbol) {
      throw new AppError('Name and symbol are required', 400);
    }

    // Validate symbol format (should end with USDT for Binance)
    const upperSymbol = symbol.toUpperCase();
    if (!upperSymbol.endsWith('USDT')) {
      throw new AppError('Symbol must end with USDT (e.g., BTCUSDT)', 400);
    }

    // Check if symbol already exists
    const existing = await query(
      'SELECT id FROM currencies WHERE symbol = $1',
      [upperSymbol]
    );

    if (existing.rows.length > 0) {
      throw new AppError(`Currency with symbol ${upperSymbol} already exists`, 409);
    }

    // Validate symbol exists on Binance
    try {
      await binanceService.getPrice(upperSymbol);
    } catch (error) {
      throw new AppError(`Invalid symbol: ${upperSymbol} not found on Binance`, 400);
    }

    const result = await query(
      `INSERT INTO currencies (name, symbol, logo, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, upperSymbol, logo || null, status]
    );

    return result.rows[0];
  },

  // ─── UPDATE CURRENCY ────────────────────────────────────────────────────────

  updateCurrency: async (id, data) => {
    const { name, symbol, logo, status } = data;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (symbol !== undefined) {
      const upperSymbol = symbol.toUpperCase();
      if (!upperSymbol.endsWith('USDT')) {
        throw new AppError('Symbol must end with USDT', 400);
      }
      updates.push(`symbol = $${paramCount++}`);
      values.push(upperSymbol);
    }
    if (logo !== undefined) {
      updates.push(`logo = $${paramCount++}`);
      values.push(logo);
    }
    if (status !== undefined) {
      if (!['enabled', 'disabled'].includes(status)) {
        throw new AppError('Status must be enabled or disabled', 400);
      }
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE currencies
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Currency not found', 404);
    }

    return result.rows[0];
  },

  // ─── UPDATE STATUS ──────────────────────────────────────────────────────────

  updateStatus: async (id, status) => {
    if (!['enabled', 'disabled'].includes(status)) {
      throw new AppError('Status must be enabled or disabled', 400);
    }

    const result = await query(
      `UPDATE currencies
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Currency not found', 404);
    }

    return result.rows[0];
  },

  // ─── DELETE CURRENCY ────────────────────────────────────────────────────────

  deleteCurrency: async (id) => {
    const result = await query(
      'DELETE FROM currencies WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Currency not found', 404);
    }

    return result.rows[0];
  },

  // ─── BULK IMPORT ────────────────────────────────────────────────────────────

  bulkImport: async (symbols) => {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      throw new AppError('Symbols array is required and cannot be empty', 400);
    }

    const supportedSymbols = binanceService.getSupportedSymbols();
    const imported = [];
    const skipped = [];
    const errors = [];

    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase();

      try {
        // Validate symbol is supported
        if (!supportedSymbols.includes(upperSymbol)) {
          errors.push({
            symbol: upperSymbol,
            reason: 'Not in supported symbols list',
          });
          continue;
        }

        // Check if already exists
        const existing = await query(
          'SELECT id FROM currencies WHERE symbol = $1',
          [upperSymbol]
        );

        if (existing.rows.length > 0) {
          skipped.push({
            symbol: upperSymbol,
            reason: 'Already exists',
          });
          continue;
        }

        // Get name from map or use symbol
        const name = SYMBOL_NAME_MAP[upperSymbol] || upperSymbol.replace('USDT', '');

        // Insert currency
        const result = await query(
          `INSERT INTO currencies (name, symbol, status)
           VALUES ($1, $2, 'enabled')
           RETURNING *`,
          [name, upperSymbol]
        );

        imported.push(result.rows[0]);
      } catch (error) {
        errors.push({
          symbol: upperSymbol,
          reason: error.message,
        });
      }
    }

    return {
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      details: {
        imported,
        skipped,
        errors,
      },
    };
  },

  // ─── GET SUPPORTED SYMBOLS ──────────────────────────────────────────────────

  getSupportedSymbols: () => {
    const supported = binanceService.getSupportedSymbols();
    return supported.map(symbol => ({
      symbol,
      name: SYMBOL_NAME_MAP[symbol] || symbol.replace('USDT', ''),
    }));
  },
};

export default currencyService;
