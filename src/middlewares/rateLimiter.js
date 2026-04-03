const { cacheUtils } = require('../config/redis');

/**
 * Lightweight Redis-based rate limiter to avoid extra dependencies
 * @param {Number} limit Max requests
 * @param {Number} timeframe Seconds
 */
const rateLimiter = (limit, timeframe) => {
    return async (req, res, next) => {
        try {
            const key = `ratelimit_${req.ip}_${req.originalUrl}`;
            const attempts = await cacheUtils.get(key);

            if (attempts && attempts.count >= limit) {
                return res.status(429).json({
                    status: 'error',
                    statusCode: 429,
                    message: `Too many requests. Please try again in ${timeframe}s.`
                });
            }

            const currentCount = attempts ? attempts.count + 1 : 1;
            await cacheUtils.set(key, { count: currentCount }, timeframe);
            next();
        } catch (error) {
            console.error('Rate limiting error:', error);
            next(); // Allow on failure to not block API
        }
    };
};

module.exports = {
    globalLimiter: rateLimiter(100, 60), // Global 100 req per min
    authLimiter: rateLimiter(5, 300) // 5 auth req per 5 mins
};
