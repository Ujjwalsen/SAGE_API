const redisClient = require("../config/redis");

const behaviorMiddleware = async (req, res, next) => {

    // 🚨 Ignore non-API & system routes
    if (
        req.path === "/events" ||
        req.path === "/dashboard" ||
        req.path === "/" ||
        req.path.includes("favicon") ||
        req.path.includes(".well-known")
    ) {
        return next();
    }
    
    try {
        const ip = req.ip;
        let riskScore = 0;

        // 🧠 Penalty system (NEW)
        const penaltyKey = `penalty:${ip}`;
        let penalty = await redisClient.get(penaltyKey);

        if (!penalty) {
            penalty = 0;
        } else {
            penalty = parseInt(penalty);
        }

        // 1️⃣ Too many requests (gradual increase)
        const reqKey = `req:${ip}`;
        let reqCount = await redisClient.get(reqKey);

        if (!reqCount) {
            await redisClient.set(reqKey, 1, "EX", 60);
        } else {
            reqCount = parseInt(reqCount) + 1;
            await redisClient.set(reqKey, reqCount, "EX", 60);

            if (reqCount > 20) riskScore += 10;
            if (reqCount > 40) riskScore += 20;
        }

        // 2️⃣ Repeated endpoint (gradual increase)
        const endpointKey = `endpoint:${ip}:${req.path}`;
        let endpointCount = await redisClient.get(endpointKey);

        if (!endpointCount) {
            await redisClient.set(endpointKey, 1, "EX", 60);
        } else {
            endpointCount = parseInt(endpointCount) + 1;
            await redisClient.set(endpointKey, endpointCount, "EX", 60);

            if (endpointCount > 15) riskScore += 10;
            if (endpointCount > 30) riskScore += 20;
        }

        // 3️⃣ Suspicious headers (bot detection)
        const userAgent = req.headers["user-agent"] || "";

        if (userAgent.includes("curl") || userAgent.includes("bot")) {
            riskScore += 10;
        }

        // ➕ Add previous penalty (IMPORTANT)
        riskScore += penalty;

        // 🎯 FINAL DECISION
        if (riskScore >= 50) {
            console.log("🚨 High Risk:", ip, "Score:", riskScore);

            // 🔥 Increase penalty for repeat offenders
            await redisClient.set(penaltyKey, penalty + 10, "EX", 300);

            return res.status(403).send("High Risk Detected 🚨");
        } else if (riskScore >= 30) {
            console.log("⚠️ Medium Risk:", ip, "Score:", riskScore);
        } else {
            console.log("✅ Low Risk:", ip, "Score:", riskScore);
        }

        await redisClient.set(`risk:${ip}`, riskScore, "EX", 60);
        
        // 🔗 Pass risk to next middleware
        req.riskScore = riskScore;
        next();
    } catch (err) {
        console.warn("⚠️ Behaviour Tracker skipped: Redis connection issue");
        next(); // Let the request pass safely without crashing!
    }
};

module.exports = behaviorMiddleware;