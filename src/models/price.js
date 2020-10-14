const mongoose = require('mongoose');

const PriceSchema = new mongoose.Schema({
  blockNumber: String,
  timestamp: String,
  transactionHash: String,
  val: String
});

module.exports = mongoose.model('price', PriceSchema);