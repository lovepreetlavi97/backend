const { connectRedis, redisClient } = require('./src/config/redis');

async function listKeys() {
  console.log('Connecting to Redis...');
  const client = await connectRedis();
  
  if (!client) {
    console.error('Failed to connect to Redis.');
    process.exit(1);
  }

  try {
    const keys = await redisClient.keys('*');
    console.log('Redis keys:', keys);
  } catch (error) {
    console.error('Error listing keys:', error);
  }

  process.exit(0);
}

listKeys();
