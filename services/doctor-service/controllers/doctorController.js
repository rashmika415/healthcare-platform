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

    const { specialization, experience, hospital, bio, consultationFee } = req.body || {};

    if (!specialization || experience === undefined || !hospital || !bio || consultationFee === undefined) {
      return res.status(400).json({ error: 'All fields are required: specialization, experience, hospital, bio, consultationFee' });
    }

    const profileData = {
      userId: req.user.id,
      name: req.user.name,
      email: req.user.email,
      specialization,
      experience: Number(experience),
      hospital,
      bio,
      consultationFee: Number(consultationFee),
    };
    // Keep doctor-service verification in sync with authdb (gateway header).
    // Important: never overwrite an already-verified doctor back to false.
    if (req.user.isVerified === true) {
      profileData.isVerified = true;
      profileData.verifiedAt = profileData.verifiedAt || new Date();
    }

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

    let doctor = await Doctor.findOne({ userId: req.user.id });

    if (!doctor) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Self-heal: if authdb says verified but doctor profile isn't, sync it.
    if (req.user.isVerified === true && doctor.isVerified !== true) {
      doctor = await Doctor.findOneAndUpdate(
        { userId: req.user.id },
        { $set: { isVerified: true, verifiedAt: doctor.verifiedAt || new Date() } },
        { new: true }
      );
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
      // If the profile was already marked verified (e.g. synced from authdb),
      // we may still need to send the verification email once.
      if (!existingDoctor.verificationEmailSent) {
        try {
          await Notification.create({
            message: `Doctor verified: ${existingDoctor.name}`,
            type: "doctor_verified"
          });

          await sendEmail({
            to: existingDoctor.email,
            subject: "Account Verified ✅",
            text: `Hello Dr. ${existingDoctor.name}, your account has been successfully verified by the admin team.`
          });

          const updated = await Doctor.findOneAndUpdate(
            { userId },
            {
              $set: {
                verificationEmailSent: true,
                verifiedAt: existingDoctor.verifiedAt || new Date(),
                verifiedBy: existingDoctor.verifiedBy || req.user.id
              }
            },
            { new: true }
          );

          return res.status(200).json({
            message: 'Doctor already verified (verification email sent)',
            doctor: updated
          });
        } catch (e) {
          console.error("Verification email/notification error (already verified):", e.message);
          // fall through to standard response
        }
      }
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
          verificationStatus: 'verified',
          verificationRejectedReason: null,
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
 * ❌ Reject Doctor Profile by UserId (ADMIN ONLY)
 * PATCH /doctor/reject-by-user/:userId
 * Body: { reason }
 */
exports.rejectDoctorByUserId = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user info' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin allowed' });
    }

    const { userId } = req.params;
    const reason = (req.body?.reason || '').toString().trim() || 'Rejected by admin';

    const existingDoctor = await Doctor.findOne({ userId });
    if (!existingDoctor) {
      // Best-effort: email doctor even if profile hasn't been created yet.
      const doctorEmail = req.headers['x-doctor-email'];
      const doctorName = req.headers['x-doctor-name'] || 'Doctor';

      if (doctorEmail) {
        try {
          await Notification.create({
            message: `Doctor rejected: ${doctorName}`,
            type: "doctor_rejected"
          });

          await sendEmail({
            to: doctorEmail,
            subject: "Registration Rejected",
            text: `Hello Dr. ${doctorName}, unfortunately your registration was rejected by the admin team. Reason: ${reason}`
          });
        } catch (e) {
          console.error("Rejection email/notification error (fallback):", e.message);
        }

        return res.status(200).json({
          message: 'Doctor rejected (email sent, doctor profile not found)',
          doctor: null
        });
      }

      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId },
      {
        $set: {
          isVerified: false,
          verificationStatus: 'rejected',
          verificationRejectedReason: reason,
          verifiedAt: null,
          verifiedBy: req.user.id,
          verificationEmailSent: true
        }
      },
      { new: true }
    );

    // 🔔 Notification + 📧 Email (best-effort)
    try {
      await Notification.create({
        message: `Doctor rejected: ${doctor.name}`,
        type: "doctor_rejected"
      });

      await sendEmail({
        to: doctor.email,
        subject: "Registration Rejected",
        text: `Hello Dr. ${doctor.name}, unfortunately your registration was rejected by the admin team. Reason: ${reason}`
      });
    } catch (e) {
      console.error("Rejection email/notification error:", e.message);
    }

    return res.status(200).json({
      message: 'Doctor rejected',
      doctor
    });
  } catch (err) {
    console.error('Error in rejectDoctorByUserId:', err);
    return res.status(500).json({ error: err.message });
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

/**
 * 🌍 Public: Search verified doctors (for appointment booking)
 * GET /public/doctors?name=&specialization=&hospital=
 */
exports.publicSearchDoctors = async (req, res) => {
  try {
    const { name, specialization, hospital } = req.query || {};

    const filter = { isVerified: true };

    if (name && String(name).trim()) {
      filter.name = { $regex: String(name).trim(), $options: 'i' };
    }
    if (specialization && String(specialization).trim()) {
      filter.specialization = String(specialization).trim();
    }
    if (hospital && String(hospital).trim()) {
      filter.hospital = String(hospital).trim();
    }

    const doctors = await Doctor.find(filter)
      .select('name email specialization hospital experience bio consultationFee isVerified userId')
      .sort({ name: 1 });

    return res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error in publicSearchDoctors:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 🌍 Public: Filters for appointment search dropdowns
 * GET /public/filters
 */
exports.publicFilters = async (req, res) => {
  try {
    const [specializations, hospitals, names] = await Promise.all([
      Doctor.distinct('specialization', { isVerified: true }),
      Doctor.distinct('hospital', { isVerified: true }),
      Doctor.distinct('name', { isVerified: true }),
    ]);

    return res.status(200).json({
      specializations: (specializations || []).filter(Boolean).sort(),
      hospitals: (hospitals || []).filter(Boolean).sort(),
      doctorNames: (names || []).filter(Boolean).sort(),
    });
  } catch (err) {
    console.error('Error in publicFilters:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 🌍 Public: Get verified doctor profile
 * GET /public/doctors/:doctorId
 */
exports.publicGetDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId).select(
      'name specialization hospital experience bio consultationFee isVerified userId'
    );

    if (!doctor || !doctor.isVerified) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.status(200).json({ doctor });
  } catch (err) {
    console.error('Error in publicGetDoctorProfile:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 🔒 Internal: Resolve verified doctor by email
 * GET /internal/by-email/:email
 */
exports.internalGetDoctorByEmail = async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const doctor = await Doctor.findOne({ email })
      .select('userId name email specialization hospital isVerified');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found for this email' });
    }

    return res.status(200).json({ doctor });
  } catch (err) {
    console.error('Error in internalGetDoctorByEmail:', err);
    return res.status(500).json({ error: err.message });
  }
};