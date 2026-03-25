// Load environment variables from .env
require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected successfully🎉"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test route
app.get("/", (req, res) => {
  res.send("Doctor Service is running...");
});

// Port
const PORT = process.env.PORT || 3002;

// Start server
app.listen(PORT, () => {
  console.log(` Doctor Service running on port ${PORT} 🚀`);
});