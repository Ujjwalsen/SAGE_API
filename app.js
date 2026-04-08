require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const redisClient = require("./config/redis");
const behaviour = require("./gateway/behaviour");

const proxy = require("./gateway/proxy");
const rateLimiter = require("./gateway/rateLimiter");
const app = express();

app.set("trust proxy", true);

app.use(express.static("public"));
// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(
    morgan("dev", {
        skip: (req) => req.path === "/events"
    })
);


// Behaviour detector
app.use(behaviour);

// Rate Limiter
app.use(rateLimiter);

// Gateway Proxy
app.use("/api", proxy);

// Test Route
app.get("/", (req, res) => {
    res.send("SAGE API Gateway Running 🚀");
});


app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const fetchAndSendData = async () => {
        try {
            let cursor = '0';
            let allKeys = [];
            
            do {
                const result = await redisClient.scan(cursor, 'MATCH', '*', 'COUNT', 100);
                cursor = result[0];
                allKeys = allKeys.concat(result[1]);
            } while (cursor !== '0');

            const ipData = {};
            const endpointStats = {};

            for (let key of allKeys) {
                const value = await redisClient.get(key);
                
                const firstColonIndex = key.indexOf(':');
                if (firstColonIndex === -1) continue;
                
                const prefix = key.substring(0, firstColonIndex);
                const rest = key.substring(firstColonIndex + 1); 
                
                let ip = "";
                let pathName = "";

                if (["req", "risk", "penalty"].includes(prefix)) {
                    ip = rest;
                } else if (prefix === "endpoint") {
                    const lastColonIndex = rest.lastIndexOf(':');
                    if (lastColonIndex !== -1) {
                        ip = rest.substring(0, lastColonIndex);
                        pathName = rest.substring(lastColonIndex + 1);
                    }
                } else {
                    continue; 
                }

                if (!ipData[ip]) {
                    ipData[ip] = { ip, req: 0, endpoint: 0, risk: 0, penalty: 0 };
                }

                const numValue = parseInt(value) || 0;
                if (prefix === "req") ipData[ip].req = numValue;
                if (prefix === "endpoint") {
                    ipData[ip].endpoint += numValue; 
                    if (pathName) {
                        if (!endpointStats[pathName]) endpointStats[pathName] = 0;
                        endpointStats[pathName] += numValue;
                    }
                }
                if (prefix === "risk") ipData[ip].risk = numValue;
                if (prefix === "penalty") ipData[ip].penalty = numValue;
            }

            const payload = {
                ips: Object.values(ipData),
                endpoints: Object.entries(endpointStats).map(([name, value]) => ({ name, value }))
            };
            
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        } catch (err) {
            console.error("SSE fetch error:", err);
        }
    };

    fetchAndSendData(); // Send immediately on connection
    const intervalId = setInterval(fetchAndSendData, 2000); // Compute and push every 2 seconds

    req.on("close", () => {
        clearInterval(intervalId);
    });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
});