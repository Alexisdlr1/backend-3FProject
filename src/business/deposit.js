const Business = require("../models/businessModel");

const BUSINESS_ID = process.env.BUSINESS_ID;

/**
 * Core functions for business model
 * Warning!: Functions do not actually have conditionals to check amounts
 * @param {*} amount si the deposit amount for business account in DB
 * @param {*} membershipAmount si the membership amount for business account in DB
 * @this function returns true if the process is successful or returns false if any error is detected
 */
const depositMembershipToBusiness = async (membershipAmount) => {
  const membership = parseFloat(membershipAmount);

  if (membership > 0) {
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

  if (deposit > 0) {
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
    business.activeSavingsBalance += amount;

    // Save business data
    await business.save();

    return true;
  } catch (e) {
    console.error("Un error en el registro de transaccion: ", e);
    return false;
  }

};

module.exports = { depositMembershipToBusiness, depositSavingToBusiness };