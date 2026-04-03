const { verifyToken } = require('../utils/jwt');
const User = require('../models/user.model');
const { errorResponse } = require('../utils/responseUtil');

/**
 * Protect routes - standard JWT check
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return errorResponse(res, 401, 'Not authorized, no token');
    }

    try {
        const decoded = verifyToken(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            return errorResponse(res, 401, 'Not authorized, invalid token');
        }

        // Attach user to request
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return errorResponse(res, 401, 'User associated with token not found');
        }

        next();
    } catch (error) {
        console.error('Auth check error:', error);
        return errorResponse(res, 401, 'Not authorized, session failed');
    }
};

module.exports = {
    protect
};
