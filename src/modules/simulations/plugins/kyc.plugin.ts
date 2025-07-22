import { Request } from 'express';
import {
  SimulationPlugin,
  SimulationConfig,
  SimulationState,
} from '../simulation.plugin';

interface KycState {
  status: string;
  startedAt: number;
}

interface KycConfig extends SimulationConfig {
  delayMs?: number;
}

export const KycPlugin: SimulationPlugin = {
  name: 'kyc',
  execute(config: KycConfig, req: Request, state: SimulationState) {
    // Example: Simulate KYC delay and status
    const userId = (req.body as { userId?: string })?.userId || 'unknown';
    if (!state[userId]) {
      state[userId] = { status: 'pending', startedAt: Date.now() };
      return Promise.resolve({ status: 'pending', message: 'KYC in progress' });
    }
    // Simulate delay (e.g., 5 seconds)
    const userState = state[userId] as unknown as KycState;
    if (Date.now() - userState.startedAt < (config.delayMs || 5000)) {
      return Promise.resolve({ status: 'pending', message: 'KYC in progress' });
    }
    userState.status = 'approved';
    return Promise.resolve({ status: 'approved', message: 'KYC complete' });
  },
};
