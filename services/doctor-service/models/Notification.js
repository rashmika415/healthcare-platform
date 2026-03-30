const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: String,
  type: String, // "doctor_registered", "doctor_verified"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);