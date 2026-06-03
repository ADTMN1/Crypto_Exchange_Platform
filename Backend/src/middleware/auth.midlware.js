import jwt from 'jsonwebtoken';

// Middleware to authenticate JWT tokens
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('❌ No token provided in request');
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('❌ JWT Verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token', error: err.message });
      }

      console.log('✅ Token verified for user:', user.id);
      // Attach user to request object
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

// Middleware to check if user owns the resource
export const requireOwnership = (req, res, next) => {
  const userId = req.params.userId || req.params.id;

  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Admin can access any resource, or user must own the resource
  if (req.user.role === 'admin' || req.user.id === userId) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
};

// Export authenticateToken as authMiddleware for compatibility
export const authMiddleware = authenticateToken;
