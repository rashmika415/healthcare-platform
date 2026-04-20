// appointmentRoutes.js
const express = require('express');
const router = express.Router();

//insert model
const Appointment = require("../module/appintmentModule");

//import controller
const appointmentController = require("../Controller/appointmentController");

router.get("/getallappointments", appointmentController.getallappointments);
router.get(
    "/patient/:patientId",
    appointmentController.getAppointmentsByPatientId
);
router.get(
    "/doctor/:doctorId",
    appointmentController.getAppointmentsByDoctorId
);
router.post("/createappointment", appointmentController.createappointment);
router.get("/getappointmentbyid/:id", appointmentController.getappointmentbyid);
router.put("/updateappointment/:id", appointmentController.updateappointment);
router.delete("/deleteappointment/:id", appointmentController.deleteappointment);

module.exports = router;


