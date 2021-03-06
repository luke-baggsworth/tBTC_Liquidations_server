const { filterDeposits, filterKeepDeposits } = require('./filter');
const { getCollaterization } = require('./format');

function getMinCollaterialization(deposits, price) {
  const active = filterDeposits(deposits, 'ACTIVE');
  const colls = active.map(d => getCollaterization(d, price));
  const min = colls.sort((a, b) => a - b)[0];
  return min;
}

function getMinOperatorCollaterialization(operator, price) {
  const active = filterKeepDeposits(operator.keeps, 'ACTIVE');
  const colls = active.map(k => getCollaterization(k.deposit, price));
  const min = colls.sort((a, b) => a - b)[0];
  return min;
}

function getMovedDeposits(oldDeposits, newDeposits) {
  const movedDeposits = [];
  for (const d of newDeposits) {
    const oldDeposit = oldDeposits.find(item => item.id === d.id);
      // status changed
    if (
      oldDeposit && 
      d.currentState !== oldDeposit.currentState
    ) {
      movedDeposits.push(d);
    }
  }
  return movedDeposits;
}

function getMovedDepositsOfSub(oldDeposits, newDeposits, subscriber) {
  const movedDeposits = [];
  for (const d of newDeposits) {
    for (const o of subscriber.operators) {
      const oldDeposit = oldDeposits.find(item => item.id === d.id);
        // status changed
      if (
        oldDeposit && 
        d.currentState !== oldDeposit.currentState &&
        // and operators owns this deposit (members contains operator ID)
        d.bondedECDSAKeep.members.some(item => item.id === o)
      ) {
        movedDeposits.push({ operator: o, deposit: d });
      }
    }
  }
  return movedDeposits;
}

function getLowCollaterializationDeposits(oldDeposits, newDeposits, price) {
  const lowDeposits = { min110: [], min125: [] };
  for (const d of newDeposits) {
    if (d.currentState === 'LIQUIDATED') continue;
    const oldDeposit = oldDeposits.find(item => item.id === d.id);
    const coll = +getCollaterization(d, price);
    const oldDepositColl = oldDeposit ? +getCollaterization(oldDeposit, price) : 0;
    if (coll < 110 && (!oldDepositColl || oldDepositColl > 110)) {
      lowDeposits.min110.push(d);
    } else if (coll < 125 && (!oldDepositColl || oldDepositColl > 125)) {
      lowDeposits.min125.push(d);
    }
  }
  return lowDeposits;
}

function getLowCollaterializationDepositsOfSub(oldDeposits, newDeposits, price, subscriber) {
  const lowDeposits = { min110: [], min125: [] };
  for (const d of newDeposits) {
    for (const o of subscriber.operators) {
      if (d.currentState === 'LIQUIDATED') continue;
      if (!d.bondedECDSAKeep.members.some(item => item.id === o)) continue;
      const oldDeposit = oldDeposits.find(item => item.id === d.id);
      const coll = +getCollaterization(d, price);
      const oldDepositColl = oldDeposit ? +getCollaterization(oldDeposit, price) : 0;
      if (coll < 110 && (!oldDepositColl || oldDepositColl > 110)) {
        lowDeposits.min110.push({ operator: o, deposit: d });
      } else if (coll < 125 && (!oldDepositColl || oldDepositColl > 125)) {
        lowDeposits.min125.push({ operator: o, deposit: d });
      }
    }
  }
  return lowDeposits;
}

module.exports = {
  getMinCollaterialization,
  getMinOperatorCollaterialization,
  getMovedDeposits,
  getLowCollaterializationDeposits,
  getMovedDepositsOfSub,
  getLowCollaterializationDepositsOfSub,
};