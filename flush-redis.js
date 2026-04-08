const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectRedis, cacheUtils, redisClient } = require('./src/config/redis');

async function flushRedis() {
  console.log('Starting Redis flush script...');
  console.log('Redis Host:', process.env.REDIS_HOST);
  console.log('Redis Port:', process.env.REDIS_PORT);
  
  try {
    console.log('Connecting to Redis...');
    await connectRedis();
    
    if (!redisClient.isReady) {
      console.error('Redis client is not ready after connection attempt.');
      process.exit(1);
    }

    console.log('Redis connected successfully.');
    console.log('Flushing all data...');
    
    const result = await redisClient.flushAll();
    console.log('Flush Result:', result);
    
    console.log('Successfully flushed all Redis data.');
  } catch (error) {
    console.error('CRITICAL ERROR in flush script:');
    console.error(error);
  } finally {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    process.exit(0);
  }
}

flushRedis();
