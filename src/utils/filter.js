function filterDepositsAll(deposits) {
  return deposits.filter(d => (
    d.currentState === 'ACTIVE' ||
    d.currentState === 'COURTESY_CALL' ||
    d.currentState === 'FRAUD_LIQUIDATION_IN_PROGRESS' ||
    d.currentState === 'LIQUIDATION_IN_PROGRESS' ||
    d.currentState === 'LIQUIDATED'
  ))
}

function filterDeposits(deposits, state) {
  return deposits.filter(d => d.currentState === state);
}

function filterKeepDeposits(keeps, state) {
  return keeps.filter(k => k.deposit.currentState === state);
}

module.exports = { filterDepositsAll, filterDeposits, filterKeepDeposits };