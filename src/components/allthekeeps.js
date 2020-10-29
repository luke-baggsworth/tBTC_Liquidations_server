const ws = require('ws');
const { SubscriptionClient } = require('subscriptions-transport-ws');
const { filterDepositsAll } = require('./../utils/filter');
const { depositQuery, priceQuery } = require('./../utils/query');
const { movedDepositsInfoToChannel, lowDepositsInfoToChannel } = require('./../utils/notifications');
const { movedDepositsInfoToSubscribers, lowDepositsInfoToSubscribers } = require('./../utils/notifications');

const Deposit = require('./../models/deposits');
const Price = require('./../models/price');

const E = process.env;

async function start() {
  const depositClient = new SubscriptionClient(E.GRAPHQL_DEPOSITS_ENDPOINT, { reconnect: true }, ws);
  const depsitConnection = depositClient.request({ query: depositQuery });

  const priceClient = new SubscriptionClient(E.GRAPHQL_PRICE_ENDPOINT, { reconnect: true }, ws);
  const priceConnection = priceClient.request({ query: priceQuery });

  priceConnection.subscribe({
    async next({ data }) {
      if (!data) return;
      const price = await Price.findOne();
      if (price) {
        await Price.updateOne({ _id: price._id }, data.price);
      } else {
        const newPrice = new Price(data.price);
        await newPrice.save();
      }
    }
  });

  depsitConnection.subscribe({
    async next({ data }) {
      if (!data) return;
      const newDeposits = filterDepositsAll(data.deposits);
      const oldDeposits = await Deposit.find();
      await Deposit.deleteMany({});
      for(const d of newDeposits) {
        const newDeposit = new Deposit(d);
        await newDeposit.save();
      }

      movedDepositsInfoToChannel(oldDeposits, newDeposits);
      await movedDepositsInfoToSubscribers(oldDeposits, newDeposits);
      await lowDepositsInfoToChannel(newDeposits);
      await lowDepositsInfoToSubscribers(newDeposits);
    }
  });
}

module.exports = { start };