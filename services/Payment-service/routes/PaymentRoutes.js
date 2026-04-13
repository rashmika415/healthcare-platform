//services/Payment-service/routes/PaymentRoutes.js
const express = require("express");
const router = express.Router();

const paymentController = require("../Controllers/PaymentController");

router.post("/create", paymentController.createPayment);
router.post("/confirm", paymentController.confirmPayment);
router.get("/all", paymentController.getAllPayments);

module.exports = router;