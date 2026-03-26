// services/doctor/routes/doctorRoutes.js
const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware'); // make sure path is correct

// Protected route: GET /doctor/profile
router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    message: 'Doctor profile accessed',
    user: req.user   // comes from token validation in authMiddleware
  });
});

module.exports = router;