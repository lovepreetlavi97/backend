const jwt = require('jsonwebtoken');

/**
 * Generate Access Token
 * @param {String} userId 
 * @returns {String}
 */
const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET_KEY,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '1h' }
    );
};

/**
 * Generate Refresh Token
 * @param {String} userId 
 * @returns {String}
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
};

/**
 * Verify Token
 * @param {String} token 
 * @param {String} secret 
 * @returns {Object|null}
 */
const verifyToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};
