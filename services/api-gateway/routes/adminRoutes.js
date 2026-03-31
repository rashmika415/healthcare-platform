const router = require('express').Router();
const User   = require('../models/userModel');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require admin role
router.use(adminMiddleware);

// ─────────────────────────────────────────
// GET /admin/users
// Get all users (patients + doctors)
// ─────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // never return password
      .sort({ createdAt: -1 });

    res.json({
      total:    users.length,
      patients: users.filter(u => u.role === 'patient').length,
      doctors:  users.filter(u => u.role === 'doctor').length,
      users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /admin/users/:id
// Get a single user by ID
// ─────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /admin/verify-doctor/:id
// Verify a doctor account
// ─────────────────────────────────────────
router.put('/verify-doctor/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'doctor') {
      return res.status(400).json({ error: 'User is not a doctor' });
    }

    user.isVerified = true;
    await user.save();

    // Notify doctor-service to mark doctor profile verified and email the doctor.
    // Doctor-service updates Doctor.isVerified and sends email.
    try {
      const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
      const adminId = req.headers['x-user-id'];
      const adminRole = req.headers['x-user-role'];

      const verifyRes = await fetch(`${doctorServiceUrl}/verify-by-user/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // doctor-service authMiddleware expects these headers
          'x-user-id': adminId,
          'x-user-role': adminRole,
          // Fallback for email/notification if doctor profile isn't created yet
          'x-doctor-email': user.email,
          'x-doctor-name': user.name
        }
      });

      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}));
        // Non-fatal: user is already verified in gateway; email might fail if doctor profile not found.
        console.warn('Doctor-service verify-by-user failed:', verifyRes.status, body?.error || body?.message);
      }
    } catch (e) {
      console.warn('Doctor-service call failed:', e.message);
    }

    res.json({ message: 'Doctor verified successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /admin/deactivate/:id
// Deactivate any user account
// ─────────────────────────────────────────
router.put('/deactivate/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isVerified = false;
    await user.save();

    res.json({ message: 'Account deactivated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /admin/users/:id
// Delete a user account permanently
// ─────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /admin/stats
// Platform overview numbers
// ─────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const all      = await User.find();
    const patients = all.filter(u => u.role === 'patient');
    const doctors  = all.filter(u => u.role === 'doctor');
    const verified = doctors.filter(d => d.isVerified);
    const pending  = doctors.filter(d => !d.isVerified);

    res.json({
      totalUsers:        all.length,
      totalPatients:     patients.length,
      totalDoctors:      doctors.length,
      verifiedDoctors:   verified.length,
      pendingDoctors:    pending.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;