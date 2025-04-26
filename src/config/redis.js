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
    console.log('Redis connected');

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    return redisClient;
  } catch (error) {
    console.error('Error connecting to Redis:', error.message);
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
      console.error('Redis set error:', error);
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
      console.error('Redis get error:', error);
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
      console.error('Redis del error:', error);
      return false;
    }
  },

  // Delete multiple keys matching a pattern
  async delPattern(pattern) {
    try {
      if (!redisClient.isReady) return false;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return false;
    }
  },

  // Clear entire cache
  async clear() {
    try {
      if (!redisClient.isReady) return false;
      await redisClient.flushAll();
      return true;
    } catch (error) {
      console.error('Redis clear error:', error);
      return false;
    }
  }
};

module.exports = {
  connectRedis,
  redisClient,
  cacheUtils
}; 