const Discord = require('discord.js');
const Deposit = require('./../models/deposits');
const Price = require('./../models/price');
const { commonInfo, commonOperatorInfo } = require('./../utils/messages');
const { getOperator } = require('./telegram_bot');
const prefix = '/';

function start() {

  const client = new Discord.Client();
  client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
  
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
  
    if (command === 'deposits_info') {
      const msg = await getDepositsInfo();
      message.channel.send(msg);
    } else if (command === 'operator') {
      const id = args[0];
      const msg = await getOperatorInfo(id);
      if (msg) {
        message.channel.send(msg.replace(/\[.*\]\((.*)\)/, '$1'));
      } else {
        message.channel.send(`Operator «${id}» does not exist`);
      }
    }
  });
  
  client.login(process.env.DISCORD_BOT_TOKEN);
}

async function getDepositsInfo() {
  const deposits = await Deposit.find();
  const price = await Price.findOne();
  const msg = commonInfo(deposits, price);
  return msg;
}

async function getOperatorInfo(id) {
  const operator = await getOperator(id);
  const price = await Price.findOne();
  if (operator) {
    return commonOperatorInfo(operator, price);
  } else {
    return '';
  }
}

module.exports = {
  start
}