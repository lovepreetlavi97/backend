const { connectRedis, cacheUtils } = require('./src/config/redis');
const dotenv = require('dotenv');

dotenv.config();

async function clearCache() {
  try {
    await connectRedis();
    console.log('Connected to Redis');
    
    // Attempt to flush or at least log what we can
    // In many setups, redisClient.flushAll() works if it's the standard redis package
    const client = require('./src/config/redis').redisClient;
    if (client && typeof client.flushAll === 'function') {
        await client.flushAll();
        console.log('Redis cache flushed completely');
    } else {
        console.log('Could not find flushAll function, clearing manually?');
    }
  } catch (err) {
    console.error('Error clearing cache:', err);
  } finally {
    process.exit(0);
  }
}

clearCache();
