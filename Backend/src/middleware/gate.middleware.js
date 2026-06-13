import tradingGateService from '../services/trading-gate.service.js';
import AppError from '../utils/errorHandling.js';

/**
 * Middleware to check if trading gate is open
 * Blocks requests if trading is closed (except for admin routes)
 * 
 * Usage:
 * - Add to any route that requires trading to be active
 * - Example: router.post('/create-order', checkTradingGate, createOrder);
 * - Admin routes should bypass this check
 */
export const checkTradingGate = async (req, res, next) => {
  try {
    // Check if trading gate is open
    const isOpen = await tradingGateService.isTradingOpen();
    
    if (!isOpen) {
      return next(
        new AppError(
          'Trading is currently suspended. Please try again later.',
          503 // Service Unavailable
        )
      );
    }

    // Trading is open, proceed to next middleware
    next();
    
  } catch (error) {
    console.error('Trading gate middleware error:', error);
    
    // On error, we default to allowing the request (fail-open)
    // This prevents system issues from blocking all trading
    console.warn('Trading gate check failed, allowing request to proceed');
    next();
  }
};

/**
 * Middleware to check trading gate with admin bypass
 * Admin users can bypass trading gate restrictions
 * 
 * Usage:
 * - Use when you want admins to be able to trade even when gate is closed
 * - Requires req.user to be set by authentication middleware first
 */
export const checkTradingGateWithAdminBypass = async (req, res, next) => {
  try {
    // Check if user is admin (bypass gate check)
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // For non-admin users, check the trading gate
    const isOpen = await tradingGateService.isTradingOpen();
    
    if (!isOpen) {
      return next(
        new AppError(
          'Trading is currently suspended. Please try again later.',
          503 // Service Unavailable
        )
      );
    }

    // Trading is open, proceed
    next();
    
  } catch (error) {
    console.error('Trading gate middleware (with admin bypass) error:', error);
    
    // On error, default to allowing the request
    console.warn('Trading gate check failed, allowing request to proceed');
    next();
  }
};

/**
 * Middleware to get trading gate status and attach to request
 * Does not block requests, just adds status info to req object
 * 
 * Usage:
 * - Use when you need gate status info but don't want to block requests
 * - Status will be available as req.tradingGateStatus
 */
export const attachTradingGateStatus = async (req, res, next) => {
  try {
    const status = await tradingGateService.getCurrentStatus();
    req.tradingGateStatus = status;
    next();
  } catch (error) {
    console.error('Failed to attach trading gate status:', error);
    // Don't block request, just set default status
    req.tradingGateStatus = { status: 'open', changed_at: new Date() };
    next();
  }
};

// Aliases for compatibility
export const requireTradingOpen = checkTradingGate;
export const gateMiddleware = checkTradingGate;