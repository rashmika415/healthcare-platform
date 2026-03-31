// appointmentRoutes.js
const express = require('express');
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const appointmentController = require("../Controller/appointmentController");

// ── Routes used by the frontend ─────────────────────────
// Mounted at: /appointments (in app.js)
router.get("/", auth, appointmentController.getDoctorAppointments); // Doctor dashboard
router.get("/patient", auth, appointmentController.getPatientAppointments);
router.get("/doctor/appointments", auth, appointmentController.getDoctorAppointmentsForDoctorScreen);
router.patch("/doctor/appointments/:id", auth, appointmentController.updateDoctorAppointmentStatus);
router.delete("/:id", auth, appointmentController.cancelAppointment);

// ── Legacy CRUD routes (kept for compatibility) ───────
router.get("/getallappointments", appointmentController.getallappointments);
router.post("/createappointment", appointmentController.createappointment);
router.get("/getappointmentbyid/:id", appointmentController.getappointmentbyid);
router.put("/updateappointment/:id", appointmentController.updateappointment);
router.delete("/deleteappointment/:id", appointmentController.deleteappointment);

module.exports = router;


