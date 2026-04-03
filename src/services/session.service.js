const UserSession = require('../models/session.model');
const SuspiciousActivity = require('../models/suspiciousActivity.model');

/**
 * Track user session and device after successful login
 * @param {String} userId 
 * @param {String} refreshToken 
 * @param {String} ip 
 * @param {String} userAgent 
 * @returns {Promise<Object>}
 */
const trackSession = async (userId, refreshToken, ip, userAgent) => {
    // 1. Log suspicious activity (new IP/Device)
    const existingSession = await UserSession.findOne({ userId, ip, userAgent });
    if (!existingSession) {
        await SuspiciousActivity.create({
            userId,
            ip,
            userAgent,
            activityType: 'NEW_DEVICE',
            severity: 'low',
            details: `New login recorded from ${ip}`
        });
        console.log(`[Security Alert] New session created for user ${userId} via ${ip}`);
    }

    // 2. Store session in user_sessions collection
    const session = await UserSession.create({
        userId,
        ip,
        userAgent,
        refreshToken,
        lastActivity: new Date()
    });

    return session;
};

/**
 * Logout single session using Refresh Token
 * @param {String} refreshToken 
 * @returns {Promise<Boolean>}
 */
const logoutSession = async (refreshToken) => {
    const result = await UserSession.deleteOne({ refreshToken });
    return result.deletedCount > 0;
};

/**
 * Logout all devices for a specific user
 * @param {String} userId 
 * @returns {Promise<Boolean>}
 */
const logoutAllSessions = async (userId) => {
    const result = await UserSession.deleteMany({ userId });
    return result.deletedCount > 0;
};

module.exports = {
    trackSession,
    logoutSession,
    logoutAllSessions
};
