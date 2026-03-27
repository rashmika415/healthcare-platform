const Appointment = require("../module/appintmentModule");

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