import jwt from 'jsonwebtoken';
import AppError from '../utils/errorHandling.js';

// Middleware to authenticate JWT tokens
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(new AppError('Access token required', 401));
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return next(new AppError('Invalid or expired token', 403));
      }

      // Attach user to request object
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    next(new AppError('Authentication failed', 500));
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }

  next();
};

// Middleware to check if user owns the resource
export const requireOwnership = (req, res, next) => {
  const userId = req.params.userId || req.params.id;

  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Admin can access any resource, or user must own the resource
  if (req.user.role === 'admin' || req.user.id === userId) {
    next();
  } else {
    next(new AppError('Access denied', 403));
  }
};

export const authMiddleware = (req, res, next) => {
  const token = req.cookies.token; // Ensure cookie-parser is installed in Express

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Standard practice: check if token is expired or blacklisted here
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification error:', error.message);
    next(new AppError('Session expired or invalid', 401));
  }
};
