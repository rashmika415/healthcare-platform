// doctorAvailabilityModel.js
const mongoose = require('mongoose');

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorUserId: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);