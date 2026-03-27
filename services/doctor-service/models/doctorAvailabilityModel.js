const mongoose = require('mongoose');

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorUserId: {
      type: String,
      required: true
    },
    day: {
      type: String,
      required: true,
      enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
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