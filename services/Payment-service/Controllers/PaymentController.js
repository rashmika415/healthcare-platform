const Payment = require("../Models/PaymentModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");

// Create Payment Intent
const createPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        error: "Appointment ID is required to create payment.",
      });
    }

    const appointmentRes = await axios.get(
      `${process.env.APPOINTMENT_SERVICE_URL}/appointments/getappointmentbyid/${appointmentId}`
    );

    const appointment = appointmentRes.data.appointment;

    const doctorRes = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/public/doctors/${appointment.doctorId}`
    );

    const doctor = doctorRes.data.doctor;
    const amount = doctor.consultationFee;

    const LKR_TO_USD_RATE = 0.0027;
    const stripeAmount = Math.max(50, Math.round(amount * LKR_TO_USD_RATE * 100));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: "usd",
    });

    const payment = await Payment.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      amount,
      stripePaymentIntentId: paymentIntent.id,
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Payment Error:", error.response?.data || error.message);

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Unknown payment error";

    res.status(error.response?.status || 500).json({ error: message });
  }
};

// Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: "paymentId is required" });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status === "PAID") {
      return res.status(200).json({ message: "Payment already confirmed" });
    }

    payment.status = "PAID";
    await payment.save();

    // update appointment payment status
    await axios.put(
      `${process.env.APPOINTMENT_SERVICE_URL}/appointments/updateappointment/${payment.appointmentId}`,
      {
        paymentStatus: "COMPLETED",
      }
    );

    // create notification -> notification service will also send email
    await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notifications/create`, {
      patientId: payment.patientId,
      appointmentId: payment.appointmentId,
      type: "PAYMENT",
      message: `Payment completed successfully. Amount Rs.${payment.amount}`,
    });

    res.status(200).json({
      message: "Payment successful",
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPayment = createPayment;
exports.confirmPayment = confirmPayment;
exports.getAllPayments = getAllPayments;