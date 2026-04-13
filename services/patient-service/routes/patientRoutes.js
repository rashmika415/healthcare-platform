const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const c      = require('../controllers/patientController');
const { upload } = require('../config/cloudinaryConfig');

// ── All routes below need auth ────────────────────────
router.use(auth);

// ── Patient profile routes ────────────────────────────
router.post('/profile',  c.createProfile);   // create profile
router.get('/profile',   c.getProfile);      // get my profile
router.put('/profile',   c.updateProfile);   // update my profile

// ── Read-only data routes ─────────────────────────────
router.get('/prescriptions', c.getPrescriptions);  // view prescriptions
router.get('/history',       c.getMedicalHistory); // view history

// ── Internal routes (called by other services) ────────
// These routes are NOT meant to be called by the frontend
router.post('/internal/add-prescription', c.addPrescription);
router.post('/internal/add-history',      c.addHistory);
router.get('/internal/:userId',           c.getPatientByUserId);

// ── Report routes ───────────────────────────────
router.post('/reports', upload.single('report'), c.uploadReport);
router.get('/reports',                           c.getReports);
router.get('/reports/shared/me',                 c.getMySharedReportsAsDoctor);
router.get('/reports/download/:reportId',        c.getReportDownloadUrl);
router.get('/reports/:reportId',                 c.getReportById);
router.patch('/reports/:reportId',               c.updateReportMetadata);
router.patch('/reports/:reportId/archive',       c.archiveReport);
router.post('/reports/:reportId/share',          c.shareReportWithDoctor);
router.post('/reports/:reportId/unshare',        c.unshareReportWithDoctor);
router.delete('/reports/:reportId',              c.deleteReport);

module.exports = router;