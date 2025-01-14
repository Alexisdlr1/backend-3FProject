const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  activeSavingsAccounts:{ type: Number },
  activeSavingsBalance:{ type: Number },
  paidSavingsAccounts:{ type: Number} ,
  paidSavingsBalance:{ type: Number },
  nextPaymentDate:[{ type: Date }],
  membershipsReceived:{ type: Number },
  commissionsPaidBalance:{ type: Number }
})

const Business = mongoose.model("Business", businessSchema);

module.exports = Business;
