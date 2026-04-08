const Redis = require("ioredis");

// Provide a mock so the app doesn't hang indefinitely without a redis server
const mockRedis = {
    _data: new Map(),
    get: async (key) => mockRedis._data.get(key) || null,
    set: async (key, val, ex, time) => { mockRedis._data.set(key, String(val)); },
    keys: async () => Array.from(mockRedis._data.keys())
};

// Use real Redis (from .env or localhost) but fallback to mock on error
const redisConfig = process.env.REDIS_URL || { host: "127.0.0.1", port: 6379 };

const ioredisOptions = {
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

const redisClient = typeof redisConfig === "string"
    ? new Redis(redisConfig, ioredisOptions)
    : new Redis({ ...redisConfig, ...ioredisOptions });

redisClient.on("error", (err) => {
    console.warn("⚠️ Redis not found. Using local in-memory mock for proxy/limiter.");
    Object.assign(redisClient, mockRedis);
});

module.exports = redisClient;