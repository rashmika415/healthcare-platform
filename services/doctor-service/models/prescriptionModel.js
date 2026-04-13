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
  // Optional: doctors create prescriptions by patient email (patient id not required in doctor UI).
  patientUserId:  { type: String, required: false },
  patientEmail:   { type: String, required: true, lowercase: true, trim: true },
  patientName:    { type: String },
  medicines:      { type: [medicineSchema], required: true },
  instructions:   { type: String, default: "" },
  diagnosis:      { type: String, default: "" },
  status:         { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);