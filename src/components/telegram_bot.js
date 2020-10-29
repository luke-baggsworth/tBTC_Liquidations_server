const { Telegraf } = require('telegraf');
const { ApolloClient, InMemoryCache } = require('@apollo/client/core');
const { operatorQuery } = require('./../utils/query');
const { formatLink } = require('./../utils/format');
const { commonInfo, commonOperatorInfo, leadingSpaceReg } = require('./../utils/messages');

const Subscriber = require('./../models/subscribers');
const Deposit = require('./../models/deposits');
const Price = require('./../models/price');

require('dotenv').config();
require('cross-fetch/polyfill');

/* save chat status for users to catch command replies */
const CHAT_STATE = {};

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const apolloClient = new ApolloClient({ 
  uri: process.env.HTTP_ALLTHEKEEPS_ENDPOINT, 
  cache: new InMemoryCache() 
});

async function start() {

  bot.command('start', showButtonMenu);
  bot.command('help', showHelp);
  bot.command('operator_list', ctx => getOperatorList(ctx));
  bot.command('add_operator', ctx => addOperatorPrompt(ctx));
  bot.command('remove_operator', ctx => removeOperatorPrompt(ctx));
  bot.command('operators_info', ctx => getOperatorsInfo(ctx));
  bot.command('deposits_info', ctx => getDepositsInfo(ctx));
  bot.command('statistics_on', ctx => turnOnNotifications(ctx));
  bot.command('statistics_off', ctx => turnOffNotifications(ctx));

  bot.on('callback_query', async ctx => {
    const data = ctx.update.callback_query.data;
    if (data === 'OPERATOR_LIST') {
      await getOperatorList(ctx);
    } else if (data === 'ADD_OPERATOR') {
      addOperatorPrompt(ctx);
    } else if (data === 'REMOVE_OPERATOR') {
      removeOperatorPrompt(ctx);
    } else if (data === 'OPERATORS_INFO') {
      await getOperatorsInfo(ctx);
    } else if (data === 'DEPOSITS_INFO') {
      await getDepositsInfo(ctx);
    } else if (data === 'STATISTICS_ON') {
      await turnOnNotifications(ctx);
    } else if (data === 'STATISTICS_OFF') {
      await turnOffNotifications(ctx);
    } else if (data === 'HELP') {
      await showHelp(ctx);
    }
  })

  bot.on('text', async ctx => {
    if (!CHAT_STATE[ctx.chat.id]) return;
    if (CHAT_STATE[ctx.chat.id] === 'ADD_OPERATOR') {
      await addOperator(ctx);
    } else if (CHAT_STATE[ctx.chat.id] === 'REMOVE_OPERATOR') {
      await removeOperator(ctx);
    }
    CHAT_STATE[ctx.chat.id] = '';
  });
  
  await bot.launch();
}

async function getOrCreateSubscriber(ctx) {
  let subscriber = await Subscriber.findOne({ telegram_id: ctx.chat.id });
  if (!subscriber) {
    subscriber = new Subscriber({ telegram_id: ctx.chat.id });
    await subscriber.save();
  }
  return subscriber;
}

async function getOperator(id) {
  const { data } = await apolloClient.query({ query: operatorQuery, variables: { id } });
  return data.operator;
}

async function showButtonMenu(ctx) {
  ctx.reply('Select command', {
    reply_markup: { 
      inline_keyboard: [
        [{ text: 'Operator list', callback_data: 'OPERATOR_LIST' }],
        [{ text: 'Add operator address', callback_data: 'ADD_OPERATOR' }],
        [{ text: 'Remove operator address', callback_data: 'REMOVE_OPERATOR' }],
        [{ text: 'Get operators info', callback_data: 'OPERATORS_INFO' }],
        [{ text: 'Get deposits info', callback_data: 'DEPOSITS_INFO' }],
        [{ text: 'Receive daily operator statistics', callback_data: 'STATISTICS_ON' }],
        [{ text: 'Unsubscribe from daily operator statistics', callback_data: 'STATISTICS_OFF' }],
        [{ text: 'Help', callback_data: 'HELP' }],
      ]
    }
  });
}

async function showHelp(ctx) {
  ctx.reply(`
    /start - main menu
    /operator_list - operator list
    /add_operator - add operator address
    /remove_operator - remove operator address
    /operators_info - get operators info
    /deposits_info - get deposits info
    /statistics_on - receive daily operator statistics
    /statistics_off - unsubscribe from daily operator statistics
  `.replace(leadingSpaceReg, '\n').trim());
}

async function getOperatorList(ctx) {
  const subscriber = await getOrCreateSubscriber(ctx);
  if (!subscriber.operators.length) {
    ctx.reply('Your have no operators \n\n Show menu:\n/start');
  } else {
    ctx.reply(['Your operators:\n', ...subscriber.operators.map(o => (
      `[${o}](${formatLink(`/operator/${o}`)})`
    ))].join('\n') + '\n\n Show menu:\n/start', { parse_mode: 'Markdown' });
  }
}

function addOperatorPrompt(ctx) {
  ctx.reply('Please enter operator address (0x…)');
  CHAT_STATE[ctx.chat.id] = 'ADD_OPERATOR';
}

function removeOperatorPrompt(ctx) {
  ctx.reply('Please enter operator ID');
  CHAT_STATE[ctx.chat.id] = 'REMOVE_OPERATOR';
}

async function getOperatorsInfo(ctx) {
  const susbscriber = await getOrCreateSubscriber(ctx);
  const price = await Price.findOne();
  const operatorMsgs = [];
  for (const o of susbscriber.operators) {
    const operator = await getOperator(o);
    const msg = commonOperatorInfo(operator, price);
    operatorMsgs.push(msg);
  }
  const msg = operatorMsgs.join('\n\n').trim();
  if (!msg) {
    ctx.reply('Operators list is empty' + '\n\n Show menu:\n/start', { parse_mode: 'Markdown' });
  } else {
    ctx.reply(msg + '\n\n Show menu:\n/start', { parse_mode: 'Markdown' });
  }
}

async function getDepositsInfo(ctx) {
  const deposits = await Deposit.find();
  const price = await Price.findOne();
  const msg = commonInfo(deposits, price);
  ctx.reply(msg + '\n\n Show menu:\n/start', { parse_mode: 'Markdown' });
}

async function turnOnNotifications(ctx) {
  const subscriber = await getOrCreateSubscriber(ctx);
  subscriber.daily_statistics = true;
  await subscriber.save();
  ctx.reply('statistics is on! \n\n Show menu:\n/start');
}

async function turnOffNotifications(ctx) {
  const subscriber = await getOrCreateSubscriber(ctx);
  subscriber.daily_statistics = false;
  await subscriber.save();
  ctx.reply('statistics is off! \n\n Show menu:\n/start');
}

async function addOperator(ctx) {
  const subscriber = await getOrCreateSubscriber(ctx);
  const text = ctx.message.text;
  if (subscriber.operators.length >= 5) {
    ctx.reply('You can only have 5 operators');
  } else if (subscriber.operators.includes(text)) {
    ctx.reply('Operator should be unique');
  } else {
    const operator = await getOperator(text);
    if (operator) {
      subscriber.operators.push(text);
      await subscriber.save();
      ctx.reply('Operator successfully added \n\n Show menu:\n/start`');
    } else {
      ctx.reply('Operator does not exist \n\n Show menu:\n/start');
    }
  }
}

async function removeOperator(ctx) {
  const subscriber = await getOrCreateSubscriber(ctx);
  const text = ctx.message.text;
  const hasOperator = subscriber.operators.includes(text);
  if (!hasOperator) {
    ctx.reply('Operator not in your list \n\n Show menu:\n/start');
  }
  subscriber.operators = subscriber.operators.filter(o => o !== text);
  await subscriber.save();
  ctx.reply('Operator successfully removed \n\n Show menu:\n/start');
}

module.exports = { start, bot, getOperator };