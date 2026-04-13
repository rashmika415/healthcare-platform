//services/Payment-service/Models/PaymentModel.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
  },
  patientId: {
    type: String,
    required: true,
  },
  doctorId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "usd",
  },
  status: {
    type: String,
    default: "PENDING", // PENDING, PAID, FAILED
  },
  stripePaymentIntentId: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);