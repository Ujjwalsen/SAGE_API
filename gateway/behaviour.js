const redisClient = require("../config/redis");

const behaviorMiddleware = async (req, res, next) => {
    const ip = req.ip;
    let riskScore = 0;

    // 1️⃣ Too many requests
    const reqKey = `req:${ip}`;
    let reqCount = await redisClient.get(reqKey);

    if (!reqCount) {
        await redisClient.set(reqKey, 1, "EX", 60);
    } else {
        reqCount = parseInt(reqCount) + 1;
        await redisClient.set(reqKey, reqCount, "EX", 60);

        if (reqCount > 30) riskScore += 30;
    }

    // 2️⃣ Repeated endpoint
    const endpointKey = `endpoint:${ip}:${req.path}`;
    let endpointCount = await redisClient.get(endpointKey);

    if (!endpointCount) {
        await redisClient.set(endpointKey, 1, "EX", 60);
    } else {
        endpointCount = parseInt(endpointCount) + 1;
        await redisClient.set(endpointKey, endpointCount, "EX", 60);

        if (endpointCount > 20) riskScore += 20;
    }

    // 3️⃣ Suspicious headers (basic bot detection)
    const userAgent = req.headers["user-agent"] || "";

    if (userAgent.includes("curl") || userAgent.includes("bot")) {
        riskScore += 20;
    }

    // 🎯 FINAL DECISION
    if (riskScore >= 50) {
        return res.status(403).send("High Risk Detected 🚨");
    } else if (riskScore >= 30) {
        console.log("⚠️ Medium Risk:", ip);
    }

    next();
};

module.exports = behaviorMiddleware;