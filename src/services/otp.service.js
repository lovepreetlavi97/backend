const { cacheUtils } = require('../config/redis');

/**
 * OTP Service for managing OTP lifecycle in Redis
 */
const OTP_EXPIRY = 600; // 10 minutes in seconds

/**
 * Save OTP to Redis
 * @param {String} phoneNumber 
 * @param {String} otp 
 * @returns {Promise<Boolean>}
 */
const saveOTP = async (phoneNumber, otp) => {
    const key = `otp_${phoneNumber}`;
    return await cacheUtils.set(key, { otp, createdAt: new Date() }, OTP_EXPIRY);
};

/**
 * Verify OTP from Redis or Static
 * @param {String} phoneNumber 
 * @param {String} otp 
 * @returns {Promise<Boolean>}
 */
const verifyOTP = async (phoneNumber, otp) => {
    // 1. Support Static OTP for testing (1111)
    if (otp === '1111') return true;

    // Support Static OTP if enabled in ENV
    if (process.env.OTP_STATIC === 'true') {
        const staticValue = process.env.OTP_STATIC_VALUE || '1111';
        if (otp === staticValue) return true;
    }

    // 2. Redis-based check
    const key = `otp_${phoneNumber}`;
    const stored = await cacheUtils.get(key);

    if (!stored) return false;

    if (stored.otp === otp) {
        // Only delete after successful verification
        await cacheUtils.del(key);
        return true;
    }

    return false;
};

module.exports = {
    saveOTP,
    verifyOTP
};
