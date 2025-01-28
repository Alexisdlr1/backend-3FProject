const mongoose = require("mongoose");

const WithdrawalWallet = new mongoose.Schema({
    wallet: { type: String, required: true },
    isUsable: { type: Boolean, default: false },
    releaseDate: { type: Date },
}, { timestamps: true })

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean },
    isActive: { type: Boolean },
    wallet: { type: String },
    membership: { type: Number, default: 0 },
    totalBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
        get: v => v ? v.toString() : v,
    },
    referred_by: { type: String },
    referrals: { type: [String], default: [] },
    uplineCommisions: { type: [String], default: [] },
    email_beneficiary: { type: String },
    name_beneficiary: { type: String },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    withdrawalWallets: { type: [WithdrawalWallet], default: [] },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;