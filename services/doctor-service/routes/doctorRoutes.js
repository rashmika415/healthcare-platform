// services/doctor/routes/doctorRoutes.js

const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

// Import controller
const doctorController = require('../controllers/doctorController');

// ── Public doctor browse/search (no auth) ─────────────
router.get('/public/filters', doctorController.publicFilters);
router.get('/public/doctors', doctorController.publicSearchDoctors);
router.get('/public/doctors/:doctorId', doctorController.publicGetDoctorProfile);
router.get('/internal/by-email/:email', authMiddleware, doctorController.internalGetDoctorByEmail);


// 🔹 GET Doctor Profile
router.get('/profile', authMiddleware, doctorController.getProfile);


// 🔹 CREATE or UPDATE Doctor Profile
router.post('/profile', authMiddleware, doctorController.upsertProfile);


// 🔹 DELETE Doctor Profile
router.delete('/profile', authMiddleware, doctorController.deleteProfile);


// ✅ VERIFY DOCTOR (ADMIN)
router.patch('/verify/:doctorId', authMiddleware, doctorController.verifyDoctor);

// ✅ VERIFY DOCTOR PROFILE BY USER ID (ADMIN)
// API gateway verifies users by User._id, but doctor profile uses Doctor.userId.
router.patch('/verify-by-user/:userId', authMiddleware, doctorController.verifyDoctorByUserId);


// ✅ GET UNVERIFIED DOCTORS (ADMIN)
router.get('/unverified', authMiddleware, doctorController.getUnverifiedDoctors);


// ✅ GET VERIFIED DOCTORS (ADMIN)
router.get('/verified', authMiddleware, doctorController.getVerifiedDoctors);

// ✅ GET DOCTOR BY ID (ADMIN)
router.get('/:doctorId', authMiddleware, doctorController.getDoctorById);

module.exports = router;