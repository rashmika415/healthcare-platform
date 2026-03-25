// services/doctor/app.js
require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(express.json());

// Import auth middleware
const authMiddleware = require('./middleware/authMiddleware');

// Import doctor routes
const doctorRoutes = require('./routes/doctorRoutes');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully 🎉"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test route (no authentication)
app.get("/", (req, res) => {
  res.send("Doctor Service is running...");
});

// 🔐 Protected Doctor Routes
// Mount doctorRoutes at root for correct path
// API Gateway will forward /doctor/profile → Doctor Service /profile
app.use('/', doctorRoutes);

// Port
const PORT = process.env.PORT || 3002;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Doctor Service running on port ${PORT}`);
});