//services/apponment-service/Controller/appointmentController.js
const Appointment = require("../module/appintmentModule");
const axios = require("axios");

const DOCTOR_SERVICE_URL =
    process.env.DOCTOR_SERVICE_URL || "http://localhost:3002";

/** Public list for booking UI — server-side call avoids browser CORS to doctor service */
const getVerifiedDoctorsForBooking = async (req, res) => {
    try {
        const { data } = await axios.get(
            `${DOCTOR_SERVICE_URL}/doctors-list`,
            { timeout: 15000 }
        );
        const list = Array.isArray(data) ? data : [];
        return res.status(200).json(list);
    } catch (error) {
        console.error("getVerifiedDoctorsForBooking:", error.message);
        const status = error.response?.status || 503;
        const msg =
            error.response?.data?.error ||
            error.message ||
            "Doctor service unavailable";
        return res.status(status >= 400 && status < 600 ? status : 503).json({
            error: msg,
        });
    }
};

// Get all appointments
const getallappointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({ appointments });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching appointments" });
    }
};

/** Appointments for one patient (stored fields only — no cross-service calls) */
const getAppointmentsByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        if (!patientId) {
            return res.status(400).json({ message: "patientId is required" });
        }
        const raw = decodeURIComponent(String(patientId)).trim();
        const or = [{ patientId: raw }];
        if (raw.length === 24 && /^[a-fA-F0-9]+$/.test(raw)) {
            or.push({ patientId: raw.toLowerCase() });
        }
        const appointments = await Appointment.find({ $or: or })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ appointments });
    } catch (error) {
        console.error("getAppointmentsByPatientId:", error);
        return res.status(500).json({ message: "Error fetching patient appointments" });
    }
};

/** Appointments for one doctor (stored fields only — no cross-service calls) */
const getAppointmentsByDoctorId = async (req, res) => {
    try {
        const { doctorId } = req.params;
        if (!doctorId) {
            return res.status(400).json({ message: "doctorId is required" });
        }
        const raw = decodeURIComponent(String(doctorId)).trim();
        const or = [{ doctorId: raw }];
        if (raw.length === 24 && /^[a-fA-F0-9]+$/.test(raw)) {
            or.push({ doctorId: raw.toLowerCase() });
        }
        const appointments = await Appointment.find({ $or: or })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ appointments });
    } catch (error) {
        console.error("getAppointmentsByDoctorId:", error);
        return res.status(500).json({ message: "Error fetching doctor appointments" });
    }
};

//create appointment
const createappointment = async (req, res) => {

const {
patientId,
doctorId,
patientName,
patientEmail,
doctorName,
specialization,
date,
time,
notes
} = req.body;

try {

const appointment = await Appointment.create({
patientId,
doctorId,
patientName,
patientEmail,
doctorName,
specialization,
date,
time,
notes
});

await axios.post("http://localhost:3005/notifications/create", {
patientId,
appointmentId: appointment._id,
type: "APPOINTMENT",
message: `Appointment booked with Dr.${doctorName} on ${date} at ${time}`
});

res.status(201).json({ appointment });

} catch (error) {
res.status(500).json({ error: error.message });
}
};

//Get appointment by id
const getappointmentbyid = async (req, res) => {
    const id = req.params.id;
    let appointment;
    try {
        appointment = await Appointment.findById(id);
    }
    catch (error) {
        console.log(error);
    }   
    if (!appointment) {
        return res.status(404).json({ message: "No appointment found" });
    }
    return res.status(200).json({ appointment });
};


//update appointment
const updateappointment = async (req, res) => {
  const id = req.params.id;

  try {
    const updateData = {};

    const allowedFields = [
      "patientId",
      "doctorId",
      "patientName",
      "patientEmail",
      "doctorName",
      "specialization",
      "date",
      "time",
      "status",
      "paymentStatus",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Unable to update appointment" });
    }

    return res.status(200).json({ appointment });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

//delete appointment
const deleteappointment = async (req, res) => {
    const id = req.params.id;
    let appointment;
    try {
        appointment = await Appointment.findByIdAndRemove(id);
    }
    catch (error) {
        console.log(error);
    }
    if (!appointment) {
        return res.status(404).json({ message: "Unable to delete appointment" });
    }
    return res.status(200).json({ message: "Appointment deleted successfully" });
};


exports.getallappointments = getallappointments;
exports.createappointment = createappointment;
exports.updateappointment = updateappointment;
exports.deleteappointment = deleteappointment;
exports.getappointmentbyid = getappointmentbyid;
exports.getVerifiedDoctorsForBooking = getVerifiedDoctorsForBooking;
exports.getAppointmentsByPatientId = getAppointmentsByPatientId;
exports.getAppointmentsByDoctorId = getAppointmentsByDoctorId;