// patientModel.js
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
  resourceType: { type: String, enum: ['image', 'raw'], default: 'raw' },
  fileType:   { type: String },                 // pdf, image/jpeg etc
  format:     { type: String },                 // pdf, jpg, png
  size:       { type: Number },                 // file size in bytes
  reportType: {
    type: String,
    enum: ['lab', 'radiology', 'prescription-scan', 'discharge-summary', 'other'],
    required: true
  },
  title:      { type: String, required: true, trim: true },
  description:{ type: String, trim: true },
  patientUserId: { type: String, required: true },
  doctorUserId:  { type: String },
  appointmentId: { type: String },
  hospitalOrLabName: { type: String, trim: true },
  reportDate:  { type: Date, required: true },
  isCritical:  { type: Boolean, default: false },
  tags:        [{ type: String, trim: true }],
  sharedWithDoctors: [{ type: String }],
  visibility: {
    type: String,
    enum: ['private', 'shared'],
    default: 'private'
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  createdBy:   { type: String },
  updatedBy:   { type: String },
  deletedBy:   { type: String },
  deletedAt:   { type: Date },
  uploadedAt: { type: Date, default: Date.now },

  // Notes sent by doctors to the patient for this report
  doctorNotes: [
    {
      doctorUserId: { type: String, required: true },
      doctorName:   { type: String },
      note:         { type: String, required: true, trim: true },
      createdAt:    { type: Date, default: Date.now },
      isRead:       { type: Boolean, default: false }
    }
  ]
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

patientSchema.index({ userId: 1, 'medicalReports.reportDate': -1 });
patientSchema.index({ userId: 1, 'medicalReports.reportType': 1 });
patientSchema.index({ userId: 1, 'medicalReports.status': 1 });


module.exports = mongoose.model('Patient', patientSchema);