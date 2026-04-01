//services/apponment-service/Controller/appointmentController.js
const Appointment = require("../module/appintmentModule");
const axios = require("axios");

// Get all appointments
const getallappointments = async (req, res) => {
    try {
        const appointments = await Appointment.find();

        //  LOOP + FETCH DATA
        const enrichedAppointments = await Promise.all(
            appointments.map(async (appt) => {

                // CALL Patient Service
                const patientRes = await axios.get(
                    `http://localhost:3001/patients/${appt.patientId}`
                );

                // CALL Doctor Service
                const doctorRes = await axios.get(
                    `http://localhost:3n002/doctors/${appt.doctorId}`
                );

                return {
                    ...appt.toObject(),
                    patient: patientRes.data,
                    doctor: doctorRes.data
                };
            })
        );

        return res.status(200).json({ appointments: enrichedAppointments });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching appointments" });
    }
};



//create appointment
const createappointment = async (req, res) => {
    const { patientId, doctorId, patientName, doctorName, specialization, date, time } = req.body;
    let appointment;
    try {
        appointment = new Appointment({
            patientId,
            doctorId,
            patientName,
            doctorName,
            specialization,
            date,
            time    
        });
        await appointment.save();
    }
    catch (error) {
        console.log(error);
    }   
    if (!appointment) {
        return res.status(500).json({ message: "Unable to create appointment" });
    }   
    return res.status(201).json({ appointment });
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
    const { patientId, doctorId, patientName, doctorName, specialization, date, time } = req.body;
    let appointment;
    try {
        appointment = await Appointment.findByIdAndUpdate(id, { 
            patientId,
            doctorId,
            patientName,
            doctorName,
            specialization,
            date,
            time
        });
    }   
    catch (error) {
        console.log(error);
    }   
    if (!appointment) {
        return res.status(404).json({ message: "Unable to update appointment" });
    }
    return res.status(200).json({ appointment });
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