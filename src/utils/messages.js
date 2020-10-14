const { filterDeposits, filterKeepDeposits } = require('./filter');
const { getMinCollaterialization, getMovedDeposits } = require('./misc');
const { getMinOperatorCollaterialization } = require('./misc');
const { getLowCollaterializationDepositsOfSub } = require('./misc');
const { getMovedDepositsOfSub } = require('./misc');
const { getLowCollaterializationDeposits } = require('./misc');
const { getSatoshisAsBitcoin, formatFaults, formatStaked } = require('./format');
const { formatLink, formatId, stateToString, formatBonded } = require('./format');
const { formatBondedPercent, formatBondedFull, formatAvailableToBond } = require('./format');

const leadingSpaceReg = /(\n|\r\n)[^\S\r\n]+/gm;

function commonInfo(deposits, price) {
  const f = filterDeposits;
  const activeCount = f(deposits, 'ACTIVE').length;
  const courtesyCount = f(deposits, 'COURTESY_CALL').length;
  const fraudCount = f(deposits, 'FRAUD_LIQUIDATION_IN_PROGRESS').length;
  const liqInProgressCount = f(deposits, 'LIQUIDATION_IN_PROGRESS').length;
  const liqCount = f(deposits, 'LIQUIDATED').length;

  const minCollaterialization = getMinCollaterialization(deposits, price);

  const msg = `
    Active deposits *${activeCount}*
    Courtesy call *${courtesyCount}*
    Fraud liquidation in progress *${fraudCount}*
    Liquidation in progress *${liqInProgressCount}*
    Liquidated *${liqCount}*

    Lowest Collaterialization with Active Status: *${minCollaterialization}%*
  `.replace(leadingSpaceReg, '\n').trim();
  
  return msg;
}

function commonOperatorInfo(operator, price) {
  const bonded = formatBonded(operator);
  const bondedPercent = formatBondedPercent(operator);
  const bondedFull = formatBondedFull(operator);
  const availableToBond = formatAvailableToBond(operator);
  const stacked = formatStaked(operator);
  const faults = formatFaults(operator);

  const f = filterKeepDeposits;
  const activeCount = f(operator.keeps, 'ACTIVE').length;
  const courtesyCount = f(operator.keeps, 'COURTESY_CALL').length;
  const fraudCount = f(operator.keeps, 'FRAUD_LIQUIDATION_IN_PROGRESS').length;
  const liqInProgressCount = f(operator.keeps, 'LIQUIDATION_IN_PROGRESS').length;
  const liqCount = f(operator.keeps, 'LIQUIDATED').length;

  const address = formatId(operator.address);
  const url = formatLink(`/operator/${operator.id}`);

  const minCollaterialization = getMinOperatorCollaterialization(operator, price)

  const msg = `
    Operator: [${address}](${url})
    Bonded: *${bonded} ETH* (${bondedPercent}% of ${bondedFull} ETH)
    Available to bond: *${availableToBond} ETH*
    Staked: *${stacked} KEEP*
    Faults: *${faults}*

    Active deposits *${activeCount}*
    Courtesy call *${courtesyCount}*
    Fraud liquidation in progress *${fraudCount}*
    Liquidation in progress *${liqInProgressCount}*
    Liquidated *${liqCount}*

    Lowest Collaterialization with Active Status: *${minCollaterialization}%*
  `.replace(leadingSpaceReg, '\n').trim();
  
  return msg;
}

function movedDepositsInfo(oldDeposits, newDeposits) {
  const movedDeposits = getMovedDeposits(oldDeposits, newDeposits);
  const msg = movedDeposits.map(d => {
    const address = formatId(d.contractAddress);
    const url = formatLink(`/deposit/${d.id}`);
    const lotSize = getSatoshisAsBitcoin(d.lotSizeSatoshis);
    const prevState = stateToString(d.currentState);
    const currentState = stateToString(d.currentState);
    return `
      Deposit ID [${address}](${url}) 
      Lot Size 
      *${lotSize} BTC* 
      moved from *${prevState}* to *${currentState}*
    `.replace(/\s+/gm, ' ');

  }).join('\n').trim();

  return msg;
}

function movedDepositsInfoOfSub(oldDeposits, newDeposits, subscriber) {
  const movedDeposits = getMovedDepositsOfSub(oldDeposits, newDeposits, subscriber);
  const msg = movedDeposits.map(({ deposit, operator }) => {
    const address = formatId(deposit.contractAddress);
    const url = formatLink(`/deposit/${deposit.id}`);
    const operatorUrl = formatLink(`/operator/${operator}`);
    const lotSize = getSatoshisAsBitcoin(deposit.lotSizeSatoshis);
    const prevState = stateToString(deposit.currentState);
    const currentState = stateToString(deposit.currentState);
    return `
      Deposit ID [${address}](${url})
      Operator [${operator}](${operatorUrl})
      Lot Size 
      *${lotSize} BTC* 
      moved from *${prevState}* to *${currentState}*
    `.replace(/\s+/gm, ' ');

  }).join('\n').trim();

  return msg;
}

function lowCollaterializationDepositsInfo(deposits, price) {
  const lowDeposits = getLowCollaterializationDeposits(deposits, price);
  const min110 = lowDeposits.min110.map(f(110)).join('\n');
  const min125 = lowDeposits.min125.map(f(125)).join('\n');

  return [min110, min125].join('\n').trim();

  function f(percent) {
    return d => {
      const address = formatId(d.contractAddress);
      const url = formatLink(`/deposit/${d.id}`);
      const lotSize = getSatoshisAsBitcoin(d.lotSizeSatoshis);
      return `
        Deposit ID [${address}](${url}) Lot Size *${lotSize} BTC* Collaterialization *<${percent}*
      `.replace(/\s+/gm, ' ');
    }
  }
}

function lowCollaterializationDepositsInfoOfSub(deposits, price, subscriber) {
  const lowDeposits = getLowCollaterializationDepositsOfSub(deposits, price, subscriber);
  const min110 = lowDeposits.min110.map(f(110)).join('\n');
  const min125 = lowDeposits.min125.map(f(125)).join('\n');

  return [min110, min125].join('\n').trim();

  function f(percent) {
    return ({ deposit, operator }) => {
      const address = formatId(deposit.contractAddress);
      const url = formatLink(`/deposit/${deposit.id}`);
      const operatorUrl = formatLink(`/operator/${operator}`);
      const lotSize = getSatoshisAsBitcoin(deposit.lotSizeSatoshis);
      return `
        Deposit ID [${address}](${url})
        Operator [${operator}](${operatorUrl}) 
        Lot Size *${lotSize} BTC* 
        Collaterialization *<${percent}*
      `.replace(/\s+/gm, ' ');
    }
  }
}

module.exports = {
  commonInfo,
  commonOperatorInfo,
  movedDepositsInfo,
  lowCollaterializationDepositsInfo,
  movedDepositsInfoOfSub,
  lowCollaterializationDepositsInfoOfSub,
  leadingSpaceReg
};
