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
    const doctorProfile = await Doctor.findOne({ userId: rawId || req.user.id });
    if (doctorProfile?._id) doctorUserIds.push(String(doctorProfile._id));
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

    const { patientUserId, patientName, medicines, instructions, diagnosis } = req.body;

    if (!patientUserId || !medicines || medicines.length === 0) {
      return res.status(400).json({ error: 'patientUserId and medicines are required' });
    }

    // Validate each medicine
    for (const med of medicines) {
      if (!med.name || !med.dosage || !med.duration) {
        return res.status(400).json({ error: 'Each medicine must have name, dosage, and duration' });
      }
    }

    const doctorProfile = await Doctor.findOne({ userId: String(req.user.id).trim() });

    const prescription = await Prescription.create({
      doctorUserId:  String(req.user.id).trim(),
      doctorName:    doctorProfile?.name || req.user.name,
      patientUserId,
      patientName:   patientName || 'Unknown',
      medicines,
      instructions:  instructions || '',
      diagnosis:     diagnosis || '',
    });

    return res.status(201).json({
      message: 'Prescription created successfully',
      prescription,
    });
  } catch (err) {
    console.error('createPrescription error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ── Get All Prescriptions by Doctor ──────────────────
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const doctorUserIds = await getDoctorUserIdsForQuery(req);
    const { status, patientUserId } = req.query;
    const ownerFilter = buildDoctorOwnerFilter(doctorUserIds);
    if (!ownerFilter) {
      return res.status(400).json({ error: 'Invalid doctor context' });
    }
    const filter = { ...ownerFilter };

    if (status) filter.status = status;
    if (patientUserId) filter.patientUserId = patientUserId;

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
    return res.status(500).json({ error: err.message });
  }
};

// ── Get All Prescriptions for Logged-in Patient ─────
exports.getPatientPrescriptions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const requestedPatientId = String(req.params.patientUserId || '').trim();
    if (!requestedPatientId) {
      return res.status(400).json({ error: 'patientUserId is required' });
    }

    // Patients can only read their own prescriptions.
    if (req.user.role === 'patient' && String(req.user.id).trim() !== requestedPatientId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status } = req.query;
    const filter = { patientUserId: requestedPatientId };
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