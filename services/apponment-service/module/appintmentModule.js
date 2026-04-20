const mongoose = require("mongoose");
const  Schema  = mongoose.Schema;

const Appointment = new mongoose.Schema({
  patientId: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
    },
     patientEmail: {
    type: String,
    required: true
  },
    doctorName: {   
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "BOOKED"
  },
  paymentStatus: {
    type: String,
    default: "PENDING"
  },
  notes: {
    type: String
  },
  appointmentReminder24hSentAt: {
    type: Date,
    default: null
  },
  appointmentReminder1hSentAt: {
    type: Date,
    default: null
  },
  followUpReminderSentAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model(
    "Appointment", // Model name
     Appointment //function that creates the schema
    );