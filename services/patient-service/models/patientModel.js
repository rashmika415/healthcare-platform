const mongoose = require('mongoose');

// ── Sub-schema: Prescription ──────────────────────────
// Prescriptions are written by doctors
// Patients can only READ these, not create them
const prescriptionSchema = new mongoose.Schema({
  doctorId:      { type: String, required: true },
  doctorName:    { type: String, required: true },
  appointmentId: { type: String },
  medicines: [
    {
      name:     { type: String, required: true },
      dosage:   { type: String },  // e.g. "500mg"
      duration: { type: String },  // e.g. "7 days"
      notes:    { type: String }   // e.g. "take after meals"
    }
  ],
  instructions: { type: String },
  issuedAt:     { type: Date, default: Date.now }
});

// ── Sub-schema: Medical History ───────────────────────
// Added after each consultation is completed
const historySchema = new mongoose.Schema({
  appointmentId: { type: String },
  doctorName:    { type: String },
  specialty:     { type: String },  // e.g. "Cardiology"
  date:          { type: Date },
  diagnosis:     { type: String },
  notes:         { type: String }
});


// ──Report sub-schema ────────────────────────────
const reportSchema = new mongoose.Schema({
  filename:   { type: String, required: true }, // original file name
  url:        { type: String, required: true }, // Cloudinary URL to view/download
  publicId:   { type: String, required: true }, // Cloudinary ID — needed to delete
  fileType:   { type: String },                 // pdf, image/jpeg etc
  size:       { type: Number },                 // file size in bytes
  uploadedAt: { type: Date, default: Date.now }
});


// ── Main Patient Schema ───────────────────────────────
const patientSchema = new mongoose.Schema(
  {
    userId:    { type: String, required: true, unique: true },
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true },
    phone:     { type: String },
    dateOfBirth: { type: Date },
    gender:    { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
    address:   { type: String },
    emergencyContact: {
      name:         { type: String },
      phone:        { type: String },
      relationship: { type: String }
    },
    medicalReports:  [reportSchema],      // ← NEW
    prescriptions:   [prescriptionSchema],
    medicalHistory:  [historySchema]
  },
  { timestamps: true }
);


module.exports = mongoose.model('Patient', patientSchema);