//services/Payment-service/Controllers/PaymentController.js
const Payment = require("../Models/PaymentModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");

// 🔹 Create Payment Intent
const createPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ error: "Appointment ID is required to create payment." });
    }

    // 1️⃣ Get appointment details
    const appointmentRes = await axios.get(
      `${process.env.APPOINTMENT_SERVICE_URL}/appointments/getappointmentbyid/${appointmentId}`
    );


    const appointment = appointmentRes.data.appointment;

    // 2️⃣ Get doctor details (for consultation fee)
    const doctorRes = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/public/doctors/${appointment.doctorId}`
    );

    const doctor = doctorRes.data.doctor;
    const amount = doctor.consultationFee;

    // Convert LKR consultation fee to USD cents for Stripe test payments
    const LKR_TO_USD_RATE = 0.0027;
    const stripeAmount = Math.max(50, Math.round(amount * LKR_TO_USD_RATE * 100));

    // 3️⃣ Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: "usd",
    });

    // 4️⃣ Save payment in DB
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

// 🔹 Confirm Payment (after success)
const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = "PAID";
    await payment.save();

    // Update appointment payment status to completed
    await axios.put(
      `${process.env.APPOINTMENT_SERVICE_URL}/appointments/updateappointment/${payment.appointmentId}`,
      {
        paymentStatus: "COMPLETED"
      }
    );

    res.status(200).json({ message: "Payment successful" });

  } catch (error) {
    console.error("Confirm Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Get all payments
const getAllPayments = async (req, res) => {
  const payments = await Payment.find();
  res.json(payments);
};

exports.createPayment = createPayment;
exports.confirmPayment = confirmPayment;
exports.getAllPayments = getAllPayments;