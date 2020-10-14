const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  id: String,
  contractAddress: String,
  currentState: String,
  initialCollateralizedPercent: Number,
  lotSizeSatoshis: String,
  severelyUndercollateralizedThresholdPercent: Number,
  undercollateralizedThresholdPercent: Number,
  bondedECDSAKeep: {
    createdAt: Number,
    id: String,
    members: [ { address: String, id: String } ],
    totalBondAmount: Number
  },
});

module.exports = mongoose.model('deposit', DepositSchema);