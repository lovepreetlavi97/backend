const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Redis client configuration
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Default TTL in seconds (1 hour if not specified in .env)
const DEFAULT_TTL = process.env.REDIS_TTL || 3600;

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();


    redisClient.on('error', (err) => {

    });

    redisClient.on('reconnecting', () => {

    });

    return redisClient;
  } catch (error) {

    // Allow app to continue even if Redis connection fails
    return null;
  }
};

// Cache methods
const cacheUtils = {
  // Set data in cache with expiry
  async set(key, data, ttl = DEFAULT_TTL) {
    try {
      if (!redisClient.isReady) return false;
      await redisClient.set(key, JSON.stringify(data), { EX: ttl });
      return true;
    } catch (error) {

      return false;
    }
  },

  // Get data from cache
  async get(key) {
    try {
      if (!redisClient.isReady) return null;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {

      return null;
    }
  },

  // Delete data from cache
  async del(key) {
    try {
      if (!redisClient.isReady) return false;
      await redisClient.del(key);
      return true;
    } catch (error) {

      return false;
    }
  },

  // Non-blocking pattern deletion using scanIterator instead of blocking KEYS *
  async delPattern(pattern) {
    try {
      if (!redisClient.isReady) return false;
      const keysToDelete = [];
      for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keysToDelete.push(key);
        if (keysToDelete.length >= 100) {
          await redisClient.del(keysToDelete);
          keysToDelete.length = 0;
        }
      }
      if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  // Backwards-compatible alias used across controllers/middlewares
  async clearPattern(pattern) {
    return cacheUtils.delPattern(pattern);
  },

  // Safe cache clear targeting only application cache keys (never sessions, rate limits, or idempotency)
  async clear() {
    try {
      if (!redisClient.isReady) return false;
      return await cacheUtils.delPattern('cache:*');
    } catch (error) {
      return false;
    }
  }
};

module.exports = {
  connectRedis,
  redisClient,
  cacheUtils
}; 