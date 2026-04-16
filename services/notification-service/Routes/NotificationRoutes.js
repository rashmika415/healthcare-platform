const express = require("express");
const router = express.Router();

const controller = require("../Controllers/NotificationController");

router.post("/create", controller.createNotification);

router.get("/patient/:patientId", controller.getNotificationsByPatient);

router.put("/read/:id", controller.markRead);

module.exports = router;