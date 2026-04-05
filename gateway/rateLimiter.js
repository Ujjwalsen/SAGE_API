const { RateLimiterRedis } = require("rate-limiter-flexible");
const redisClient = require("../config/redis");

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: 20, // 10 requests
    duration: 10, // per 60 sec
});

const rateLimiterMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch {
        res.status(429).send("Too Many Requests 🚫");
    }
};

module.exports = rateLimiterMiddleware;