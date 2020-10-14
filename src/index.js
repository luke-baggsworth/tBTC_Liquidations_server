const mongoose = require('mongoose');
const { CronJob } = require('cron');
const { commonInfoToChannel, commonOperatorInfoToSubsribers } = require('./utils/notifications');

require('dotenv').config();

const TelegramBot = require('./components/telegram_bot');
const DiscordBot = require('./components/discord_bot');
const AllTheKeeps = require('./components/allthekeeps');

// 0 0 8 * * * - 8:00 AM
new CronJob('0 0 18 * * *', commonInfoToChannel, null, true, 'Europe/Moscow');
new CronJob('0 0 18 * * *', commonOperatorInfoToSubsribers, null, true, 'Europe/Moscow');

const db = mongoose.connection;
mongoose.connect(process.env.MONGO_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });

function main() {
  TelegramBot.start();
  DiscordBot.start();
  AllTheKeeps.start();
}

db.on('error', e => console.error(e));
db.once('open', main);
