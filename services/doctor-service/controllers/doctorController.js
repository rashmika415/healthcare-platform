const Doctor = require('../models/doctorModels');

/**
 * Create or update Doctor profile
 * POST /doctor/profile
 */
exports.upsertProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors allowed' });
    }

    const { specialization, experience, hospital, bio } = req.body || {};

    if (!specialization || experience === undefined || !hospital || !bio) {
      return res.status(400).json({ error: 'All fields are required: specialization, experience, hospital, bio' });
    }

    const profileData = {
      userId: req.user.id,
      name: req.user.name,
      email: req.user.email,
      specialization,
      experience: Number(experience),
      hospital,
      bio
    };

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      { $set: profileData },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: 'Doctor profile saved successfully',
      doctor
    });

  } catch (err) {
    console.error('Error in upsertProfile:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * Get Doctor profile
 * GET /doctor/profile
 */
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id });

    if (!doctor) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json(doctor);

  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * Delete Doctor profile
 * DELETE /doctor/profile
 */
exports.deleteProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors allowed' });
    }

    const deleted = await Doctor.findOneAndDelete({ userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json({ message: 'Doctor profile deleted successfully' });

  } catch (err) {
    console.error('Error in deleteProfile:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * ✅ Verify Doctor (ADMIN ONLY)
 * PATCH /doctor/verify/:doctorId
 */
exports.verifyDoctor = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin allowed' });
    }

    const { doctorId } = req.params;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { isVerified: true },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor verified successfully',
      doctor
    });

  } catch (err) {
    console.error('Error in verifyDoctor:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * ✅ Get Unverified Doctors (ADMIN)
 * GET /doctor/unverified
 */
exports.getUnverifiedDoctors = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin allowed' });
    }

    const doctors = await Doctor.find({ isVerified: false });

    res.status(200).json({ doctors });

  } catch (err) {
    console.error('Error in getUnverifiedDoctors:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * ✅ Get Verified Doctors (ADMIN)
 * GET /doctor/verified
 */
exports.getVerifiedDoctors = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin allowed' });
    }

    const doctors = await Doctor.find({ isVerified: true });

    res.status(200).json({ doctors });

  } catch (err) {
    console.error('Error in getVerifiedDoctors:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✅ Get Doctor By ID (ADMIN)
 * GET /doctor/:doctorId
 */
exports.getDoctorById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin allowed' });
    }

    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.status(200).json({ doctor });
  } catch (err) {
    console.error('Error in getDoctorById:', err);
    return res.status(500).json({ error: err.message });
  }
};