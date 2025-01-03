const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean },
    isActive: { type: Boolean },
    wallet: { type: String },
    membership: { type: Number },
    totalBalance: { type: Number, default: 0 },
    referred_by: { type: String },
    referrals: [{ type: String}],
    uplineCommisions: [{ type: String}],
    email_beneficiary: { type: String },
    name_beneficiary: { type: String },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;