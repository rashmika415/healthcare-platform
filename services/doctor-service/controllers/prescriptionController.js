const mongoose = require('mongoose');
const OpenAI = require('openai');
const Prescription = require('../models/prescriptionModel');
const Doctor = require('../models/doctorModels');

const getDoctorUserIdsForQuery = async (req) => {
  const rawId = req?.user?.id != null ? String(req.user.id).trim() : '';
  const doctorUserIds = [];
  if (rawId) doctorUserIds.push(rawId);

  try {
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
    // ignore and fall back to req.user.id only
  }

  return Array.from(new Set(doctorUserIds)).filter(Boolean);
};

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

// ── AI Suggestion Helpers ─────────────────────────────
const AI_SUGGESTION_SCHEMA_EXAMPLE = {
  medicines: [
    {
      name: 'string',
      dosage: 'string',
      duration: 'string',
      frequency: 'Once daily | Twice daily | Three times daily | Four times daily | As needed',
    },
  ],
  instructions: 'string',
};

const normalizeAiResponse = (data) => {
  const allowedFrequencies = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'As needed',
  ];

  let medicines = [];

  if (Array.isArray(data?.medicines)) {
    medicines = data.medicines;
  } else if (Array.isArray(data?.suggestions)) {
    medicines = data.suggestions;
  } else if (Array.isArray(data?.medications)) {
    medicines = data.medications;
  } else if (Array.isArray(data?.drugs)) {
    medicines = data.drugs;
  } else if (Array.isArray(data?.items)) {
    medicines = data.items;
  } else if (Array.isArray(data?.prescription)) {
    medicines = data.prescription;
  } else if (data?.medicine) {
    medicines = [
      {
        name: data.medicine,
        dosage: data.dosage,
        duration: data.duration,
        frequency: data.frequency,
      },
    ];
  }

  medicines = medicines
    .map((m) => ({
      name: m?.name ? String(m.name).trim() : '',
      dosage: m?.dosage ? String(m.dosage).trim() : '',
      duration: m?.duration ? String(m.duration).trim() : '',
      frequency: allowedFrequencies.includes(String(m?.frequency || '').trim())
        ? String(m.frequency).trim()
        : 'Once daily',
    }))
    .filter((m) => m.name || m.dosage || m.duration);

  return {
    medicines,
    instructions:
      (typeof data?.instructions === 'string' && data.instructions.trim()) ||
      (typeof data?.note === 'string' && data.note.trim()) ||
      (typeof data?.notes === 'string' && data.notes.trim()) ||
      (typeof data?.instruction === 'string' && data.instruction.trim()) ||
      '',
  };
};

const getFallbackSuggestion = (diagnosis) => {
  return {
    medicines: [
      {
        name: 'Doctor review required',
        dosage: 'As directed',
        duration: 'As directed',
        frequency: 'As needed',
      },
    ],
    instructions: `AI suggestion is unavailable for "${diagnosis}". Please review and enter manually.`,
  };
};

const extractJsonFromText = (text) => {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (e) {
    // continue
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch (e) {
      // continue
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const possibleJson = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(possibleJson);
    } catch (e) {
      // continue
    }
  }

  return null;
};

const getAiSuggestionFromGroq = async ({ patientEmail, patientName, diagnosis }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const system = [
    'You are a clinical assistant helping a doctor draft a prescription suggestion from a diagnosis.',
    'Return ONLY a single JSON object. No markdown. No explanation.',
    'This is a draft suggestion for doctor review, not medical advice to the patient.',
    'If the diagnosis is ambiguous/unsafe, return conservative symptomatic care and add clear instructions to re-evaluate.',
    'Avoid antibiotics unless the diagnosis strongly indicates bacterial infection; never invent lab results.',
  ].join(' ');

  const makeUserPayload = (mode) =>
    JSON.stringify(
      {
        patient: {
          email: patientEmail || 'N/A',
          name: patientName || 'N/A',
        },
        diagnosis: String(diagnosis || '').trim(),
        output_format_example: AI_SUGGESTION_SCHEMA_EXAMPLE,
        constraints: {
          allowed_frequencies: [
            'Once daily',
            'Twice daily',
            'Three times daily',
            'Four times daily',
            'As needed',
          ],
          min_medicines: 1,
          max_medicines: 5,
          if_unsure_use: {
            name: 'Doctor review required',
            dosage: 'As directed',
            duration: 'As directed',
            frequency: 'As needed',
          },
          mode,
        },
      },
      null,
      2
    );

  const tryOnce = async (temperature, mode) => {
    const user = makeUserPayload(mode);
    const request = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_tokens: 700,
    };

    let response;
    try {
      response = await client.chat.completions.create({
        ...request,
        response_format: { type: 'json_object' },
      });
    } catch (err) {
      // Some models/providers reject response_format; retry without it.
      response = await client.chat.completions.create(request);
    }

    const text = response?.choices?.[0]?.message?.content || '';
    const parsed = extractJsonFromText(text);
    if (!parsed) throw new Error('Failed to parse AI JSON response');
    return parsed;
  };

  // Two-pass strategy:
  // 1) Draft (creative but constrained)
  // 2) Repair (ultra strict) if draft yields empty/invalid medicines
  const draft = await tryOnce(0.2, 'draft');
  const draftNormalized = normalizeAiResponse(draft);
  if (Array.isArray(draftNormalized?.medicines) && draftNormalized.medicines.length > 0) {
    return draft;
  }

  const repaired = await tryOnce(0.0, 'repair');
  return repaired;
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
      doctorUserId: String(req.user.id).trim(),
      doctorName: doctorProfile?.name || req.user.name,
      patientEmail: normalizedEmail,
      patientName: patientName || '',
      medicines,
      instructions: instructions || '',
      diagnosis: diagnosis || '',
    };

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

// ── Generate AI Suggestion ────────────────────────────
exports.generateAiSuggestion = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Only doctors allowed' });

    const { patientEmail, patientName, diagnosis } = req.body || {};

    if (!diagnosis || String(diagnosis).trim() === '') {
      return res.status(400).json({ error: 'diagnosis is required' });
    }

    let suggestion = null;
    let source = 'ai';

    try {
      const aiData = await getAiSuggestionFromGroq({
        patientEmail,
        patientName,
        diagnosis: String(diagnosis).trim(),
      });

      suggestion = normalizeAiResponse(aiData);

      if (!Array.isArray(suggestion?.medicines) || suggestion.medicines.length === 0) {
        throw new Error('AI returned no usable medicines');
      }
    } catch (aiErr) {
      console.error('AI suggestion failed, using fallback:', aiErr?.message || aiErr);
      suggestion = getFallbackSuggestion(diagnosis);
      source = 'fallback';
    }

    return res.status(200).json({
      medicines: Array.isArray(suggestion?.medicines) ? suggestion.medicines : [],
      instructions: suggestion?.instructions || '',
      source,
    });
  } catch (err) {
    console.error('generateAiSuggestion error:', err);
    return res.status(500).json({ error: 'Failed to generate AI suggestion' });
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