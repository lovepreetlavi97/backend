const { cacheUtils, connectRedis } = require("./src/config/redis");

async function flush() {
  await connectRedis();
  const success = await cacheUtils.clear();
  console.log(success ? "✅ Cache cleared" : "❌ Cache clear failed");
  process.exit(0);
}

flush();
