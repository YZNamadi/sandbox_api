import { Request } from 'express';

export interface SimulationState {
  [userId: string]: Record<string, unknown>;
}

export interface SimulationConfig {
  plugin?: string;
  scenario?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SimulationPlugin {
  name: string;
  execute(
    config: SimulationConfig,
    req: Request,
    state: SimulationState,
  ): Promise<Record<string, unknown>>;
}
