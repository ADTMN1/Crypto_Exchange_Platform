import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for support ticket creation
 * Limits: 3 tickets per IP per hour
 */
export const ticketRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    message: 'Too many support tickets created. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for authenticated admin users
  skip: (req) => req.user?.role === 'admin'
});

/**
 * General API rate limiter for support routes
 * Limits: 20 requests per IP per 15 minutes
 */
export const supportApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});
