const mongoose = require('mongoose');
const Prescription = require('../models/prescriptionModel');
const Doctor = require('../models/doctorModels');

const getDoctorUserIdsForQuery = async (req) => {
  // Some older records may have been saved using a different "doctor id" value
  // (e.g., doctor profile _id instead of auth user id). We include both to make
  // retrieval robust across logins and data migrations.
  const rawId = req?.user?.id != null ? String(req.user.id).trim() : '';
  const doctorUserIds = [];
  if (rawId) doctorUserIds.push(rawId);

  try {
    // Prefer lookup by auth user id, but fall back to email for older/legacy profiles.
    let doctorProfile = null;
    if (rawId) {
      doctorProfile = await Doctor.findOne({ userId: rawId });
    }
    const email = req?.user?.email != null ? String(req.user.email).trim().toLowerCase() : '';
    if (!doctorProfile && email) {
      doctorProfile = await Doctor.findOne({ email });
    }

    if (doctorProfile?._id) doctorUserIds.push(String(doctorProfile._id));
    if (doctorProfile?.userId) doctorUserIds.push(String(doctorProfile.userId).trim());
  } catch (e) {
    // If lookup fails, fall back to just req.user.id.
  }

  return Array.from(new Set(doctorUserIds)).filter(Boolean);
};

/** Match prescriptions where doctorUserId may be stored as String or ObjectId in BSON. */
const buildDoctorOwnerFilter = (doctorUserIds) => {
  const unique = [...new Set(doctorUserIds.map((id) => String(id).trim()).filter(Boolean))];
  if (unique.length === 0) return null;

  const stringMatch = { doctorUserId: { $in: unique } };
  const oidCandidates = unique.filter(
    (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id
  );
  const oidList = oidCandidates.map((id) => new mongoose.Types.ObjectId(id));
  if (oidList.length === 0) return stringMatch;
  const oidMatch = { doctorUserId: { $in: oidList } };
  return { $or: [stringMatch, oidMatch] };
};

// ── Create Prescription ───────────────────────────────
exports.createPrescription = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Only doctors allowed' });

    const { patientEmail, patientName, medicines, instructions, diagnosis, patientUserId } = req.body;

    const doctorProfile = await Doctor.findOne({ userId: String(req.user.id).trim() });

    if (!patientEmail || String(patientEmail).trim() === '') {
      return res.status(400).json({ error: 'patientEmail is required' });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ error: 'medicines are required' });
    }

    const normalizedEmail = String(patientEmail).trim().toLowerCase();

    const payload = {
      doctorUserId:  String(req.user.id).trim(),
      doctorName:    doctorProfile?.name || req.user.name,
      patientEmail:  normalizedEmail,
      patientName:   patientName || '',
      medicines,
      instructions:  instructions || '',
      diagnosis:     diagnosis || '',
    };

    // Backward compatibility: if patientUserId is provided by caller, persist it.
    if (patientUserId != null && String(patientUserId).trim() !== '') {
      payload.patientUserId = String(patientUserId).trim();
    }

    const prescription = await Prescription.create(payload);

    return res.status(201).json({
      message: 'Prescription created successfully',
      prescription,
    });
  } catch (err) {
    console.error('createPrescription error:', err);
    // Avoid leaking internal validation wording to the UI.
    if (err?.name === 'ValidationError') {
      const hasMedicinesError = Boolean(err?.errors?.medicines);
      if (hasMedicinesError) {
        return res.status(400).json({ error: 'medicines are required' });
      }
      return res.status(400).json({ error: 'Invalid prescription data' });
    }
    return res.status(500).json({ error: 'Failed to create prescription' });
  }
};

// ── Get All Prescriptions by Doctor ──────────────────
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const doctorUserIds = await getDoctorUserIdsForQuery(req);
    const { status, patientEmail } = req.query;
    const ownerFilter = buildDoctorOwnerFilter(doctorUserIds);
    if (!ownerFilter) {
      return res.status(400).json({ error: 'Invalid doctor context' });
    }
    const filter = { ...ownerFilter };

    if (status) filter.status = status;
    if (patientEmail) filter.patientEmail = patientEmail;

    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      total: prescriptions.length,
      prescriptions,
    });
  } catch (err) {
    console.error('getDoctorPrescriptions error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ── Get Single Prescription ───────────────────────────
exports.getPrescriptionById = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const doctorUserIds = await getDoctorUserIdsForQuery(req);
    const ownerFilter = buildDoctorOwnerFilter(doctorUserIds);
    if (!ownerFilter) return res.status(400).json({ error: 'Invalid doctor context' });
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      ...ownerFilter,
    });

    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    return res.status(200).json(prescription);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── Update Prescription Status ────────────────────────
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { status } = req.body;
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const doctorUserIds = await getDoctorUserIdsForQuery(req);
    const ownerFilter = buildDoctorOwnerFilter(doctorUserIds);
    if (!ownerFilter) return res.status(400).json({ error: 'Invalid doctor context' });
    const prescription = await Prescription.findOneAndUpdate(
      { _id: req.params.id, ...ownerFilter },
      { status },
      { new: true }
    );

    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    return res.status(200).json({ message: 'Status updated', prescription });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── Delete Prescription ───────────────────────────────
exports.deletePrescription = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const doctorUserIds = await getDoctorUserIdsForQuery(req);
    const ownerFilter = buildDoctorOwnerFilter(doctorUserIds);
    if (!ownerFilter) return res.status(400).json({ error: 'Invalid doctor context' });
    const prescription = await Prescription.findOneAndDelete({
      _id: req.params.id,
      ...ownerFilter,
    });

    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    return res.status(200).json({ message: 'Prescription deleted successfully' });
  } catch (err) {
    console.error('deletePrescription error:', err);
    return res.status(500).json({ error: 'Failed to delete prescription' });
  }
};

// ── Update Prescription Details (Edit) ─────────────────
exports.updatePrescription = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Only doctors allowed' });

    const { patientEmail, patientName, medicines, instructions, diagnosis, status } = req.body || {};

    // Basic validation for editable fields
    if (patientEmail != null && String(patientEmail).trim() === '') {
      return res.status(400).json({ error: 'patientEmail cannot be empty' });
    }
    if (medicines != null) {
      if (!Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({ error: 'medicines are required' });
      }
      for (const m of medicines) {
        if (!m?.name || !m?.dosage || !m?.duration) {
          return res.status(400).json({ error: 'Fill all medicine fields.' });
        }
      }
    }
    if (status != null && !['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const doctorUserIds = await getDoctorUserIdsForQuery(req);
    const ownerFilter = buildDoctorOwnerFilter(doctorUserIds);
    if (!ownerFilter) return res.status(400).json({ error: 'Invalid doctor context' });

    const update = {};
    if (patientEmail != null) update.patientEmail = String(patientEmail).trim().toLowerCase();
    if (patientName != null) update.patientName = String(patientName);
    if (medicines != null) update.medicines = medicines;
    if (instructions != null) update.instructions = String(instructions);
    if (diagnosis != null) update.diagnosis = String(diagnosis);
    if (status != null) update.status = status;

    const prescription = await Prescription.findOneAndUpdate(
      { _id: req.params.id, ...ownerFilter },
      update,
      { new: true }
    );

    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    return res.status(200).json({ message: 'Prescription updated', prescription });
  } catch (err) {
    console.error('updatePrescription error:', err);
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid prescription data' });
    }
    return res.status(500).json({ error: 'Failed to update prescription' });
  }
};

// ── Get All Prescriptions for Logged-in Patient ─────
exports.getPatientPrescriptions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const requestedPatientId = String(req.params.patientUserId || '').trim();

    // Patients can only read their own prescriptions.
    if (req.user.role === 'patient' && String(req.user.id).trim() !== requestedPatientId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status } = req.query;
    const emailFromAuth = req.user?.email ? String(req.user.email).trim().toLowerCase() : '';
    const filter = {
      $or: [
        { patientUserId: requestedPatientId },
        ...(emailFromAuth ? [{ patientEmail: emailFromAuth }] : []),
      ],
    };
    if (status) {
      if (!['active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      filter.status = status;
    }

    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      total: prescriptions.length,
      prescriptions,
    });
  } catch (err) {
    console.error('getPatientPrescriptions error:', err);
    return res.status(500).json({ error: err.message });
  }
};