const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    patientId: String,
    appointmentId: String,
    type: String,
    message: String,
    dedupeKey: {
        type: String,
        index: true,
        sparse: true,
        unique: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);