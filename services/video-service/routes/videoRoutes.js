const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/videoController');

router.use(auth);

router.post('/sessions', controller.createSession);
router.post('/sessions/:sessionId/join', controller.joinSession);
router.get('/sessions/:sessionId', controller.getSession);
router.get('/appointment/:appointmentId', controller.getOrCreateSessionByAppointment);
router.delete('/appointment/:appointmentId', controller.deleteSessionByAppointment);

// Admin routes
router.get('/admin/sessions', controller.adminGetAllSessions);
router.delete('/admin/sessions/:sessionId', controller.adminDeleteSession);

module.exports = router;
