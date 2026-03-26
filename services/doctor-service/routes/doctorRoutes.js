// services/doctor/routes/doctorRoutes.js

const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');

// Import controller
const doctorController = require('../controllers/doctorController');


// 🔹 GET Doctor Profile
router.get('/profile', authMiddleware, doctorController.getProfile);


// 🔹 CREATE or UPDATE Doctor Profile
router.post('/profile', authMiddleware, doctorController.upsertProfile);


// 🔹 DELETE Doctor Profile
router.delete('/profile', authMiddleware, doctorController.deleteProfile);


module.exports = router;