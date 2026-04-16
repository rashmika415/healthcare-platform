const Notification = require("../Models/NotificationModel");

// Create Notification
const createNotification = async (req, res) => {
    try {
        const notification = await Notification.create(req.body);
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