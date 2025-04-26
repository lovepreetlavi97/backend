const { cacheUtils } = require('../../config/redis');

/**
 * Route caching middleware for GET requests
 * @param {number} ttl - Time to live in seconds, defaults to 1 hour
 * @returns {Function} Express middleware
 */
const cacheRoute = (ttl = 3600) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate a cache key based on the full URL and query params
      const cacheKey = `route_${req.originalUrl}`;
      
      // Try to get data from cache
      const cachedData = await cacheUtils.get(cacheKey);
      
      if (cachedData) {
        // Return cached data and skip route handler
        return res.status(cachedData.statusCode || 200).json(cachedData.data);
      }
      
      // If not in cache, intercept the response to cache it for future requests
      const originalSend = res.send;
      res.send = function(body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(body);
            // Store response in cache
            cacheUtils.set(cacheKey, {
              data: data,
              statusCode: res.statusCode
            }, ttl);
          } catch (err) {
            console.error('Cache storage error:', err);
          }
        }
        
        // Continue with the original response
        originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Proceed with the route handler even if caching fails
    }
  };
};

/**
 * Clear route cache by pattern
 * @param {string} pattern - Cache key pattern to clear
 * @returns {Function} Express middleware
 */
const clearRouteCache = (pattern = 'route_*') => {
  return async (req, res, next) => {
    try {
      // Clear cache for the given pattern
      await cacheUtils.delPattern(pattern);
      next();
    } catch (error) {
      console.error('Cache clearing error:', error);
      next(); // Proceed even if cache clearing fails
    }
  };
};

module.exports = {
  cacheRoute,
  clearRouteCache
}; 