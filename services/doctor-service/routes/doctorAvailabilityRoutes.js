// routes/doctorAvailabilityRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const availabilityController = require('../controllers/doctorAvailabilityController');


// ==========================================
// ✅ PUBLIC ROUTE (NO AUTH)
// ==========================================

// Get availability of a specific doctor (used by patients / appointment service)
router.get(
  '/availability/:doctorId',
  availabilityController.getAvailabilityByDoctorId
);

// Get all available doctors on a specific day
router.get(
  '/availability',
  availabilityController.getDoctorsByDay
);


// ==========================================
// 🔒 APPLY AUTH MIDDLEWARE
// ==========================================

router.use(authMiddleware);


// ==========================================
// 🔒 PROTECTED ROUTES (Doctor Only)
// ==========================================

// Add availability
router.post(
  '/availability',
  availabilityController.addAvailability
);

// Get logged-in doctor's availability
router.get(
  '/availability',
  availabilityController.getAvailability
);

// Update availability (full update)
router.put(
  '/availability/:id',
  availabilityController.updateAvailability
);

// Update availability (partial update)
router.patch(
  '/availability/:id',
  availabilityController.updateAvailability
);

// Delete availability
router.delete(
  '/availability/:id',
  availabilityController.deleteAvailability
);

module.exports = router;