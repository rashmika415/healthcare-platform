//services/Payment-service/app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// routes
const paymentRoutes = require("./routes/PaymentRoutes");
app.use("/payments", paymentRoutes);

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Payment DB Connected"))
  .catch(err => console.log(err));

app.listen(process.env.PORT, () => {
  console.log(`Payment Service running on port ${process.env.PORT}`);
});