const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const proxy = require("./gateway/proxy");

const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

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