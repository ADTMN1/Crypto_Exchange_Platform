import jwt from 'jsonwebtoken';
import AppError from '../utils/errorHandling.js';


export const authenticateToken = (req, res, next) => {
  try {
    let token = null;

    // 1. First choice: Try to get the token from HttpOnly Cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // 2. Second choice fallback: Check the Authorization header (Bearer TOKEN)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token is found in either location, bail out safely
    if (!token) {
      return next(new AppError('Authentication required. Access token missing.', 401));
    }

    // 3. Verify the token payload
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
      if (err) {
        // Customize error if token is expired vs flat-out altered
        const msg = err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid token.';
        return next(new AppError(msg, 401)); // Use 401 so frontend knows to re-authenticate or refresh
      }

      // 4. Attach user payload (id, email, role, etc.) directly to request object
      req.user = decodedUser;
      next();
    });
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    next(new AppError('Authentication processing failed.', 500));
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  ///her we have to get
  //
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
