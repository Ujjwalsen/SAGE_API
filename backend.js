const express = require("express");
const app = express();

app.get("/data", (req, res) => {
    res.json({ message: "Response from Backend Server" });
});

const PORT = process.env.BACKEND_PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
