const mongoose = require("mongoose");

const whiteListSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    isApproved: { type: Boolean }
}, { timestamps: true });

const WhiteList = mongoose.model("WhiteList", whiteListSchema);

module.exports = WhiteList;