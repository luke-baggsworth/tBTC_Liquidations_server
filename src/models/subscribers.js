const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema({
  telegram_id: Number,
  daily_statistics: Boolean,
  operators: [String],
});

module.exports = mongoose.model('subscriber', SubscriberSchema);