// services/apponment-service/Controller/appointmentController.js
const axios = require("axios");
const Appointment = require("../module/appintmentModule");

const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL || "http://localhost:3006";

function normalizeStatus(status) {
  // Backward compatibility for old documents that used "BOOKED"
  if (!status) return "pending";
  if (String(status).toUpperCase() === "BOOKED") return "pending";
  return status;
}

function normalizeAppointmentForClient(appt) {
  if (!appt) return appt;

  const patientUserId = appt.patientUserId || appt.patientId;
  const doctorUserId = appt.doctorUserId || appt.doctorId;
  const specialty = appt.specialty || appt.specialization;
  const timeSlot = appt.timeSlot || appt.time;

  return {
    ...appt,
    status: normalizeStatus(appt.status),
    patientUserId,
    doctorUserId,
    specialty,
    timeSlot,
    // Keep stable field names that the frontend uses
    videoRoomLink: appt.videoRoomLink || appt.meetingUrl || null,
  };
}

// ─────────────────────────────────────────────────────────
// New endpoints used by the frontend
// ─────────────────────────────────────────────────────────

// GET /appointments
// Doctor dashboard loads this.
const getDoctorAppointments = async (req, res) => {
  try {
    if (req.user?.role && req.user.role !== "doctor") {
      return res.status(403).json({ error: "Only doctors can view doctor appointments" });
    }

    // Frontend is doctor-only; but keep it role-safe.
    const doctorId = req.user?.id;
    const appointments = await Appointment.find({
      $or: [{ doctorUserId: doctorId }, { doctorId: doctorId }],
    }).lean();

    return res.status(200).json(appointments.map(normalizeAppointmentForClient));
  } catch (err) {
    console.error("getDoctorAppointments error:", err);
    return res.status(500).json({ error: "Failed to load appointments" });
  }
};

// GET /appointments/patient
const getPatientAppointments = async (req, res) => {
  try {
    if (req.user?.role && req.user.role !== "patient") {
      return res.status(403).json({ error: "Only patients can view patient appointments" });
    }

    const patientId = req.user?.id;
    const appointments = await Appointment.find({
      $or: [{ patientUserId: patientId }, { patientId: patientId }],
    }).lean();

    return res.status(200).json(appointments.map(normalizeAppointmentForClient));
  } catch (err) {
    console.error("getPatientAppointments error:", err);
    return res.status(500).json({ error: "Failed to load appointments" });
  }
};

// GET /appointments/doctor/appointments
const getDoctorAppointmentsForDoctorScreen = async (req, res) => {
  // Same data source as doctor dashboard, but kept as a separate handler for clarity.
  return getDoctorAppointments(req, res);
};

// PATCH /appointments/doctor/appointments/:id
// body: { status: "accepted" | "rejected" }
const updateDoctorAppointmentStatus = async (req, res) => {
  try {
    if (req.user?.role && req.user.role !== "doctor") {
      return res.status(403).json({ error: "Only doctors can update appointment status" });
    }

    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const doctorUserId = appointment.doctorUserId || appointment.doctorId;
    if (String(doctorUserId) !== String(req.user.id)) {
      return res.status(403).json({ error: "Not allowed to update this appointment" });
    }

    appointment.status = status;

    // When doctor accepts, create a video session and store the join URL
    if (status === "accepted") {
      const patientUserId = appointment.patientUserId || appointment.patientId;
      if (!patientUserId) {
        return res.status(400).json({ error: "Missing patientUserId for video session creation" });
      }

      const doctorIdToUse = appointment.doctorUserId || appointment.doctorId;

      const response = await axios.post(
        `${VIDEO_SERVICE_URL}/video/sessions`,
        {
          appointmentId: String(appointment._id),
          patientUserId,
          doctorUserId: doctorIdToUse,
          patientName: appointment.patientName,
          doctorName: appointment.doctorName,
        },
        {
          headers: {
            // video-service's auth reads these headers (gateway passes them normally).
            "x-user-id": doctorIdToUse,
            "x-user-role": "doctor",
            "x-user-name": appointment.doctorName || "Doctor",
          },
          timeout: 15000,
        }
      );

      const meetingUrl = response?.data?.meeting?.url;
      const sessionId = response?.data?.session?.sessionId;
      const participantToken = response?.data?.join?.participantToken;

      if (meetingUrl) {
        appointment.videoRoomLink = meetingUrl;
        appointment.videoSessionId = sessionId;
        appointment.videoParticipantToken = participantToken;
      }
    } else {
      // Clear video info when rejecting/cancelling
      appointment.videoRoomLink = null;
      appointment.videoSessionId = null;
      appointment.videoParticipantToken = null;
    }

    const updated = await appointment.save();
    return res.status(200).json({ appointment: normalizeAppointmentForClient(updated.toObject()) });
  } catch (err) {
    console.error("updateDoctorAppointmentStatus error:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Failed to update appointment status" });
  }
};

// DELETE /appointments/:id  (patient cancels)
const cancelAppointment = async (req, res) => {
  try {
    if (req.user?.role && req.user.role !== "patient") {
      return res.status(403).json({ error: "Only patients can cancel appointments" });
    }

    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const patientUserId = appointment.patientUserId || appointment.patientId;
    if (String(patientUserId) !== String(req.user.id)) {
      return res.status(403).json({ error: "Not allowed to cancel this appointment" });
    }

    await Appointment.findByIdAndDelete(id);
    return res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("cancelAppointment error:", err);
    return res.status(500).json({ error: "Failed to cancel appointment" });
  }
};

// ─────────────────────────────────────────────────────────
// Old CRUD endpoints (kept for compatibility)
// ─────────────────────────────────────────────────────────

const getallappointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().lean();
    return res.status(200).json({ appointments: appointments.map(normalizeAppointmentForClient) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load appointments" });
  }
};

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