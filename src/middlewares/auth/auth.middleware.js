const jwt = require('jsonwebtoken');
const { findOne } = require('../../services/mongodb/mongoService'); 
// const Admin = require('../../models/admin.model'); // Admin model
const User = require('../../models/user.model'); // User model

// Base authentication middleware
const authMiddleware = (requiredRole) => {
  console.log(requiredRole,"requiredRolerequiredRolerequiredRole")
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
console.log(token,"token")
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      let user;

      // Check the role and query the appropriate model
      if (requiredRole === 'admin') {
        console.log( decoded.id," decoded.id decoded.id decoded.id")
        user = await findOne(User, { _id: decoded.id });
        console.log(user,"user")
        if (!user) return res.status(404).json({ message: 'Admin not found' });
      } else if (requiredRole === 'user') {
        user = await findOne(User, { _id: decoded.id });
        if (!user) return res.status(404).json({ message: 'User not found' });
      }

      // Check if user role matches the required role
      if (user.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      req.user = user; // Attach user to request object
      next(); // Proceed to next middleware or route handler
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ message: 'Unauthorized' });
    }
  };
};

// Admin-only middleware
const adminAuth = authMiddleware('admin');

// User-only middleware
const userAuth = authMiddleware('user');

module.exports = { adminAuth, userAuth };
