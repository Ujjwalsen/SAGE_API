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
        skip: (req) => req.path === "/dashboard"
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


app.get("/dashboard", async (req, res) => {
    try {
        const keys = await redisClient.keys("*");

        let data = [];

        for (let key of keys) {
            const value = await redisClient.get(key);
            data.push({ key, value });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
});
// Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
});