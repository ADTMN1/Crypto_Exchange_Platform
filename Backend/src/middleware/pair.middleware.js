import { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';

/**
 * Middleware to validate that a trading pair is active
 * Checks if pair_id in request body/params refers to an active pair
 * 
 * Usage:
 * - Add to any route that requires an active trading pair
 * - Requires pair_id in req.body or req.params
 */
export const validateActivePair = async (req, res, next) => {
  try {
    const pairId = req.body.pair_id || req.params.pair_id || req.query.pair_id;
    
    if (!pairId) {
      return next(
        new AppError('Trading pair ID is required', 400)
      );
    }

    // Check if pair exists and is active
    const result = await query(
      `SELECT id, base_currency, quote_currency, is_active
       FROM trading_pairs
       WHERE id = $1`,
      [pairId]
    );

    if (result.rows.length === 0) {
      return next(
        new AppError('Trading pair not found', 404)
      );
    }

    const pair = result.rows[0];

    if (!pair.is_active) {
      return next(
        new AppError(
          `Trading pair ${pair.base_currency}/${pair.quote_currency} is currently disabled`,
          403
        )
      );
    }

    // Attach pair info to request for downstream use
    req.tradingPair = pair;
    next();
    
  } catch (error) {
    console.error('Pair validation middleware error:', error);
    next(error);
  }
};

/**
 * Middleware to validate trading pair with admin bypass
 * Admin users can trade on disabled pairs
 * 
 * Usage:
 * - Use when admins should bypass pair status check
 * - Requires req.user to be set by authentication middleware first
 */
export const validateActivePairWithAdminBypass = async (req, res, next) => {
  try {
    // Admin bypass
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // For non-admin users, validate pair is active
    const pairId = req.body.pair_id || req.params.pair_id || req.query.pair_id;
    
    if (!pairId) {
      return next(
        new AppError('Trading pair ID is required', 400)
      );
    }

    const result = await query(
      `SELECT id, base_currency, quote_currency, is_active
       FROM trading_pairs
       WHERE id = $1`,
      [pairId]
    );

    if (result.rows.length === 0) {
      return next(
        new AppError('Trading pair not found', 404)
      );
    }

    const pair = result.rows[0];

    if (!pair.is_active) {
      return next(
        new AppError(
          `Trading pair ${pair.base_currency}/${pair.quote_currency} is currently disabled`,
          403
        )
      );
    }

    req.tradingPair = pair;
    next();
    
  } catch (error) {
    console.error('Pair validation middleware (with admin bypass) error:', error);
    next(error);
  }
};

/**
 * Middleware to validate pair by symbol (e.g., "BTC/USDT" or "BTCUSDT")
 * Normalizes symbol and checks if pair exists and is active
 */
export const validateActivePairBySymbol = async (req, res, next) => {
  try {
    const symbol = req.body.symbol || req.params.symbol || req.query.symbol;
    
    if (!symbol) {
      return next(
        new AppError('Trading pair symbol is required', 400)
      );
    }

    // Normalize symbol (BTC/USDT or BTCUSDT)
    let base, quote;
    if (symbol.includes('/')) {
      [base, quote] = symbol.split('/');
    } else if (symbol.endsWith('USDT')) {
      base = symbol.slice(0, -4);
      quote = 'USDT';
    } else {
      return next(
        new AppError('Invalid symbol format. Use BTC/USDT or BTCUSDT', 400)
      );
    }

    // Check if pair exists and is active
    const result = await query(
      `SELECT id, base_currency, quote_currency, is_active
       FROM trading_pairs
       WHERE base_currency = $1 AND quote_currency = $2`,
      [base.toUpperCase(), quote.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return next(
        new AppError(`Trading pair ${base}/${quote} not found`, 404)
      );
    }

    const pair = result.rows[0];

    if (!pair.is_active) {
      return next(
        new AppError(
          `Trading pair ${pair.base_currency}/${pair.quote_currency} is currently disabled`,
          403
        )
      );
    }

    req.tradingPair = pair;
    next();
    
  } catch (error) {
    console.error('Pair symbol validation middleware error:', error);
    next(error);
  }
};

// Aliases for compatibility
export const requireActivePair = validateActivePair;
export const pairMiddleware = validateActivePair;
