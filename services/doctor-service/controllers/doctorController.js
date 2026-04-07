const Doctor = require('../models/doctorModels');

// ✅ NEW: import helpers (make sure you create these files)
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

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
      bio,
      // Sync with gateway User.isVerified (e.g. admin verified before/after profile exists)
      isVerified: req.user.isVerified === true,
    };

    const isNew = !(await Doctor.findOne({ userId: req.user.id }));

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      { $set: profileData },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // 🔔 ONLY when new doctor registers
    if (isNew) {
      try {
        await Notification.create({
          message: `New doctor registered: ${doctor.name}`,
          type: "doctor_registered"
        });

        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: "New Doctor Registration",
          text: `Dr. ${doctor.name} has registered and is awaiting admin verification. Please verify his account.`
        });
      } catch (e) {
        console.error("Notification/email error:", e.message);
      }
    }

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
      {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: req.user.id
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // 🔔 Notification
    try {
      await Notification.create({
        message: `Doctor verified: ${doctor.name}`,
        type: "doctor_verified"
      });

      // 📧 Email to doctor
      await sendEmail({
        to: doctor.email,
        subject: "Account Verified ✅",
        text: `Hello Dr. ${doctor.name}, your account has been successfully verified by the admin team.`
      });

    } catch (e) {
      console.error("Verification email/notification error:", e.message);
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
 * ✅ Verify Doctor Profile by UserId (ADMIN ONLY)
 * PATCH /doctor/verify-by-user/:userId
 */
exports.verifyDoctorByUserId = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin allowed' });
    }

    const { userId } = req.params;

    const existingDoctor = await Doctor.findOne({ userId });
    if (!existingDoctor) {
      // Best-effort: still email doctor even if doctor profile hasn't been created yet.
      const doctorEmail = req.headers['x-doctor-email'];
      const doctorName = req.headers['x-doctor-name'] || 'Doctor';

      if (doctorEmail) {
        try {
          await Notification.create({
            message: `Doctor verified: ${doctorName}`,
            type: "doctor_verified"
          });

          await sendEmail({
            to: doctorEmail,
            subject: "Account Verified ✅",
            text: `Hello Dr. ${doctorName}, your account has been successfully verified by the admin team.`
          });
        } catch (e) {
          console.error("Verification email/notification error (fallback):", e.message);
        }

        return res.status(200).json({
          message: 'Doctor verified (email sent, doctor profile not found)',
          doctor: null
        });
      }

      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    // Avoid duplicate emails/notifications if admin clicks verify twice.
    if (existingDoctor.isVerified) {
      return res.status(200).json({
        message: 'Doctor already verified',
        doctor: existingDoctor
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId },
      {
        $set: {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user.id,
          verificationEmailSent: true
        }
      },
      { new: true }
    );

    // 🔔 Notification + 📧 Email (best-effort)
    try {
      await Notification.create({
        message: `Doctor verified: ${doctor.name}`,
        type: "doctor_verified"
      });

      await sendEmail({
        to: doctor.email,
        subject: "Account Verified ✅",
        text: `Hello Dr. ${doctor.name}, your account has been successfully verified by the admin team.`
      });
    } catch (e) {
      console.error("Verification email/notification error:", e.message);
    }

    return res.status(200).json({
      message: 'Doctor verified successfully',
      doctor
    });
  } catch (err) {
    console.error('Error in verifyDoctorByUserId:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * ✅ Get Unverified Doctors (ADMIN)
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

exports.getAllVerifiedDoctorsForPatients = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isVerified: true }).select(
      "_id userId name specialization experience hospital email"
    );

    res.status(200).json(doctors);
  } catch (err) {
    console.error("Error in getAllVerifiedDoctorsForPatients:", err);
    res.status(500).json({ error: err.message });
  }
};