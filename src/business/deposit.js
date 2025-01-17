const { default: mongoose } = require("mongoose");
const Business = require("../models/businessModel");

const BUSINESS_ID = process.env.BUSINESS_ID;

const BUSINESS_NET_DISTRIBUTION = Object.freeze({
  MEMBERSHIP_COMMISSION_TO_BUSSINESS: 400,
  MEMBERSHIP_COMMISSION_TO_UPLINE: 100,
  FIRST_LEVEL: 4,
  SECOND_LEVEL: 2,
  THIRT_LEVEL: 2,
})

/**
 * Core functions for business model
 * Warning!: Functions do not actually have conditionals to check amounts
 * @param {*} amount si the deposit amount for business account in DB
 * @param {*} membershipAmount si the membership amount for business account in DB
 * @this function returns true if the process is successful or returns false if any error is detected
 */
const calculateNetDeposit = (amount) => {
  const TOTAL_NET_PERCENT = 100;

  const NET_COMMISSIONS_PERCENT = BUSINESS_NET_DISTRIBUTION.FIRST_LEVEL + BUSINESS_NET_DISTRIBUTION.SECOND_LEVEL + BUSINESS_NET_DISTRIBUTION.THIRT_LEVEL;
  const NET_DEPOSIT_PERCENT = TOTAL_NET_PERCENT - NET_COMMISSIONS_PERCENT;
  return parseFloat(amount) * NET_DEPOSIT_PERCENT / TOTAL_NET_PERCENT;
}

const depositMembershipToBusiness = async (membershipAmount) => {
  const membership = parseFloat(membershipAmount);

  if (membership <= 0) {
    return false;
  }

  if (!mongoose.isValidObjectId(BUSINESS_ID)) {
    return false;
  }

  try {

    const business = await Business.findById(BUSINESS_ID);

    if (!business) {
      throw new Error("No se encuentra cuenta de negocio");
    }

    // Update memberships balance
    business.membershipsReceived += membership;

    // Save business data
    await business.save();

    return true;
  } catch (e) {
    console.error("Un error en el registro de membresia: ", e);
    return false;
  }

};

const depositSavingToBusiness = async (amount) => {
  const deposit = parseFloat(amount);
  const netDeposit = calculateNetDeposit(amount);

  if (deposit <= 0) {
    return false;
  }

  if (!mongoose.isValidObjectId(BUSINESS_ID)) {
    return false;
  }

  try {

    const business = await Business.findById(BUSINESS_ID);

    if (!business) {
      throw new Error("No se encuentra cuenta de negocio");
    }

    // Update savings counter
    business.activeSavingsAccounts++;

    // Update savings balance for business
    business.activeSavingsBalance += deposit;

    // Update net savings balance for business
    business.totalNetSavingsBalance += netDeposit;

    // Save business data
    await business.save();

    return true;
  } catch (e) {
    console.error("Un error en el registro de transaccion: ", e);
    return false;
  }

};

module.exports = { depositMembershipToBusiness, depositSavingToBusiness };