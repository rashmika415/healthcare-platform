// services/doctor/routes/doctorRoutes.js

const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

// Import controller
const doctorController = require('../controllers/doctorController');


// 🔹 GET Doctor Profile
router.get('/profile', authMiddleware, doctorController.getProfile);


// 🔹 CREATE or UPDATE Doctor Profile
router.post('/profile', authMiddleware, doctorController.upsertProfile);


// 🔹 DELETE Doctor Profile
router.delete('/profile', authMiddleware, doctorController.deleteProfile);


// ✅ VERIFY DOCTOR (ADMIN)
router.patch('/verify/:doctorId', authMiddleware, doctorController.verifyDoctor);


// ✅ GET UNVERIFIED DOCTORS (ADMIN)
router.get('/unverified', authMiddleware, doctorController.getUnverifiedDoctors);


// ✅ GET VERIFIED DOCTORS (ADMIN)
router.get('/verified', authMiddleware, doctorController.getVerifiedDoctors);


// ✅ GET DOCTOR BY ID (ADMIN)
router.get('/:doctorId', authMiddleware, doctorController.getDoctorById);


module.exports = router;