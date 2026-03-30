const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/authMiddleware');
const ctrl       = require('../controllers/prescriptionController');

// All routes protected
router.use(auth);

router.post('/',          ctrl.createPrescription);
router.get('/',           ctrl.getDoctorPrescriptions);
router.get('/:id',        ctrl.getPrescriptionById);
router.patch('/:id/status', ctrl.updatePrescriptionStatus);
router.delete('/:id',     ctrl.deletePrescription);

module.exports = router;