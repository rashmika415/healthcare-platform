const DoctorAvailability = require('../models/doctorAvailabilityModel');
const Doctor = require('../models/doctorModels');

const normalizeTime = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  const hour = match[1].padStart(2, '0');
  const minute = match[2];
  return `${hour}:${minute}`;
};

const normalizeDate = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  // Expect YYYY-MM-DD (HTML date input format)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const toDateKeyUTC = (dateObj) => {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const hasOverlap = (newStart, newEnd, existingStart, existingEnd) =>
  toMinutes(newStart) < toMinutes(existingEnd) && toMinutes(newEnd) > toMinutes(existingStart);

const ensureDoctorAccess = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: no user info' });
    return null;
  }

  if (req.user.role !== 'doctor') {
    res.status(403).json({ error: 'Only doctors allowed' });
    return null;
  }

  const doctorProfile = await Doctor.findOne({ userId: req.user.id });
  if (!doctorProfile) {
    res.status(404).json({ error: 'Doctor profile not found. Create profile first.' });
    return null;
  }

  return doctorProfile;
};

const validateSlotInput = (date, startTime, endTime) => {
  if (!date || !startTime || !endTime) {
    return 'date, startTime and endTime are required';
  }
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return 'date must be in YYYY-MM-DD format';
  }
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);
  if (!normalizedStart || !normalizedEnd) {
    return 'startTime and endTime must be in HH:MM format (24-hour)';
  }
  if (toMinutes(normalizedStart) >= toMinutes(normalizedEnd)) {
    return 'endTime must be after startTime';
  }
  return null;
};

exports.addAvailability = async (req, res) => {
  try {
    const doctorProfile = await ensureDoctorAccess(req, res);
    if (!doctorProfile) return;

    const { date, startTime, endTime } = req.body || {};
    const validationError = validateSlotInput(date, startTime, endTime);
    if (validationError) return res.status(400).json({ error: validationError });

    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);
    const normalizedDate = normalizeDate(date);
    const dateKey = toDateKeyUTC(normalizedDate);

    const dateSlots = await DoctorAvailability.find({
      doctorUserId: req.user.id,
      date: {
        $gte: new Date(`${dateKey}T00:00:00.000Z`),
        $lt: new Date(`${dateKey}T23:59:59.999Z`)
      }
    });

    const overlapSlot = dateSlots.find((slot) =>
      hasOverlap(normalizedStart, normalizedEnd, slot.startTime, slot.endTime)
    );
    if (overlapSlot) {
      return res.status(409).json({
        error: 'This slot overlaps with an existing slot',
        overlapWith: overlapSlot
      });
    }

    const availability = await DoctorAvailability.create({
      doctorUserId: req.user.id,
      date: normalizedDate,
      startTime: normalizedStart,
      endTime: normalizedEnd
    });

    return res.status(201).json({
      message: 'Availability slot added successfully',
      availability
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const doctorProfile = await ensureDoctorAccess(req, res);
    if (!doctorProfile) return;

    const { date } = req.query;
    const filter = { doctorUserId: req.user.id };
    if (date) {
      const normalizedDate = normalizeDate(date);
      if (!normalizedDate) {
        return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
      }
      const dateKey = toDateKeyUTC(normalizedDate);
      filter.date = {
        $gte: new Date(`${dateKey}T00:00:00.000Z`),
        $lt: new Date(`${dateKey}T23:59:59.999Z`)
      };
    }

    const slots = await DoctorAvailability.find(filter).sort({ date: 1, startTime: 1 });
    const activeCount = slots.filter((slot) => slot.isActive).length;

    return res.status(200).json({
      doctor: {
        id: doctorProfile._id,
        userId: doctorProfile.userId,
        name: doctorProfile.name,
        specialization: doctorProfile.specialization,
        isVerified: doctorProfile.isVerified,
        consultationFee: doctorProfile.consultationFee,
      },
      summary: {
        totalSlots: slots.length,
        activeSlots: activeCount,
        inactiveSlots: slots.length - activeCount
      },
      availability: slots
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const doctorProfile = await ensureDoctorAccess(req, res);
    if (!doctorProfile) return;

    const { id } = req.params;
    const slot = await DoctorAvailability.findOne({ _id: id, doctorUserId: req.user.id });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    const nextDate = req.body?.date ?? toDateKeyUTC(new Date(slot.date));
    const nextStart = req.body?.startTime ?? slot.startTime;
    const nextEnd = req.body?.endTime ?? slot.endTime;

    const validationError = validateSlotInput(nextDate, nextStart, nextEnd);
    if (validationError) return res.status(400).json({ error: validationError });

    const normalizedStart = normalizeTime(nextStart);
    const normalizedEnd = normalizeTime(nextEnd);
    const normalizedDate = normalizeDate(nextDate);
    const dateKey = toDateKeyUTC(normalizedDate);

    const dateSlots = await DoctorAvailability.find({
      _id: { $ne: id },
      doctorUserId: req.user.id,
      date: {
        $gte: new Date(`${dateKey}T00:00:00.000Z`),
        $lt: new Date(`${dateKey}T23:59:59.999Z`)
      }
    });
    const overlapSlot = dateSlots.find((item) =>
      hasOverlap(normalizedStart, normalizedEnd, item.startTime, item.endTime)
    );
    if (overlapSlot) {
      return res.status(409).json({
        error: 'Updated slot overlaps with an existing slot',
        overlapWith: overlapSlot
      });
    }

    slot.date = normalizedDate;
    slot.startTime = normalizedStart;
    slot.endTime = normalizedEnd;
    if (req.body?.isActive !== undefined) slot.isActive = Boolean(req.body.isActive);

    await slot.save();

    return res.status(200).json({
      message: 'Availability slot updated successfully',
      availability: slot
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteAvailability = async (req, res) => {
  try {
    const doctorProfile = await ensureDoctorAccess(req, res);
    if (!doctorProfile) return;

    const { id } = req.params;
    const slot = await DoctorAvailability.findOneAndDelete({ _id: id, doctorUserId: req.user.id });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    return res.status(200).json({
      message: 'Availability slot deleted successfully',
      deletedSlotId: id
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Public endpoint: get active availability for a doctor by doctor profile id or user id
exports.getAvailabilityByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const filter = { isActive: true };

    if (date) {
      const normalizedDate = normalizeDate(date);
      if (!normalizedDate) {
        return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
      }
      const dateKey = toDateKeyUTC(normalizedDate);
      filter.date = {
        $gte: new Date(`${dateKey}T00:00:00.000Z`),
        $lt: new Date(`${dateKey}T23:59:59.999Z`)
      };
    }

    // Accept either Doctor profile _id or doctor userId to simplify integrations.
    let doctorProfile = await Doctor.findById(doctorId);
    if (doctorProfile) {
      filter.doctorUserId = doctorProfile.userId;
    } else {
      doctorProfile = await Doctor.findOne({ userId: doctorId });
      if (!doctorProfile) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      filter.doctorUserId = doctorProfile.userId;
    }

    const availability = await DoctorAvailability.find(filter).sort({ date: 1, startTime: 1 });

    return res.status(200).json({
      doctor: {
        id: doctorProfile._id,
        userId: doctorProfile.userId,
        name: doctorProfile.name,
        specialization: doctorProfile.specialization,
        isVerified: doctorProfile.isVerified,
        consultationFee: doctorProfile.consultationFee,
      },
      availability
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDoctorsByDay = async (req, res) => {
  try {
    const date = req.query.date; // e.g., ?date=2026-04-07
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
    }

    const dateKey = toDateKeyUTC(normalizedDate);
    const slots = await DoctorAvailability.find({
      date: {
        $gte: new Date(`${dateKey}T00:00:00.000Z`),
        $lt: new Date(`${dateKey}T23:59:59.999Z`)
      },
      isActive: true
    });

    if (slots.length === 0) {
      return res.json({ message: `No doctors available on ${dateKey}` });
    }

    // Group slots by doctor
    const doctorMap = {};

    for (const slot of slots) {
      const doctorUserId = slot.doctorUserId;

      // Populate doctor name
      let doctorName = 'Unknown Doctor';
      const doctor = await Doctor.findOne({ userId: doctorUserId }).select('name');
      if (doctor) {
        doctorName = doctor.name;
      }

      if (!doctorMap[doctorUserId]) {
        doctorMap[doctorUserId] = {
          doctorId: doctorUserId,
          doctorName,
          slots: []
        };
      }

      doctorMap[doctorUserId].slots.push({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime
      });
    }

    // Convert map to array
    const result = Object.values(doctorMap);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};