const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  dosage:   { type: String, required: true },
  duration: { type: String, required: true },
  frequency:{ type: String, default: "Once daily" },
});

const prescriptionSchema = new mongoose.Schema({
  doctorUserId:   { type: String, required: true },
  doctorName:     { type: String },
  patientUserId:  { type: String, required: true },
  patientName:    { type: String },
  medicines:      { type: [medicineSchema], required: true },
  instructions:   { type: String, default: "" },
  diagnosis:      { type: String, default: "" },
  status:         { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);