const Notification = require("../Models/NotificationModel");
const axios = require("axios");
const { sendEmail } = require("../Services/emailService");

// Create Notification
const createNotification = async (req, res) => {
  try {
    const { patientId, appointmentId, type, message } = req.body;

    // Save notification in DB
    const notification = await Notification.create({
      patientId,
      appointmentId,
      type,
      message
    });

    // Send email only for payment success
    if (type === "PAYMENT") {
      try {
        // Fetch appointment details only
        const appointmentRes = await axios.get(
          `${process.env.APPOINTMENT_SERVICE_URL}/appointments/getappointmentbyid/${appointmentId}`
        );

        const appointment = appointmentRes.data.appointment;

        if (appointment?.patientEmail) {
          const subject = "Payment Successful - Appointment Confirmation";

          const html = `
            <h2>Payment Successful</h2>
            <p>Dear ${appointment.patientName || "Patient"},</p>
            <p>Your payment has been completed successfully.</p>

            <h3>Appointment Details</h3>
            <ul>
              <li><strong>Appointment ID:</strong> ${appointment._id}</li>
              <li><strong>Doctor Name:</strong> Dr. ${appointment.doctorName}</li>
              <li><strong>Specialization:</strong> ${appointment.specialization}</li>
              <li><strong>Date:</strong> ${appointment.date}</li>
              <li><strong>Time:</strong> ${appointment.time}</li>
              <li><strong>Status:</strong> ${appointment.status}</li>
              <li><strong>Payment Status:</strong> ${appointment.paymentStatus || "COMPLETED"}</li>
            </ul>

            <p>${message}</p>
            <p>Thank you for using our healthcare platform.</p>
          `;

          await sendEmail({
            to: appointment.patientEmail,
            subject,
            html
          });

          console.log("Email sent successfully to:", appointment.patientEmail);
        } else {
          console.log("No patientEmail found in appointment");
        }
      } catch (emailError) {
        console.error("Email/Fetch error status:", emailError.response?.status);
        console.error("Email/Fetch error data:", emailError.response?.data);
        console.error("Email/Fetch error message:", emailError.message);
      }
    }

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Patient Notifications
const getNotificationsByPatient = async (req, res) => {
  try {
    const data = await Notification.find({
      patientId: req.params.patientId
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark Read
const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      read: true
    });

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNotification = createNotification;
exports.getNotificationsByPatient = getNotificationsByPatient;
exports.markRead = markRead;