import { SimulationPlugin } from '../simulation.plugin';

export const KycPlugin: SimulationPlugin = {
  name: 'kyc',
  async execute(config, req, state) {
    // Example: Simulate KYC delay and status
    const userId = req.body?.userId || 'unknown';
    if (!state[userId]) {
      state[userId] = { status: 'pending', startedAt: Date.now() };
      return { status: 'pending', message: 'KYC in progress' };
    }
    // Simulate delay (e.g., 5 seconds)
    if (Date.now() - state[userId].startedAt < (config.delayMs || 5000)) {
      return { status: 'pending', message: 'KYC in progress' };
    }
    state[userId].status = 'approved';
    return { status: 'approved', message: 'KYC complete' };
  },
}; 