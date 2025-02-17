const COMMISSION_PER_LEVEL = Object.freeze({
  FIRST_LEVEL: 4,
  SECOND_LEVEL: 2,
  THIRT_LEVEL: 2,
})

const MEMBERSHIP_AMOUNT = Object.freeze({
  FOR_BUSINESS: 400,
  FOR_UPLINE: 100,
})

const calculateNetCommission = (amount, commissionPercent) => {
  const TOTAL_NET_PERCENT = 100;

  const COMMISSION_PERCENT = commissionPercent;
  return parseFloat(amount) * COMMISSION_PERCENT / TOTAL_NET_PERCENT;
}

const getCommissionsPerSaving = (totalAmount) => {
  const commissions = [];

  for (const [, value] of Object.entries(COMMISSION_PER_LEVEL)) {
    commissions.push(calculateNetCommission(totalAmount, value));
  }

  return commissions;
}

const getMembershipToBusiness = () => MEMBERSHIP_AMOUNT.FOR_BUSINESS;
const getMembershipToUpline = () => MEMBERSHIP_AMOUNT.FOR_UPLINE;
const getMembershipAmount = () => MEMBERSHIP_AMOUNT.FOR_BUSINESS + MEMBERSHIP_AMOUNT.FOR_UPLINE;

module.exports = {
  getCommissionsPerSaving,
  getMembershipToBusiness,
  getMembershipToUpline,
  getMembershipAmount,
};
