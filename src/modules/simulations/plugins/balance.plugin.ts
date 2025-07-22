import { Request } from 'express';
import {
  SimulationPlugin,
  SimulationConfig,
  SimulationState,
} from '../simulation.plugin';

interface BalanceState {
  balance: number;
}

interface BalanceConfig extends SimulationConfig {
  initial?: number;
}

export const BalancePlugin: SimulationPlugin = {
  name: 'balance',
  execute(config: BalanceConfig, req: Request, state: SimulationState) {
    // Example: Simulate balance updates per user
    const userId = (req.body as { userId?: string })?.userId || 'unknown';
    const body = req.body as { amount?: number; type?: 'debit' | 'credit' };
    if (!state[userId]) {
      state[userId] = {
        balance: config.initial || 1000,
      };
    }
    const userState = state[userId] as unknown as BalanceState;
    if (body?.amount && body?.type === 'debit') {
      userState.balance -= body.amount;
    }
    if (body?.amount && body?.type === 'credit') {
      userState.balance += body.amount;
    }
    return Promise.resolve({
      userId,
      balance: userState.balance,
    });
  },
};
