const jwt = require('jsonwebtoken');
const { findOne } = require('../../services/mongodb/mongoService');
const User = require('../../models/user.model'); // User model

// Base authentication middleware
const authMiddleware = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'No token provided' });
      }

      let decoded;
      try {
        // Verify JWT token
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      } catch (error) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'Invalid or expired token' });
      }

      let user;
      if (requiredRole === 'admin') {
        // Fetch admin user
        user = await findOne(User, { _id: decoded.id, token });
        if (!user) {
          return res.status(404).json({ status: 'error', statusCode: 404, message: 'Admin not found' });
        }
      } else if (requiredRole === 'user') {
        // Fetch regular user
        user = await findOne(User, { _id: decoded.id, token });
        if (!user) {
          return res.status(404).json({ status: 'error', statusCode: 404, message: 'User not found' });
        }
      }

      // Check if user's role matches the required role
      if (user.role !== requiredRole) {
        return res.status(403).json({ status: 'error', statusCode: 403, message: 'Forbidden: Insufficient permissions' });
      }

      // Attach the authenticated user to the request object
      req.user = user;
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };
};

// Admin-only middleware
const adminAuth = authMiddleware('admin');

// User-only middleware
const userAuth = authMiddleware('user');

module.exports = { adminAuth, userAuth };
