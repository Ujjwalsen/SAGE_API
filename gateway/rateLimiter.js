const { RateLimiterRedis } = require("rate-limiter-flexible");
const redisClient = require("../config/redis");

// 🌍 Global limiter (important)
const globalLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit:global',
    points: 100,
    duration: 10,
});

// ✅ Create once (persistent)
const normalLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit:normal',
    points: 20,
    duration: 60,
});

const strictLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit:strict',
    points: 5,
    duration: 60,
});

// 🐢 Traffic shaping delay function
const delay = (ms) => new Promise(res => setTimeout(res, ms));

const rateLimiterMiddleware = async (req, res, next) => {
    // 🚨 Ignore non-API & system routes
    if (
        req.path === "/dashboard" ||
        req.path === "/" ||
        req.path.includes("favicon") ||
        req.path.includes(".well-known")
    ) {
        return next();
    }

    const ip = req.ip;
    const risk = req.riskScore || 0;

    try {
        // 🌍 Global protection
        await globalLimiter.consume("global");

        // 🐢 Traffic shaping for medium risk
        if (risk >= 30 && risk < 50) {
            console.log("⚡ Medium risk → stricter + slowed");

            await delay(500); // ⏳ delay (traffic shaping)
            await strictLimiter.consume(ip);
        } 
        else {
            await normalLimiter.consume(ip);
        }

        next();
    } catch {
        console.log("🚫 Rate limit exceeded:", ip);
        res.status(429).send("Server busy / DDoS protection 🚫");
    }
};

module.exports = rateLimiterMiddleware;