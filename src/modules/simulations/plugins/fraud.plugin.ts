import { SimulationPlugin } from '../simulation.plugin';

interface FraudState {
  score: number;
}

export const FraudPlugin: SimulationPlugin = {
  name: 'fraud',
  execute(config, req, state) {
    // Example: Simulate fraud score based on input
    const userId = (req.body as { userId?: string })?.userId || 'unknown';
    if (!state[userId]) {
      // Random score between 0 and 100
      const score = Math.floor(Math.random() * 101);
      state[userId] = { score };
    }
    const userState = state[userId] as FraudState;
    return Promise.resolve({
      userId,
      score: userState.score,
      risk:
        userState.score > ((config as { threshold?: number }).threshold || 70)
          ? 'high'
          : 'low',
    });
  },
};
