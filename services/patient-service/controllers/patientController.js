const Patient = require('../models/patientModel');
const { cloudinary } = require('../config/cloudinaryConfig');

// ─────────────────────────────────────────────────────
// POST /patients/profile
// Create profile after first login
// Called once by patient right after registration
// ─────────────────────────────────────────────────────
exports.createProfile = async (req, res) => {
  try {
    // Check if profile already exists for this user
    const existing = await Patient.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({
        error: 'Profile already exists. Use PUT to update.'
      });
    }

    // Create profile — get name and email from gateway headers
    // Patient can also send extra info in body (phone, dob, etc)
    const patient = await Patient.create({
      userId:    req.user.id,
      name:      req.body.name  || req.user.name,
      email:     req.body.email || req.user.email,
      phone:           req.body.phone,
      dateOfBirth:     req.body.dateOfBirth,
      gender:          req.body.gender,
      bloodGroup:      req.body.bloodGroup,
      address:         req.body.address,
      emergencyContact: req.body.emergencyContact
    });

    res.status(201).json({
      message: 'Profile created successfully',
      patient
    });

  } catch (err) {
    console.error('createProfile error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// GET /patients/profile
// Get the logged-in patient's own profile
// ─────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({
        error: 'Profile not found. Please create your profile first.'
      });
    }

    res.status(200).json(patient);

  } catch (err) {
    console.error('getProfile error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// PUT /patients/profile
// Update the logged-in patient's profile
// ─────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    // Fields patient is NOT allowed to change
    const { userId, prescriptions, medicalHistory, ...allowedUpdates } = req.body;

    const updated = await Patient.findOneAndUpdate(
      { userId: req.user.id },  // find by userId from token
      { $set: allowedUpdates }, // only update allowed fields
      { new: true, runValidators: true }
      // new: true → return updated document
      // runValidators → check schema rules on update too
    );

    if (!updated) {
      return res.status(404).json({
        error: 'Profile not found. Please create your profile first.'
      });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      patient: updated
    });

  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// GET /patients/prescriptions
// Get all prescriptions for logged-in patient
// Read-only — doctors write prescriptions, patients read
// ─────────────────────────────────────────────────────
exports.getPrescriptions = async (req, res) => {
  try {
    const patient = await Patient
      .findOne({ userId: req.user.id })
      .select('prescriptions'); // only return prescriptions field

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json({
      count: patient.prescriptions.length,
      prescriptions: patient.prescriptions
    });

  } catch (err) {
    console.error('getPrescriptions error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// GET /patients/history
// Get medical history of logged-in patient
// ─────────────────────────────────────────────────────
exports.getMedicalHistory = async (req, res) => {
  try {
    const patient = await Patient
      .findOne({ userId: req.user.id })
      .select('medicalHistory');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json({
      count: patient.medicalHistory.length,
      history: patient.medicalHistory
    });

  } catch (err) {
    console.error('getMedicalHistory error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// POST /patients/internal/add-prescription
// INTERNAL — called by Doctor Service only
// NOT exposed to frontend
// ─────────────────────────────────────────────────────
exports.addPrescription = async (req, res) => {
  try {
    const { patientUserId, prescription } = req.body;

    if (!patientUserId || !prescription) {
      return res.status(400).json({
        error: 'patientUserId and prescription are required'
      });
    }

    const patient = await Patient.findOneAndUpdate(
      { userId: patientUserId },
      { $push: { prescriptions: prescription } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Prescription added successfully',
      prescriptions: patient.prescriptions
    });

  } catch (err) {
    console.error('addPrescription error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// POST /patients/internal/add-history
// INTERNAL — called by Appointment Service only
// NOT exposed to frontend
// ─────────────────────────────────────────────────────
exports.addHistory = async (req, res) => {
  try {
    const { patientUserId, historyEntry } = req.body;

    if (!patientUserId || !historyEntry) {
      return res.status(400).json({
        error: 'patientUserId and historyEntry are required'
      });
    }

    const patient = await Patient.findOneAndUpdate(
      { userId: patientUserId },
      { $push: { medicalHistory: historyEntry } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json({
      message: 'History updated successfully'
    });

  } catch (err) {
    console.error('addHistory error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// GET /patients/internal/:userId
// INTERNAL — called by Doctor Service to view patient info
// Doctor needs to see patient profile during consultation
// ─────────────────────────────────────────────────────
exports.getPatientByUserId = async (req, res) => {
  try {
    const patient = await Patient
      .findOne({ userId: req.params.userId })
      .select('-__v'); // exclude version field

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json(patient);

  } catch (err) {
    console.error('getPatientByUserId error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// POST /patients/reports
// Upload a medical report file
// ─────────────────────────────────────────────────────

exports.uploadReport = async (req, res) => {
  try {
    // If no file was sent
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Build the report object from what Cloudinary returned
    const newReport = {
      filename:  req.file.originalname,
      url:       req.file.path,      // Cloudinary URL
      publicId:  req.file.filename,  // Cloudinary public_id for deletion
      fileType:  req.file.mimetype,
      size:      req.file.size
    };

    // Push new report into patient's medicalReports array
    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.id },
      { $push: { medicalReports: newReport } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.status(201).json({
      message: 'Report uploaded successfully',
      report:  patient.medicalReports[patient.medicalReports.length - 1]
    });

  } catch (err) {
    console.error('uploadReport error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// GET /patients/reports
// Get all uploaded reports for logged-in patient
// ─────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const patient = await Patient
      .findOne({ userId: req.user.id })
      .select('medicalReports');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json({
      count:   patient.medicalReports.length,
      reports: patient.medicalReports
    });

  } catch (err) {
    console.error('getReports error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


// ─────────────────────────────────────────────────────
// DELETE /patients/reports/:reportId
// Delete a specific report — removes from Cloudinary AND database
// ─────────────────────────────────────────────────────
exports.deleteReport = async (req, res) => {
  try {
    // Find the patient
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Find the specific report inside the array
    const report = patient.medicalReports.id(req.params.reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete from Cloudinary first
    await cloudinary.uploader.destroy(report.publicId, {
      resource_type: 'raw'  // use 'raw' for PDFs, 'image' for images
    });

    // Remove from MongoDB
    report.deleteOne();
    await patient.save();

    res.status(200).json({ message: 'Report deleted successfully' });

  } catch (err) {
    console.error('deleteReport error:', err.message);
    res.status(500).json({ error: err.message });
  }
};