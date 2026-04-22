//services/notification-service/app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { startReminderScheduler } = require("./Services/reminderScheduler");

const app = express();

app.use(cors());
app.use(express.json());

// Health check routes
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

const notificationRoutes = require("./Routes/NotificationRoutes");

app.use("/notifications", notificationRoutes);

const PORT = Number(process.env.PORT) || 3005;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Notification DB Connected");
    startReminderScheduler();
  })
  .catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`Notification Service running on ${PORT}`);
});