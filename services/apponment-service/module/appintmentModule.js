const mongoose = require("mongoose");
const  Schema  = mongoose.Schema;

const Appointment = new mongoose.Schema({
  // These fields align with the frontend's appointment UI.
  // NOTE: Old documents may still have patientId/doctorId/specialization/time.
  patientUserId: { type: String, index: true },
  doctorUserId:  { type: String, index: true },
  patientName:   { type: String },
  doctorName:    { type: String },
  specialty:     { type: String },
  date:          { type: String },     // keep as string to match existing UI usage
  timeSlot:      { type: String },     // frontend expects "timeSlot"
  reason:        { type: String },
  status:        { type: String, default: "pending" }, // pending/accepted/rejected/completed/cancelled

  // Telemedicine (video-service) integration
  videoRoomLink:        { type: String },
  videoSessionId:       { type: String },
  videoParticipantToken:{ type: String }
}, { timestamps: true, strict: false });

module.exports = mongoose.model(
    "Appointment", // Model name
     Appointment //function that creates the schema
    );