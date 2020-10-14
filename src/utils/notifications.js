const Deposit = require('../models/deposits');
const Price = require('../models/price');
const Subscriber = require('../models/subscribers');
const { commonInfo, movedDepositsInfo, lowCollaterializationDepositsInfo } = require('./messages');
const { movedDepositsInfoOfSub, lowCollaterializationDepositsInfoOfSub } = require('./messages');
const { commonOperatorInfo } = require('./messages');
const { bot, getOperator } = require('./../components/telegram_bot');

async function commonInfoToChannel() {
  const deposits = await Deposit.find();
  const price = await Price.findOne();
  const msg = commonInfo(deposits, price);
  if (msg) {
    bot.telegram.sendMessage(process.env.TELEGRAM_CHANNEL_ID, msg, { parse_mode: 'Markdown' });
  }
}

async function commonOperatorInfoToSubsribers() {
  const subscribers = await Subscriber.find();
  const price = await Price.findOne();
  for (const sub of subscribers) {
    if (sub.daily_statistics) {
      const operatorMsgs = [];
      for (const o of sub.operators) {
        const operator = await getOperator(o);
        const msg = commonOperatorInfo(operator, price);
        operatorMsgs.push(msg);
      }
      const msg = operatorMsgs.join('\n\n').trim();
      if (msg) {
        bot.telegram.sendMessage(sub.telegram_id, msg, { parse_mode: 'Markdown' });
      }
    }
  }
}

function movedDepositsInfoToChannel(oldDeposits, newDeposits) {
  const msg = movedDepositsInfo(oldDeposits, newDeposits);
  if (msg) {
    bot.telegram.sendMessage(process.env.TELEGRAM_CHANNEL_ID, msg, { parse_mode: 'Markdown' });
  }
}

async function movedDepositsInfoToSubscribers(oldDeposits, newDeposits) {
  const subscribers = await Subscriber.find();
  for (const sub of subscribers) {
    const msg = movedDepositsInfoOfSub(oldDeposits, newDeposits, sub);
    if (msg) {
      bot.telegram.sendMessage(sub.telegram_id, msg, { parse_mode: 'Markdown' });
    }
  }
}

async function lowDepositsInfoToChannel(deposits) {
  const price = await Price.findOne();
  const msg = lowCollaterializationDepositsInfo(deposits, price);
  if (msg) {
    bot.telegram.sendMessage(process.env.TELEGRAM_CHANNEL_ID, msg, { parse_mode: 'Markdown' });
  }
}

async function lowDepositsInfoToSubscribers(deposits) {
  const subscribers = await Subscriber.find();
  const price = await Price.findOne();
  for (const sub of subscribers) {
    const msg = lowCollaterializationDepositsInfoOfSub(deposits, price, sub);
    if (msg) {
      bot.telegram.sendMessage(sub.telegram_id, msg, { parse_mode: 'Markdown' });
    }
  }
}

module.exports = {
  commonInfoToChannel,
  commonOperatorInfoToSubsribers,
  movedDepositsInfoToChannel,
  lowDepositsInfoToChannel,
  movedDepositsInfoToSubscribers,
  lowDepositsInfoToSubscribers
};