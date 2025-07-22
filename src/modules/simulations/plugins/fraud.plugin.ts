import { SimulationPlugin } from '../simulation.plugin';

export const FraudPlugin: SimulationPlugin = {
  name: 'fraud',
  async execute(config, req, state) {
    // Example: Simulate fraud score based on input
    const userId = req.body?.userId || 'unknown';
    if (!state[userId]) {
      // Random score between 0 and 100
      const score = Math.floor(Math.random() * 101);
      state[userId] = { score };
    }
    return {
      userId,
      score: state[userId].score,
      risk: state[userId].score > (config.threshold || 70) ? 'high' : 'low',
    };
  },
}; 