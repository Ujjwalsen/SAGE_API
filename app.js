require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const behaviour = require("./gateway/behaviour");

const proxy = require("./gateway/proxy");
const rateLimiter = require("./gateway/rateLimiter");
const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

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

// Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
});