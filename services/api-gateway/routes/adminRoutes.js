const router = require('express').Router();
const User   = require('../models/userModel');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require admin role
router.use(adminMiddleware);

function safeJson(res) {
  return res.json().catch(() => ({}));
}

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
    user.verificationStatus = 'verified';
    user.verificationRejectedReason = null;
    user.verificationDecidedAt = new Date();
    user.verificationDecidedBy = req.headers['x-user-id'] || null;
    await user.save();

    // Notify doctor-service to mark doctor profile verified and email the doctor.
    // Doctor-service updates Doctor.isVerified and sends email.
    let doctorServiceResult = null;
    try {
      const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
      const adminId = req.headers['x-user-id'];
      const adminRole = req.headers['x-user-role'];

      // doctor-service mounts doctorRoutes at `/` (not `/doctor`) in services/doctor-service/app.js
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

      const body = await safeJson(verifyRes);
      doctorServiceResult = { ok: verifyRes.ok, status: verifyRes.status, body };

      if (!verifyRes.ok) {
        // Non-fatal: user is already verified in gateway; email might fail if doctor profile not found.
        console.warn('Doctor-service verify-by-user failed:', verifyRes.status, body?.error || body?.message);
      }
    } catch (e) {
      console.warn('Doctor-service call failed:', e.message);
      doctorServiceResult = { ok: false, status: 0, body: { error: e.message } };
    }

    res.json({ message: 'Doctor verified successfully', user, doctorServiceResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /admin/reject-doctor/:id
// Reject a doctor registration (keeps account but blocks verification)
// Body: { reason }
// ─────────────────────────────────────────
router.put('/reject-doctor/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'doctor') {
      return res.status(400).json({ error: 'User is not a doctor' });
    }

    const reason = (req.body?.reason || '').toString().trim();
    user.isVerified = false;
    user.verificationStatus = 'rejected';
    user.verificationRejectedReason = reason || 'Rejected by admin';
    user.verificationDecidedAt = new Date();
    user.verificationDecidedBy = req.headers['x-user-id'] || null;
    await user.save();

    // Notify doctor-service (best-effort) so doctor profile gets the same status + email.
    let doctorServiceResult = null;
    try {
      const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
      const adminId = req.headers['x-user-id'];
      const adminRole = req.headers['x-user-role'];

      const rejectRes = await fetch(`${doctorServiceUrl}/reject-by-user/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': adminId,
          'x-user-role': adminRole,
          'x-doctor-email': user.email,
          'x-doctor-name': user.name
        },
        body: JSON.stringify({ reason: user.verificationRejectedReason })
      });

      const body = await safeJson(rejectRes);
      doctorServiceResult = { ok: rejectRes.ok, status: rejectRes.status, body };
      if (!rejectRes.ok) {
        console.warn('Doctor-service reject-by-user failed:', rejectRes.status, body?.error || body?.message);
      }
    } catch (e) {
      console.warn('Doctor-service call failed:', e.message);
      doctorServiceResult = { ok: false, status: 0, body: { error: e.message } };
    }

    return res.json({ message: 'Doctor rejected', user, doctorServiceResult });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /admin/deactivate/:id
// Deactivate any user account (admin-only)
// ─────────────────────────────────────────
router.put('/deactivate/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deactivated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /admin/activate/:id
// Reactivate any user account (admin-only)
// ─────────────────────────────────────────
router.put('/activate/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isActive = true;
    await user.save();

    res.json({ message: 'Account activated', user });
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
    const verified = doctors.filter(d => d.verificationStatus === 'verified');
    const pending  = doctors.filter(d => d.verificationStatus === 'pending');
    const rejected = doctors.filter(d => d.verificationStatus === 'rejected');
    const inactive = all.filter(u => !u.isActive);

    res.json({
      totalUsers:        all.length,
      totalPatients:     patients.length,
      totalDoctors:      doctors.length,
      verifiedDoctors:   verified.length,
      pendingDoctors:    pending.length,
      rejectedDoctors:   rejected.length,
      inactiveUsers:     inactive.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /admin/transactions
// Fetch payment records from payment-service
// ─────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  try {
    const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
    const r = await fetch(`${paymentUrl}/payments/all`);
    const body = await safeJson(r);
    if (!r.ok) return res.status(r.status).json(body);
    return res.json({ total: Array.isArray(body) ? body.length : 0, payments: body });
  } catch (err) {
    return res.status(503).json({ error: 'Payment service unavailable', details: err.message });
  }
});

// ─────────────────────────────────────────
// GET /admin/appointments
// Fetch appointment records from appointment-service
// ─────────────────────────────────────────
router.get('/appointments', async (req, res) => {
  try {
    const appointmentUrl = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003';
    const r = await fetch(`${appointmentUrl}/appointments/getallappointments`);
    const body = await safeJson(r);
    if (!r.ok) return res.status(r.status).json(body);
    // appointment-service returns { appointments: [...] }
    const appointments = body?.appointments || [];
    return res.json({ total: appointments.length, appointments });
  } catch (err) {
    return res.status(503).json({ error: 'Appointment service unavailable', details: err.message });
  }
});

module.exports = router;