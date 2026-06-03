import jwt from 'jsonwebtoken';
import AppError from '../utils/errorHandling.js';

// Main authentication middleware
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      console.log('❌ No token provided in request');
      return next(new AppError('Authentication required. Access token missing.', 401));
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
      if (err) {
        console.error('❌ JWT Verification failed:', err.message);
        return next(new AppError('Invalid or expired token', 403));
      }

      console.log('✅ Token verified for user:', decodedUser.id);
      // Attach user to request object
      req.user = decodedUser;
      next();
    });
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    next(new AppError('Authentication failed', 500));
  }
};

// Export authenticateToken as authMiddleware for compatibility
export const authMiddleware = authenticateToken;

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
