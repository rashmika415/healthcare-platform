const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/videoController');

router.use(auth);

router.post('/sessions', controller.createSession);
router.post('/sessions/:sessionId/join', controller.joinSession);
router.get('/sessions/:sessionId', controller.getSession);
router.get('/appointment/:appointmentId', controller.getOrCreateSessionByAppointment);

module.exports = router;
