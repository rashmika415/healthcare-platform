// app.js
// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const appointmentRoutes = require("./routes/appointmentRoutes");
app.use("/appointments", appointmentRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Appointment Service is running...");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully ✅"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Port (YOU are using 3003)
const PORT = process.env.PORT || 3003;

// Start server
app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});