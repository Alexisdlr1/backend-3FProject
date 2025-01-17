const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  activeSavingsAccounts: { type: Number },
  activeSavingsBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    get: v => v ? v.toString() : v
  },
  totalNetSavingsBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    get: v => v ? v.toString() : v
  },
  paidSavingsAccounts: { type: Number },
  paidSavingsBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    get: v => v ? v.toString() : v
  },
  nextPaymentDate: [{ type: Date }],
  membershipsReceived: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    get: v => v ? v.toString() : v
  },
  commissionsPaidBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    get: v => v ? v.toString() : v
  },
})

const Business = mongoose.model("Business", businessSchema);

module.exports = Business;
