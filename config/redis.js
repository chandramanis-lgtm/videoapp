const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Cache wrapper function
async function cacheWrapper(key, ttl, fetchFn) {
  try {
    // Try to get from cache
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to direct fetch if Redis fails
    return await fetchFn();
  }
}

// Invalidate cache
async function invalidateCache(key) {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

module.exports = { redisClient, cacheWrapper, invalidateCache };
