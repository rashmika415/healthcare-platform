const Doctor = require('../models/doctorModels');
const DoctorAvailability = require('../models/doctorAvailabilityModel');

// ✅ NEW: import helpers (make sure you create these files)
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

/**
 * 🔹 PUBLIC: Search Doctors
 * GET /doctor/search
 * Query params: name, specialization, hospital, date
 */
exports.searchDoctors = async (req, res) => {
  try {
    const { name, specialization, hospital, date } = req.query;
    
    // Build search filter for verified doctors only
    let filter = { isVerified: true };
    
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }
    
    if (hospital) {
      filter.hospital = { $regex: hospital, $options: 'i' };
    }
    
    // Find doctors matching the criteria
    const doctors = await Doctor.find(filter)
      .select('name email specialization experience hospital bio isVerified')
      .lean();
    
    // Get availability for each doctor if date is provided
    let doctorsWithAvailability = doctors;
    
    if (date && doctors.length > 0) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      
      doctorsWithAvailability = await Promise.all(
        doctors.map(async (doctor) => {
          try {
            // Get real availability data from database
            const availability = await DoctorAvailability.find({
              doctorUserId: doctor.userId,
              isActive: true
            }).sort({ day: 1, startTime: 1 });
            
            console.log('Found availability for doctor', doctor.name, ':', availability.length, 'slots');
            
            // Create sessions based on real availability data
            const sessions = [];
            
            if (availability.length > 0) {
              // Group availability by day
              const availabilityByDay = {};
              availability.forEach(slot => {
                if (!availabilityByDay[slot.day]) {
                  availabilityByDay[slot.day] = [];
                }
                availabilityByDay[slot.day].push(slot);
              });
              
              // Generate sessions for the next 30 days
              for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
                const sessionDate = new Date(date);
                sessionDate.setDate(sessionDate.getDate() + dayOffset);
                const dateStr = sessionDate.toISOString().split('T')[0];
                const dayOfWeek = sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
                
                // Check if doctor has availability on this day
                if (availabilityByDay[dayOfWeek]) {
                  availabilityByDay[dayOfWeek].forEach(slot => {
                    // Convert 24-hour time to 12-hour format
                    const [hours, minutes] = slot.startTime.split(':');
                    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
                    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                    const time12 = `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
                    
                    // Always make sessions available for testing
                    const isAvailable = true; // Math.random() > 0.2; // 80% chance of being available
                    
                    if (isAvailable) {
                      sessions.push({
                        date: dateStr,
                        time: time12,
                        patients: Math.floor(Math.random() * 10) + 1, // Random patients count
                        fee: Math.floor(Math.random() * 2000) + 3000, // Fee between 3000-5000
                        available: true
                      });
                    }
                  });
                }
              }
            } else {
              // No availability found, create some default sessions for testing
              console.log('No availability found, creating default sessions');
              for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const sessionDate = new Date(date);
                sessionDate.setDate(sessionDate.getDate() + dayOffset);
                const dateStr = sessionDate.toISOString().split('T')[0];
                
                const timeSlots = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
                timeSlots.forEach(time => {
                  sessions.push({
                    date: dateStr,
                    time: time,
                    patients: Math.floor(Math.random() * 10) + 1,
                    fee: Math.floor(Math.random() * 2000) + 3000,
                    available: true
                  });
                });
              }
            }
            
            console.log('Final sessions array:', sessions.length, 'sessions');
            console.log('First session:', sessions[0]);
            
            return {
              ...doctor,
              hospitals: [{
                name: doctor.hospital,
                location: doctor.hospital.includes('Hospital') ? doctor.hospital : `${doctor.hospital}, Colombo`,
                sessions: sessions
              }],
              gender: doctor.name.startsWith('Dr. ') ? 'Male' : 'Female', // Mock gender
              rating: (4.5 + Math.random() * 0.5).toFixed(1), // Mock rating 4.5-5.0
              experience: `${doctor.experience}+ years`,
              avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}` // Mock avatar
            };
          } catch (error) {
            console.error('Error getting availability for doctor:', doctor.userId, error);
            return {
              ...doctor,
              hospitals: [{
                name: doctor.hospital,
                location: doctor.hospital.includes('Hospital') ? doctor.hospital : `${doctor.hospital}, Colombo`,
                sessions: []
              }],
              gender: doctor.name.startsWith('Dr. ') ? 'Male' : 'Female',
              rating: (4.5 + Math.random() * 0.5).toFixed(1),
              experience: `${doctor.experience}+ years`,
              avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`
            };
          }
        })
      );
    } else {
      // No date provided, just return basic doctor info
      doctorsWithAvailability = doctors.map(doctor => ({
        ...doctor,
        hospitals: [{
          name: doctor.hospital,
          location: doctor.hospital.includes('Hospital') ? doctor.hospital : `${doctor.hospital}, Colombo`,
          sessions: []
        }],
        gender: doctor.name.startsWith('Dr. ') ? 'Male' : 'Female',
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        experience: `${doctor.experience}+ years`,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`
      }));
    }
    
    res.status(200).json({
      doctors: doctorsWithAvailability,
      count: doctorsWithAvailability.length
    });
    
  } catch (err) {
    console.error('Error in searchDoctors:', err);
    res.status(500).json({ error: err.message });
  }
};

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