const express = require("express");
const app = express();

app.get("/data", (req, res) => {
    res.json({ message: "Response from Backend Server" });
});

app.listen(4000, () => {
    console.log("Backend running on port 4000");
});
