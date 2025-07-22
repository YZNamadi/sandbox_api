import { SimulationPlugin } from '../simulation.plugin';
import { KycPlugin } from './kyc.plugin';
import { FraudPlugin } from './fraud.plugin';
import { BalancePlugin } from './balance.plugin';

export const PluginRegistry: Record<string, SimulationPlugin> = {
  kyc: KycPlugin,
  fraud: FraudPlugin,
  balance: BalancePlugin,
  // Add more plugins here
};
