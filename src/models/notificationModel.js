const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    amount: { type: Number },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;