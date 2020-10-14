const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

function formatId(id) {
  return id.substr(0, 5) + '..' + id.substr(-4);
}

function formatLink(path) {
  return process.env.SERVER_URL + path;
}

function getCollaterization(deposit, price) {
  // Given with 18 decimal places
  const btcPerEth = formatPrice(price.val);
  const satPerWei = btcPerEth * 100000000 * 0.000000000000000001;
  const weiPerSat = 1 / satPerWei;

  const bondValueWei = parseInt(deposit.bondedECDSAKeep.totalBondAmount);
  const lotValueSatoshis = parseInt(deposit.lotSizeSatoshis);
  const lotValueWei = lotValueSatoshis * weiPerSat;

  const ratio = bondValueWei / lotValueWei;

  return (ratio * 100).toFixed(2);
}

function formatPrice(price) {
  // Given with 18 decimal places
  return parseInt(price) / 10**18;
}

function getSatoshisAsBitcoin(satoshis) {
  return parseInt(satoshis) / 100000000;
}

function stateToString(state) {
  const o = {
    ACTIVE: 'Active deposits',
    COURTESY_CALL: 'Courtesy call',
    FRAUD_LIQUIDATION_IN_PROGRESS: 'Fraud liquidation in progress',
    LIQUIDATION_IN_PROGRESS: 'Liquidation in progress',
    LIQUIDATED: 'Liquidated',
  };
  return o[state];
}

function formatBonded(operator) {
  return formatter.format(operator.bonded);
}

function formatBondedPercent(operator) {
  const total = parseFloat(operator.unboundAvailable) + parseFloat(operator.bonded);
  const bonded = parseFloat(operator.bonded);
  return formatter.format(bonded / total * 100);
}

function formatBondedFull(operator) {
  const total = parseFloat(operator.unboundAvailable) + parseFloat(operator.bonded);
  return formatter.format(total);
}

function formatAvailableToBond(operator) {
  return formatter.format(operator.unboundAvailable);
}

function formatStaked(operator) {
  return formatter.format(operator.stakedAmount);
}

function formatFaults(operator) {
  const a = operator.attributableFaultCount > 0 ? (operator.attributableFaultCount + ' / ') : '';
  return a + operator.totalFaultCount;
}

module.exports = { 
  formatId, 
  formatLink, 
  getCollaterization, 
  getSatoshisAsBitcoin, 
  stateToString,
  formatBonded,
  formatBondedPercent,
  formatBondedFull,
  formatAvailableToBond,
  formatStaked,
  formatFaults,
};
