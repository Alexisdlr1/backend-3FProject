const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean },
    isActive: { type: Boolean },
    wallet: { type: String },
    referred_by: { type: String },
    referrals: [{ type: String}],
    uplineCommisions: [{ type: String}],
    email_beneficiary: { type: String },
    name_beneficiary: { type: String }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;