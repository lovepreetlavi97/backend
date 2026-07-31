const { redisClient } = require('../config/redis');

/**
 * Atomic Redis-based rate limiter
 * @param {Number} limit Max requests
 * @param {Number} timeframe Seconds
 */
const rateLimiter = (limit, timeframe) => {
    return async (req, res, next) => {
        try {
            if (!redisClient.isReady) {
                return next(); // Fail open if Redis is down
            }

            const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const key = `ratelimit_${clientIp}_${req.baseUrl || req.path}`;
            
            const currentCount = await redisClient.incr(key);
            if (currentCount === 1) {
                await redisClient.expire(key, timeframe);
            }

            if (currentCount > limit) {
                res.setHeader('Retry-After', timeframe);
                return res.status(429).json({
                    status: 'error',
                    statusCode: 429,
                    message: `Too many requests. Please try again in ${timeframe}s.`
                });
            }

            next();
        } catch (error) {
            next(); // Fail open on error so API isn't blocked
        }
    };
};

module.exports = {
    globalLimiter: rateLimiter(parseInt(process.env.RATE_LIMIT_GLOBAL || '600', 10), 60), // Global 600 req/min
    authLimiter: rateLimiter(10, 300), // 10 auth reqs per 5 mins
    searchLimiter: rateLimiter(30, 60), // 30 searches per min
    checkoutLimiter: rateLimiter(15, 60), // 15 checkout attempts per min
    uploadLimiter: rateLimiter(10, 60) // 10 uploads per min
};
