import jwt from 'jsonwebtoken';
import AppError from '../utils/errorHandling.js';

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  try {
    let token = null;

    // 1. Cookie token
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2. Bearer token fallback
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // No token
    if (!token) {
      return next(
        new AppError('Authentication required. Access token missing.', 401)
      );
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
      if (err) {
        const msg =
          err.name === 'TokenExpiredError'
            ? 'Your session has expired. Please log in again.'
            : 'Invalid token';

        return next(new AppError(msg, 401));
      }

      req.user = decodedUser;
      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    next(new AppError('Authentication processing failed.', 500));
  }
};

// Alias for compatibility
export const authMiddleware = authenticateToken;

// Admin check
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }

  next();
};

// Ownership check
export const requireOwnership = (req, res, next) => {
  const userId = req.params.userId || req.params.id;

  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role === 'admin' || req.user.id === userId) {
    return next();
  }

  next(new AppError('Access denied', 403));
};