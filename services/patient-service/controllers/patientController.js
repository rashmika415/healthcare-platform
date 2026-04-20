const Patient = require('../models/patientModel');
const { cloudinary } = require('../config/cloudinaryConfig');
const axios = require('axios');

const doctorServiceBaseUrl = (process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002').replace(/\/$/, '');
const appointmentServiceBaseUrl = (process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003').replace(/\/$/, '');

const toValidDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortByDateDesc = (items) => items.sort((a, b) => {
  const aDate = toValidDate(a.date)?.getTime() || 0;
  const bDate = toValidDate(b.date)?.getTime() || 0;
  return bDate - aDate;
});

const HIGH_RISK_KEYWORDS = [
  'chest pain',
  'shortness of breath',
  'bleeding',
  'fainting',
  'stroke',
  'severe pain',
  'uncontrolled',
  'critical',
  'urgent'
];

const asText = (value) => String(value || '').trim();

const inferScheduleFromText = (text) => {
  const lower = asText(text).toLowerCase();
  if (!lower) return 'As advised by your doctor';

  if (lower.includes('once daily') || lower.includes('once a day') || lower.includes('daily')) {
    return 'Once daily';
  }
  if (lower.includes('twice daily') || lower.includes('two times')) {
    return 'Twice daily';
  }
  if (lower.includes('thrice daily') || lower.includes('three times')) {
    return 'Three times daily';
  }
  if (lower.includes('morning') || lower.includes('night') || lower.includes('evening')) {
    return 'Take at noted times (morning/evening/night)';
  }
  if (lower.includes('after food') || lower.includes('after meal')) {
    return 'Take after meals';
  }
  if (lower.includes('before food') || lower.includes('before meal')) {
    return 'Take before meals';
  }

  return 'Follow doctor instructions';
};

const summarizeChanges = (lastVisit, previousVisit) => {
  if (!lastVisit && !previousVisit) {
    return ['No visit history yet. Book a consultation to start your medical timeline.'];
  }

  if (lastVisit && !previousVisit) {
    const diagnosis = asText(lastVisit.diagnosis) || 'a new consultation note';
    return [`This is your first recorded visit with diagnosis: ${diagnosis}.`];
  }

  const changes = [];
  const lastDiagnosis = asText(lastVisit?.diagnosis).toLowerCase();
  const prevDiagnosis = asText(previousVisit?.diagnosis).toLowerCase();

  if (lastDiagnosis && prevDiagnosis && lastDiagnosis !== prevDiagnosis) {
    changes.push(`Diagnosis changed from "${asText(previousVisit.diagnosis)}" to "${asText(lastVisit.diagnosis)}".`);
  } else if (lastDiagnosis) {
    changes.push(`Current diagnosis remains "${asText(lastVisit.diagnosis)}".`);
  }

  if (asText(lastVisit?.doctorName) && asText(previousVisit?.doctorName)
    && asText(lastVisit.doctorName).toLowerCase() !== asText(previousVisit.doctorName).toLowerCase()) {
    changes.push(`Consulting doctor changed from Dr. ${asText(previousVisit.doctorName)} to Dr. ${asText(lastVisit.doctorName)}.`);
  }

  if (asText(lastVisit?.specialty) && asText(previousVisit?.specialty)
    && asText(lastVisit.specialty).toLowerCase() !== asText(previousVisit.specialty).toLowerCase()) {
    changes.push(`Care specialty changed from ${asText(previousVisit.specialty)} to ${asText(lastVisit.specialty)}.`);
  }

  if (asText(lastVisit?.notes)) {
    changes.push(`Latest doctor note: ${asText(lastVisit.notes)}.`);
  }

  if (!changes.length) {
    changes.push('No major clinical changes found since your previous visit. Continue current care plan.');
  }

  return changes.slice(0, 4);
};

const buildRedFlags = (lastVisit, latestPrescription) => {
  const redFlags = [];
  const clinicalText = [
    asText(lastVisit?.diagnosis),
    asText(lastVisit?.notes),
    asText(latestPrescription?.instructions)
  ].join(' ').toLowerCase();

  HIGH_RISK_KEYWORDS.forEach((keyword) => {
    if (clinicalText.includes(keyword)) {
      redFlags.push({
        severity: ['stroke', 'bleeding', 'shortness of breath', 'chest pain'].includes(keyword) ? 'high' : 'medium',
        message: `Watch for worsening symptoms related to "${keyword}" and seek urgent care if severe.`
      });
    }
  });

  if (asText(lastVisit?.diagnosis).toLowerCase().includes('fever')) {
    redFlags.push({
      severity: 'medium',
      message: 'If fever persists more than 3 days or rises above 102F, contact your doctor quickly.'
    });
  }

  if (asText(lastVisit?.diagnosis).toLowerCase().includes('diabetes')) {
    redFlags.push({
      severity: 'medium',
      message: 'Monitor blood sugar closely. Seek help for dizziness, confusion, or very high/low readings.'
    });
  }

  if (asText(lastVisit?.diagnosis).toLowerCase().includes('hypertension')) {
    redFlags.push({
      severity: 'high',
      message: 'Track blood pressure. Seek urgent help for severe headache, chest pain, or breathlessness.'
    });
  }

  if (!redFlags.length) {
    redFlags.push({
      severity: 'low',
      message: 'If symptoms worsen, new severe pain appears, or breathing becomes difficult, seek immediate care.'
    });
  }

  const uniqueByMessage = [];
  const seenMessages = new Set();
  redFlags.forEach((flag) => {
    const key = asText(flag?.message).toLowerCase();
    if (!key || seenMessages.has(key)) return;
    seenMessages.add(key);
    uniqueByMessage.push({
      severity: ['high', 'medium', 'low'].includes(flag?.severity) ? flag.severity : 'medium',
      message: asText(flag?.message)
    });
  });

  return uniqueByMessage.slice(0, 4);
};

// ─────────────────────────────────────────────────────
// GET /patients/smart-summary
// Patient-friendly summary from history and prescriptions
// ─────────────────────────────────────────────────────
exports.getSmartMedicalSummary = async (req, res) => {
  try {
    const patient = await Patient
      .findOne({ userId: req.user.id })
      .select('medicalHistory prescriptions');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const history = [...(patient.medicalHistory || [])].sort((a, b) => {
      const aTime = toValidDate(a?.date)?.getTime() || 0;
      const bTime = toValidDate(b?.date)?.getTime() || 0;
      return bTime - aTime;
    });

    const prescriptions = [...(patient.prescriptions || [])].sort((a, b) => {
      const aTime = toValidDate(a?.issuedAt)?.getTime() || 0;
      const bTime = toValidDate(b?.issuedAt)?.getTime() || 0;
      return bTime - aTime;
    });

    const lastVisit = history[0] || null;
    const previousVisit = history[1] || null;
    const latestPrescription = prescriptions[0] || null;

    const whatChangedSinceLastVisit = summarizeChanges(lastVisit, previousVisit);
    const currentMedicines = (latestPrescription?.medicines || []).map((medicine) => {
      const doseText = asText(medicine?.dosage);
      const durationText = asText(medicine?.duration);
      const notesText = asText(medicine?.notes);
      const scheduleSource = [doseText, durationText, notesText, asText(latestPrescription?.instructions)].join(' ');

      return {
        name: asText(medicine?.name) || 'Medicine',
        dosage: doseText || 'As prescribed',
        duration: durationText || 'As advised',
        schedule: inferScheduleFromText(scheduleSource),
        notes: notesText || null
      };
    });

    const redFlagsToWatch = buildRedFlags(lastVisit, latestPrescription);

    return res.status(200).json({
      lastUpdatedAt: new Date().toISOString(),
      lastVisitDate: lastVisit?.date || null,
      whatChangedSinceLastVisit,
      currentMedicines,
      redFlagsToWatch,
      visitSnapshot: {
        lastVisit: lastVisit
          ? {
            date: lastVisit.date || null,
            doctorName: asText(lastVisit.doctorName) || null,
            specialty: asText(lastVisit.specialty) || null,
            diagnosis: asText(lastVisit.diagnosis) || null
          }
          : null,
        previousVisit: previousVisit
          ? {
            date: previousVisit.date || null,
            doctorName: asText(previousVisit.doctorName) || null,
            specialty: asText(previousVisit.specialty) || null,
            diagnosis: asText(previousVisit.diagnosis) || null
          }
          : null
      }
    });
  } catch (err) {
    console.error('getSmartMedicalSummary error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

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
    const upstreamHeaders = {
      'x-user-id': req.headers['x-user-id'] || req.user.id,
      'x-user-role': req.headers['x-user-role'] || req.user.role,
      'x-user-email': req.headers['x-user-email'] || req.user.email,
      'x-user-name': req.headers['x-user-name'] || req.user.name
    };

    if (req.headers['x-user-verified'] !== undefined) {
      upstreamHeaders['x-user-verified'] = req.headers['x-user-verified'];
    }

    const response = await axios.get(
      `${doctorServiceBaseUrl}/prescriptions/patient/${encodeURIComponent(req.user.id)}`,
      {
        headers: upstreamHeaders,
        params: {
          status: req.query.status
        },
        timeout: 10000
      }
    );

    res.status(200).json(response.data);

  } catch (err) {
    console.error('getPrescriptions error:', err.message);

    if (err.response) {
      return res.status(err.response.status).json(
        err.response.data || { error: 'Failed to fetch prescriptions from doctor service' }
      );
    }

    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Doctor service timeout while fetching prescriptions' });
    }

    res.status(503).json({ error: 'Doctor service unavailable' });
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
// GET /patients/medical-history
// Aggregated timeline for logged-in patient (read-only)
// ─────────────────────────────────────────────────────
exports.getMedicalHistoryOverview = async (req, res) => {
  try {
    const patient = await Patient
      .findOne({ userId: req.user.id })
      .select('medicalHistory prescriptions');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const historyItems = (patient.medicalHistory || []).map((h) => ({
      type: 'history',
      date: h?.date || null,
      title: h?.diagnosis || 'Medical history update',
      data: h,
    }));

    const rxItems = (patient.prescriptions || []).map((p) => ({
      type: 'prescription',
      date: p?.issuedAt || null,
      title: p?.doctorName ? `Prescription by ${p.doctorName}` : 'Prescription',
      data: p,
    }));

    const timeline = sortByDateDesc([...historyItems, ...rxItems].map((item) => ({
      ...item,
      // normalize date key for sorting helper
      date: item.date,
    })));

    return res.status(200).json({
      count: timeline.length,
      timeline,
    });
  } catch (err) {
    console.error('getMedicalHistoryOverview error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// GET /patients/emails
// Used by doctor prescription UI dropdown
// ─────────────────────────────────────────────────────
exports.getAllPatientEmails = async (req, res) => {
  try {
    if (req.user?.role && !['doctor', 'admin'].includes(String(req.user.role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const patients = await Patient.find({})
      .select('name email userId')
      .sort({ createdAt: -1 })
      .limit(500);

    return res.status(200).json({
      patients: (patients || []).map((p) => ({
        name: p.name,
        email: p.email,
        userId: p.userId,
      })),
    });
  } catch (err) {
    console.error('getAllPatientEmails error:', err.message);
    return res.status(500).json({ error: err.message });
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


const REPORT_TYPES = new Set(['lab', 'radiology', 'prescription-scan', 'discharge-summary', 'other']);
const REPORT_STATUSES = new Set(['active', 'archived', 'deleted']);

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const parseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const inferFormatFromFilename = (filename = '') => {
  const parts = String(filename).split('.');
  return parts.length > 1 ? String(parts.pop() || '').toLowerCase() : '';
};

const resolveReportVisibility = (report) => {
  if (report?.visibility === 'private' || report?.visibility === 'shared') {
    return report.visibility;
  }
  return Array.isArray(report?.sharedWithDoctors) && report.sharedWithDoctors.length > 0 ? 'shared' : 'private';
};

const withResolvedVisibility = (report) => {
  if (!report) return report;
  const normalized = typeof report.toObject === 'function' ? report.toObject() : { ...report };
  normalized.visibility = resolveReportVisibility(report);
  return normalized;
};

const resolveDoctorByEmail = async (req, doctorEmail) => {
  const email = String(doctorEmail || '').trim().toLowerCase();
  if (!email) return null;

  const upstreamHeaders = {
    'x-user-id': req.headers['x-user-id'] || req.user.id,
    'x-user-role': req.headers['x-user-role'] || req.user.role,
    'x-user-email': req.headers['x-user-email'] || req.user.email,
    'x-user-name': req.headers['x-user-name'] || req.user.name
  };
  if (req.headers['x-user-verified'] !== undefined) {
    upstreamHeaders['x-user-verified'] = req.headers['x-user-verified'];
  }

  const response = await axios.get(
    `${doctorServiceBaseUrl}/internal/by-email/${encodeURIComponent(email)}`,
    {
      headers: upstreamHeaders,
      timeout: 10000
    }
  );

  return response?.data?.doctor || null;
};

const normalizeReportMetadata = (body, { partial = false } = {}) => {
  const errors = [];
  const normalized = {};
  const hasDoctorUserId = body.doctorUserId !== undefined && String(body.doctorUserId || '').trim();

  if (!partial || body.reportType !== undefined) {
    const reportType = String(body.reportType || '').trim();
    if (!reportType || !REPORT_TYPES.has(reportType)) {
      errors.push('reportType is required and must be one of: lab, radiology, prescription-scan, discharge-summary, other');
    } else {
      normalized.reportType = reportType;
    }
  }

  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) {
      errors.push('title is required');
    } else {
      normalized.title = title;
    }
  }

  if (body.description !== undefined) {
    normalized.description = String(body.description || '').trim();
  }

  if (body.doctorUserId !== undefined) {
    normalized.doctorUserId = String(body.doctorUserId || '').trim();
  }
  if (body.doctorEmail !== undefined) {
    normalized.doctorEmail = String(body.doctorEmail || '').trim().toLowerCase();
  }

  if (body.visibility !== undefined || !partial) {
    const visibility = String(body.visibility || (hasDoctorUserId ? 'shared' : 'private')).trim().toLowerCase();
    if (!['private', 'shared'].includes(visibility)) {
      errors.push('visibility must be one of: private, shared');
    } else {
      normalized.visibility = visibility;
    }
  }

  if (body.appointmentId !== undefined) {
    normalized.appointmentId = String(body.appointmentId || '').trim();
  }

  if (body.hospitalOrLabName !== undefined) {
    normalized.hospitalOrLabName = String(body.hospitalOrLabName || '').trim();
  }

  if (!partial || body.reportDate !== undefined) {
    const reportDate = parseDate(body.reportDate);
    if (!reportDate) {
      errors.push('reportDate is required and must be a valid date');
    } else {
      normalized.reportDate = reportDate;
    }
  }

  if (body.isCritical !== undefined || !partial) {
    normalized.isCritical = parseBoolean(body.isCritical, false);
  }

  if (body.tags !== undefined) {
    normalized.tags = parseArray(body.tags);
  }

  if (body.status !== undefined) {
    const status = String(body.status || '').trim().toLowerCase();
    if (!REPORT_STATUSES.has(status)) {
      errors.push('status must be one of: active, archived, deleted');
    } else {
      normalized.status = status;
    }
  }

  if (
    normalized.visibility === 'shared' &&
    !String(normalized.doctorUserId || '').trim() &&
    !String(normalized.doctorEmail || '').trim()
  ) {
    errors.push('doctorUserId or doctorEmail is required when visibility is shared');
  }

  return { errors, normalized };
};

// ─────────────────────────────────────────────────────
// POST /patients/reports
// Upload a medical report with metadata
// ─────────────────────────────────────────────────────
exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { errors, normalized } = normalizeReportMetadata(req.body, { partial: false });
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    let resolvedDoctorUserId = String(normalized.doctorUserId || '').trim();
    if (!resolvedDoctorUserId && normalized.visibility === 'shared' && normalized.doctorEmail) {
      try {
        const doctor = await resolveDoctorByEmail(req, normalized.doctorEmail);
        resolvedDoctorUserId = doctor?.userId || '';
      } catch (err) {
        if (err.response?.status === 404) {
          return res.status(404).json({ error: 'No doctor profile found for this email' });
        }
        return res.status(503).json({ error: 'Unable to resolve doctor by email at the moment' });
      }
    }

    if (normalized.visibility === 'shared' && !resolvedDoctorUserId) {
      return res.status(400).json({ error: 'doctorUserId or valid doctorEmail is required for shared reports' });
    }

    // Infer resource type from MIME type (more reliable than Cloudinary metadata)
    const mimeType = String(req.file.mimetype || '').toLowerCase();
    const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';
    const extension = (req.file.originalname || '').split('.').pop();
    const format = (req.file.format || extension || '').toLowerCase();

    console.log(`uploadReport: ${req.file.originalname} -> mimeType=${mimeType} -> resourceType=${resourceType}`);

    const { doctorEmail, ...normalizedWithoutDoctorEmail } = normalized;

    const newReport = {
      filename: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      resourceType,
      fileType: req.file.mimetype,
      format,
      size: req.file.size,
      ...normalizedWithoutDoctorEmail,
      doctorUserId: resolvedDoctorUserId || normalized.doctorUserId,
      patientUserId: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      sharedWithDoctors: resolvedDoctorUserId ? [resolvedDoctorUserId] : (normalized.doctorUserId ? [normalized.doctorUserId] : []),
      visibility: normalized.visibility || (resolvedDoctorUserId || normalized.doctorUserId ? 'shared' : 'private')
    };

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.id },
      { $push: { medicalReports: newReport } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const report = patient.medicalReports[patient.medicalReports.length - 1];
    res.status(201).json({
      message: 'Report uploaded successfully',
      report
    });
  } catch (err) {
    console.error('uploadReport error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// GET /patients/reports
// Get reports with filters and pagination
// ─────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const patient = await Patient
      .findOne({ userId: req.user.id })
      .select('medicalReports');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = String(req.query.search || '').trim().toLowerCase();
    const fromDate = parseDate(req.query.fromDate);
    const toDate = parseDate(req.query.toDate);
    const reportType = req.query.type ? String(req.query.type).trim() : null;
    const tag = req.query.tag ? String(req.query.tag).trim().toLowerCase() : null;
    const includeDeleted = parseBoolean(req.query.includeDeleted, false);
    const status = req.query.status ? String(req.query.status).trim().toLowerCase() : null;

    let reports = patient.medicalReports.slice();

    if (!includeDeleted) {
      reports = reports.filter((report) => report.status !== 'deleted');
    }

    if (status && REPORT_STATUSES.has(status)) {
      reports = reports.filter((report) => report.status === status);
    }

    if (reportType) {
      reports = reports.filter((report) => report.reportType === reportType);
    }

    if (req.query.visibility) {
      const visibility = String(req.query.visibility).trim().toLowerCase();
      if (visibility === 'private' || visibility === 'shared') {
        reports = reports.filter((report) => resolveReportVisibility(report) === visibility);
      }
    }

    if (fromDate) {
      reports = reports.filter((report) => report.reportDate && new Date(report.reportDate) >= fromDate);
    }

    if (toDate) {
      reports = reports.filter((report) => report.reportDate && new Date(report.reportDate) <= toDate);
    }

    if (tag) {
      reports = reports.filter((report) => (report.tags || []).some((t) => String(t).toLowerCase() === tag));
    }

    if (search) {
      reports = reports.filter((report) => {
        const title = String(report.title || '').toLowerCase();
        const description = String(report.description || '').toLowerCase();
        const facility = String(report.hospitalOrLabName || '').toLowerCase();
        return title.includes(search) || description.includes(search) || facility.includes(search);
      });
    }

    reports.sort((a, b) => new Date(b.reportDate || b.uploadedAt || 0) - new Date(a.reportDate || a.uploadedAt || 0));

    const total = reports.length;
    const startIndex = (page - 1) * limit;
    const paginated = reports
      .slice(startIndex, startIndex + limit)
      .map((report) => withResolvedVisibility(report));

    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: paginated.length,
      reports: paginated
    });
  } catch (err) {
    console.error('getReports error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// GET /patients/reports/:reportId
// Get one report by id
// ─────────────────────────────────────────────────────
exports.getReportById = async (req, res) => {
  try {
    let patient = null;
    let report = null;

    if (req.user.role === 'doctor') {
      patient = await Patient
        .findOne({
          medicalReports: {
            $elemMatch: {
              _id: req.params.reportId,
              sharedWithDoctors: req.user.id,
              status: { $ne: 'deleted' }
            }
          }
        })
        .select('medicalReports userId name email');
    } else {
      patient = await Patient
        .findOne({ userId: req.user.id })
        .select('medicalReports userId name email');
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    report = patient.medicalReports.id(req.params.reportId);
    if (!report || report.status === 'deleted') {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (req.user.role === 'doctor' && !report.sharedWithDoctors.includes(req.user.id)) {
      return res.status(403).json({ error: 'You do not have access to this report' });
    }

    const responsePayload = withResolvedVisibility(report);
    if (req.user.role === 'doctor') {
      responsePayload.patient = {
        userId: patient.userId,
        name: patient.name,
        email: patient.email
      };
    }

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('getReportById error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// PATCH /patients/reports/:reportId
// Update report metadata
// ─────────────────────────────────────────────────────
exports.updateReportMetadata = async (req, res) => {
  try {
    const { errors, normalized } = normalizeReportMetadata(req.body, { partial: true });
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const report = patient.medicalReports.id(req.params.reportId);
    if (!report || report.status === 'deleted') {
      return res.status(404).json({ error: 'Report not found' });
    }

    Object.keys(normalized).forEach((key) => {
      report[key] = normalized[key];
    });
    report.updatedBy = req.user.id;

    await patient.save();

    res.status(200).json({
      message: 'Report updated successfully',
      report
    });
  } catch (err) {
    console.error('updateReportMetadata error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// POST /patients/reports/:reportId/share
// Share report with doctor
// ─────────────────────────────────────────────────────
exports.shareReportWithDoctor = async (req, res) => {
  try {
    const doctorUserId = String(req.body.doctorUserId || '').trim();
    if (!doctorUserId) {
      return res.status(400).json({ error: 'doctorUserId is required' });
    }

    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const report = patient.medicalReports.id(req.params.reportId);
    if (!report || report.status === 'deleted') {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!report.sharedWithDoctors.includes(doctorUserId)) {
      report.sharedWithDoctors.push(doctorUserId);
    }
    report.visibility = 'shared';
    report.updatedBy = req.user.id;

    await patient.save();

    res.status(200).json({
      message: 'Report shared successfully',
      report
    });
  } catch (err) {
    console.error('shareReportWithDoctor error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// POST /patients/reports/:reportId/unshare
// Remove doctor access to report
// ─────────────────────────────────────────────────────
exports.unshareReportWithDoctor = async (req, res) => {
  try {
    const doctorUserId = String(req.body.doctorUserId || '').trim();
    if (!doctorUserId) {
      return res.status(400).json({ error: 'doctorUserId is required' });
    }

    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const report = patient.medicalReports.id(req.params.reportId);
    if (!report || report.status === 'deleted') {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.sharedWithDoctors = report.sharedWithDoctors.filter((id) => id !== doctorUserId);
    report.visibility = report.sharedWithDoctors.length > 0 ? 'shared' : 'private';
    report.updatedBy = req.user.id;

    await patient.save();

    res.status(200).json({
      message: 'Report unshared successfully',
      report
    });
  } catch (err) {
    console.error('unshareReportWithDoctor error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// PATCH /patients/reports/:reportId/archive
// Archive report
// ─────────────────────────────────────────────────────
exports.archiveReport = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const report = patient.medicalReports.id(req.params.reportId);
    if (!report || report.status === 'deleted') {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = 'archived';
    report.updatedBy = req.user.id;
    await patient.save();

    res.status(200).json({
      message: 'Report archived successfully',
      report
    });
  } catch (err) {
    console.error('archiveReport error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// GET /patients/reports/download/:reportId
// Return signed url for secure download
// ─────────────────────────────────────────────────────
exports.getReportDownloadUrl = async (req, res) => {
  try {
    let patient = null;
    if (req.user.role === 'doctor') {
      patient = await Patient
        .findOne({
          medicalReports: {
            $elemMatch: {
              _id: req.params.reportId,
              sharedWithDoctors: req.user.id,
              status: { $ne: 'deleted' }
            }
          }
        })
        .select('medicalReports');
    } else {
      patient = await Patient
        .findOne({ userId: req.user.id })
        .select('medicalReports');
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const report = patient.medicalReports.id(req.params.reportId);
    if (!report || report.status === 'deleted') {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (req.user.role === 'doctor' && !report.sharedWithDoctors.includes(req.user.id)) {
      return res.status(403).json({ error: 'You do not have access to this report' });
    }

    let downloadUrl = report.url;
    let usedFallbackUrl = true;
    const mode = String(req.query.mode || 'download').toLowerCase();
    const asAttachment = mode !== 'view';

    console.log(`getReportDownloadUrl: reportId=${report._id}, resourceType=${report.resourceType}, format=${report.format}`);

    try {
      const mimeType = String(report.fileType || '').toLowerCase();
      const inferredPreferredType = mimeType.startsWith('image/') ? 'image' : 'raw';
      const candidates = [...new Set([report.resourceType, inferredPreferredType, 'image', 'raw'])].filter(Boolean);

      let cloudinaryResource = null;
      for (const resourceType of candidates) {
        try {
          const resource = await cloudinary.api.resource(report.publicId, { resource_type: resourceType });
          if (resource?.secure_url) {
            cloudinaryResource = { resourceType, secureUrl: resource.secure_url };
            break;
          }
        } catch (err) {
          const notFound = err?.http_code === 404 || String(err?.message || '').toLowerCase().includes('not found');
          if (!notFound) {
            console.warn(`cloudinary resource lookup ${resourceType} error:`, err.message);
          }
        }
      }

      if (!cloudinaryResource) {
        throw new Error('Resource not found on Cloudinary');
      }

      console.log(`  resolved Cloudinary resourceType: ${cloudinaryResource.resourceType}`);
      const fileFormat =
        String(cloudinaryResource.format || report.format || inferFormatFromFilename(report.filename) || '').toLowerCase();

      if (!fileFormat) {
        throw new Error('Unable to determine report format for signed download URL');
      }

      downloadUrl = cloudinary.utils.private_download_url(
        report.publicId,
        fileFormat,
        {
          resource_type: cloudinaryResource.resourceType,
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 600,
          attachment: asAttachment
        }
      );
      usedFallbackUrl = false;
    } catch (cloudinaryError) {
      console.error('getReportDownloadUrl cloudinary error:', cloudinaryError.message);
      downloadUrl = report.url;
      usedFallbackUrl = true;
      console.log(`  using fallback URL: ${downloadUrl}`);
    }

    res.status(200).json({
      reportId: report._id,
      mode,
      expiresInSeconds: 600,
      downloadUrl,
      usedFallbackUrl
    });
  } catch (err) {
    console.error('getReportDownloadUrl error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// GET /patients/reports/shared/me
// Doctor can view reports shared with them
// ─────────────────────────────────────────────────────
exports.getMySharedReportsAsDoctor = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can access shared report feed' });
    }

    const patients = await Patient
      .find({
        medicalReports: {
          $elemMatch: {
            sharedWithDoctors: req.user.id,
            status: { $ne: 'deleted' }
          }
        }
      })
      .select('userId name email medicalReports');

    const sharedReports = [];
    patients.forEach((patient) => {
      patient.medicalReports.forEach((report) => {
        if (report.status !== 'deleted' && report.sharedWithDoctors.includes(req.user.id)) {
          sharedReports.push({
            patient: {
              userId: patient.userId,
              name: patient.name,
              email: patient.email
            },
            report: withResolvedVisibility(report)
          });
        }
      });
    });

    res.status(200).json({
      count: sharedReports.length,
      reports: sharedReports
    });
  } catch (err) {
    console.error('getMySharedReportsAsDoctor error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// POST /patients/reports/:reportId/doctor-note
// Doctor adds a note to a shared report
// ─────────────────────────────────────────────────────
exports.addDoctorNoteToReport = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can add notes to reports' });
    }

    const note = String(req.body?.note || '').trim();
    if (!note) {
      return res.status(400).json({ error: 'note is required' });
    }

    const reportId = req.params.reportId;
    const patient = await Patient
      .findOne({
        medicalReports: {
          $elemMatch: {
            _id: reportId,
            sharedWithDoctors: req.user.id,
            status: { $ne: 'deleted' }
          }
        }
      })
      .select('userId name email');

    if (!patient) {
      return res.status(404).json({ error: 'Report not found or not shared with this doctor' });
    }

    // Atomic update avoids full-document revalidation on legacy report records.
    const updateResult = await Patient.updateOne(
      {
        _id: patient._id,
        medicalReports: {
          $elemMatch: {
            _id: reportId,
            sharedWithDoctors: req.user.id,
            status: { $ne: 'deleted' }
          }
        }
      },
      {
        $push: {
          'medicalReports.$.doctorNotes': {
            doctorUserId: req.user.id,
            doctorName: req.user.name,
            note,
            createdAt: new Date(),
            isRead: false
          }
        },
        $set: {
          'medicalReports.$.updatedBy': req.user.id
        }
      }
    );

    if (!updateResult.modifiedCount) {
      return res.status(404).json({ error: 'Report not found or not shared with this doctor' });
    }

    return res.status(200).json({
      message: 'Note sent to patient',
      patient: {
        userId: patient.userId,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (err) {
    console.error('addDoctorNoteToReport error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// POST /patients/reports/:reportId/doctor-note/read
// Patient marks doctor notes as read
// ─────────────────────────────────────────────────────
exports.markReportNotesRead = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can mark notes as read' });
    }

    const updateResult = await Patient.updateOne(
      {
        userId: req.user.id,
        medicalReports: {
          $elemMatch: {
            _id: req.params.reportId,
            status: { $ne: 'deleted' }
          }
        }
      },
      {
        $set: {
          'medicalReports.$.doctorNotes.$[note].isRead': true,
          'medicalReports.$.updatedBy': req.user.id
        }
      },
      {
        arrayFilters: [{ 'note.isRead': { $ne: true } }]
      }
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json({ message: 'Notes marked as read' });
  } catch (err) {
    console.error('markReportNotesRead error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────
// DELETE /patients/reports/:reportId
// Soft delete report and remove remote file
// ─────────────────────────────────────────────────────
exports.deleteReport = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const report = patient.medicalReports.id(req.params.reportId);
    if (!report || report.status === 'deleted') {
      return res.status(404).json({ error: 'Report not found' });
    }

    const resourceTypeCandidates = [...new Set([report.resourceType, 'image', 'raw'])].filter(Boolean);
    for (const resourceType of resourceTypeCandidates) {
      try {
        await cloudinary.uploader.destroy(report.publicId, { resource_type: resourceType });
      } catch (destroyErr) {
        console.warn(`deleteReport cloudinary destroy ${resourceType} error:`, destroyErr.message);
      }
    }

    await Patient.updateOne(
      { userId: req.user.id },
      {
        $set: {
          'medicalReports.$[report].status': 'deleted',
          'medicalReports.$[report].deletedAt': new Date(),
          'medicalReports.$[report].deletedBy': req.user.id,
          'medicalReports.$[report].updatedBy': req.user.id
        }
      },
      {
        arrayFilters: [{ 'report._id': report._id }]
      }
    );

    res.status(200).json({ message: 'Report deleted successfully' });

  } catch (err) {
    console.error('deleteReport error:', err.message);
    res.status(500).json({ error: err.message });
  }
};