// services/apponment-service/Controller/appointmentController.js
const axios = require("axios");
const Appointment = require("../module/appintmentModule");
const axios = require("axios");

// Get all appointments
const getallappointments = async (req, res) => {
    let appointments;
    //get all appointments
    try {
        appointments = await Appointment.find();
        
    }
    catch (error) {
        console.log(error);
    }   
    if (!appointments) {
        return res.status(404).json({ message: "No appointments found" });
    }
    return res.status(200).json({ appointments });

};



//create appointment
const createappointment = async (req, res) => {
  try {
    const {
      patientUserId,
      doctorUserId,
      patientId,
      doctorId,
      patientName,
      doctorName,
      specialty,
      specialization,
      date,
      timeSlot,
      time,
    } = req.body || {};

    const appointment = new Appointment({
      patientUserId: patientUserId || patientId,
      doctorUserId: doctorUserId || doctorId,
      patientName,
      doctorName,
      specialty: specialty || specialization,
      date,
      timeSlot: timeSlot || time,
      status: req.body?.status || "pending",
    });

    await appointment.save();
    return res.status(201).json({ appointment: normalizeAppointmentForClient(appointment.toObject()) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to create appointment" });
  }
};

const getappointmentbyid = async (req, res) => {
  try {
    const id = req.params.id;
    const appointment = await Appointment.findById(id).lean();
    if (!appointment) {
      return res.status(404).json({ message: "No appointment found" });
    }
    return res.status(200).json({ appointment: normalizeAppointmentForClient(appointment) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Unable to fetch appointment" });
  }
};

const updateappointment = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      patientUserId,
      doctorUserId,
      patientId,
      doctorId,
      patientName,
      doctorName,
      specialty,
      specialization,
      date,
      timeSlot,
      time,
      status,
    } = req.body || {};

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      {
        patientUserId: patientUserId || patientId,
        doctorUserId: doctorUserId || doctorId,
        patientName,
        doctorName,
        specialty: specialty || specialization,
        date,
        timeSlot: timeSlot || time,
        status,
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Unable to update appointment" });
    }

    return res.status(200).json({ appointment: normalizeAppointmentForClient(appointment.toObject()) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Unable to update appointment" });
  }
};

const deleteappointment = async (req, res) => {
  try {
    const id = req.params.id;
    const appointment = await Appointment.findByIdAndRemove(id);
    if (!appointment) {
      return res.status(404).json({ message: "Unable to delete appointment" });
    }
    return res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Unable to delete appointment" });
  }
};

exports.getDoctorAppointments = getDoctorAppointments;
exports.getPatientAppointments = getPatientAppointments;
exports.getDoctorAppointmentsForDoctorScreen = getDoctorAppointmentsForDoctorScreen;
exports.updateDoctorAppointmentStatus = updateDoctorAppointmentStatus;
exports.cancelAppointment = cancelAppointment;

// Old CRUD exports
exports.getallappointments = getallappointments;
exports.createappointment = createappointment;
exports.updateappointment = updateappointment;
exports.deleteappointment = deleteappointment;
exports.getappointmentbyid = getappointmentbyid;