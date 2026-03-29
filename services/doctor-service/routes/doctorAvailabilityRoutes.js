const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const availabilityController = require('../controllers/doctorAvailabilityController');

// 🔒 PRIVATE ROUTES FIRST
router.get('/availability/me', authMiddleware, availabilityController.getAvailability);
router.post('/availability', authMiddleware, availabilityController.addAvailability);
router.put('/availability/:id', authMiddleware, availabilityController.updateAvailability);
router.patch('/availability/:id', authMiddleware, availabilityController.updateAvailability);
router.delete('/availability/:id', authMiddleware, availabilityController.deleteAvailability);

// 🌍 PUBLIC ROUTES AFTER
router.get('/availability/day', availabilityController.getDoctorsByDay);
router.get('/availability/:doctorId', availabilityController.getAvailabilityByDoctorId);

module.exports = router;