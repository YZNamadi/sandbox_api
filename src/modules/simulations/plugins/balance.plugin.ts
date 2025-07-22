import { SimulationPlugin } from '../simulation.plugin';

export const BalancePlugin: SimulationPlugin = {
  name: 'balance',
  async execute(config, req, state) {
    // Example: Simulate balance updates per user
    const userId = req.body?.userId || 'unknown';
    if (!state[userId]) {
      state[userId] = { balance: config.initial || 1000 };
    }
    if (req.body?.amount && req.body?.type === 'debit') {
      state[userId].balance -= req.body.amount;
    }
    if (req.body?.amount && req.body?.type === 'credit') {
      state[userId].balance += req.body.amount;
    }
    return {
      userId,
      balance: state[userId].balance,
    };
  },
}; 