const DoctorAvailability = require('../models/doctorAvailabilityModel');
const Doctor = require('../models/doctorModels');

const ALLOWED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeTime = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  const hour = match[1].padStart(2, '0');
  const minute = match[2];
  return `${hour}:${minute}`;
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

const validateSlotInput = (day, startTime, endTime) => {
  if (!day || !startTime || !endTime) {
    return 'day, startTime and endTime are required';
  }
  if (!ALLOWED_DAYS.includes(day)) {
    return `day must be one of: ${ALLOWED_DAYS.join(', ')}`;
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

    const { day, startTime, endTime } = req.body || {};
    const validationError = validateSlotInput(day, startTime, endTime);
    if (validationError) return res.status(400).json({ error: validationError });

    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);

    const daySlots = await DoctorAvailability.find({
      doctorUserId: req.user.id,
      day
    });

    const overlapSlot = daySlots.find((slot) =>
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
      day,
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

    const { day } = req.query;
    const filter = { doctorUserId: req.user.id };
    if (day) {
      if (!ALLOWED_DAYS.includes(day)) {
        return res.status(400).json({ error: `day must be one of: ${ALLOWED_DAYS.join(', ')}` });
      }
      filter.day = day;
    }

    const slots = await DoctorAvailability.find(filter).sort({ day: 1, startTime: 1 });
    const activeCount = slots.filter((slot) => slot.isActive).length;

    return res.status(200).json({
      doctor: {
        id: doctorProfile._id,
        userId: doctorProfile.userId,
        name: doctorProfile.name,
        specialization: doctorProfile.specialization,
        isVerified: doctorProfile.isVerified
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

    const nextDay = req.body?.day ?? slot.day;
    const nextStart = req.body?.startTime ?? slot.startTime;
    const nextEnd = req.body?.endTime ?? slot.endTime;

    const validationError = validateSlotInput(nextDay, nextStart, nextEnd);
    if (validationError) return res.status(400).json({ error: validationError });

    const normalizedStart = normalizeTime(nextStart);
    const normalizedEnd = normalizeTime(nextEnd);

    const daySlots = await DoctorAvailability.find({
      _id: { $ne: id },
      doctorUserId: req.user.id,
      day: nextDay
    });
    const overlapSlot = daySlots.find((item) =>
      hasOverlap(normalizedStart, normalizedEnd, item.startTime, item.endTime)
    );
    if (overlapSlot) {
      return res.status(409).json({
        error: 'Updated slot overlaps with an existing slot',
        overlapWith: overlapSlot
      });
    }

    slot.day = nextDay;
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
    const { day } = req.query;

    const filter = { isActive: true };

    if (day) {
      if (!ALLOWED_DAYS.includes(day)) {
        return res.status(400).json({ error: `day must be one of: ${ALLOWED_DAYS.join(', ')}` });
      }
      filter.day = day;
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

    const availability = await DoctorAvailability.find(filter).sort({ day: 1, startTime: 1 });

    return res.status(200).json({
      doctor: {
        id: doctorProfile._id,
        userId: doctorProfile.userId,
        name: doctorProfile.name,
        specialization: doctorProfile.specialization,
        isVerified: doctorProfile.isVerified
      },
      availability
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDoctorsByDay = async (req, res) => {
  try {
    const day = req.query.day; // e.g., ?day=Monday
    if (!day) {
      return res.status(400).json({ error: 'Day query parameter is required' });
    }

    // Find all active availability slots for this day
    const slots = await DoctorAvailability.find({ day, isActive: true });

    if (slots.length === 0) {
      return res.json({ message: `No doctors available on ${day}` });
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