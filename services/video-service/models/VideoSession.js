const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  appointmentId: {
    type: String,
    required: true
  },
  patientUserId: {
    type: String,
    required: true
  },
  doctorUserId: {
    type: String,
    required: true
  },
  roomName: {
    type: String,
    required: true
  },
  participantToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB automatically deletes the document when expiresAt is reached
  }
}, { timestamps: true });

module.exports = mongoose.model('VideoSession', videoSessionSchema);
