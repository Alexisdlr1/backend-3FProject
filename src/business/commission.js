const COMMISSION_PER_LEVEL = Object.freeze({
  FIRST_LEVEL: 4,
  SECOND_LEVEL: 2,
  THIRT_LEVEL: 2,
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

module.exports = { getCommissionsPerSaving };
