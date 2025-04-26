const jwt = require('jsonwebtoken');
const { findOne } = require('../../services/mongodb/mongoService');
const { cacheUtils } = require('../../config/redis');
const User = require('../../models/user.model');
const { Admin } = require('../../models');

// Base authentication middleware
const authMiddleware = (requiredRoles) => {
  // Convert to array if a single role is provided
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'No token provided' });
      }
      
      // Check if user data is in Redis cache
      const cachedUser = await cacheUtils.get(`auth_${token}`);
      
      if (cachedUser) {
        // Use cached user data if available
        req.user = cachedUser;
        
        // Check if user's role is allowed
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({ status: 'error', statusCode: 403, message: 'Forbidden: Insufficient permissions' });
        }
        
        return next();
      }
      
      // Verify JWT token if not in cache
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      } catch (error) {
        return res.status(401).json({ status: 'error', statusCode: 401, message: 'Invalid or expired token' });
      }
      
      let user;
      
      // Try to find an admin user first (admin or superadmin)
      if (roles.includes('admin') || roles.includes('superadmin')) {
        user = await findOne(Admin, { _id: decoded.id, token: token });
        
        if (user && (roles.includes(user.role))) {
          // Cache the admin user data
          await cacheUtils.set(`auth_${token}`, user, 3600); // Cache for 1 hour
          req.user = user;
          return next();
        }
      }
      
      // Try to find a regular user if admin not found or role is 'user'
      if (roles.includes('user')) {
        user = await findOne(User, { _id: decoded.id, token: token });
        
        if (user && user.role === 'user') {
          // Cache the user data
          await cacheUtils.set(`auth_${token}`, user, 3600); // Cache for 1 hour
          req.user = user;
          return next();
        }
      }
      
      // If we get here, no valid user was found
      if (!user) {
        return res.status(404).json({ status: 'error', statusCode: 404, message: 'User not found' });
      }
      
      // If user exists but role doesn't match
      return res.status(403).json({ status: 'error', statusCode: 403, message: 'Forbidden: Insufficient permissions' });
      
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

// Permission check middleware for admin/superadmin
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    // SuperAdmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }
    
    // For admin, check specific permission
    if (req.user.role === 'admin') {
      if (req.user.permissions && req.user.permissions[requiredPermission] === true) {
        return next();
      }
    }
    
    // If we get here, the user doesn't have the required permission
    return res.status(403).json({ 
      status: 'error', 
      statusCode: 403, 
      message: `Forbidden: You don't have permission to ${requiredPermission.replace('manage', 'manage ')}` 
    });
  };
};

// Role-specific middleware instances
const userAuth = authMiddleware('user');
const adminAuth = authMiddleware('admin');
const superAdminAuth = authMiddleware('superadmin');
const adminOrSuperAdminAuth = authMiddleware(['admin', 'superadmin']);
const anyAuth = authMiddleware(['user', 'admin', 'superadmin']);

module.exports = { 
  userAuth, 
  adminAuth, 
  superAdminAuth, 
  adminOrSuperAdminAuth,
  anyAuth,
  checkPermission
};
