import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Simulation } from './simulation.entity';
import { Sandbox } from '../sandboxes/sandbox.entity';
import { PluginRegistry } from './plugins/plugin.registry';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Request } from 'express';

type SimulationConfig = {
  plugin?: string;
  scenario?: any;
  [key: string]: any;
};

@Injectable()
export class SimulationsService {
  constructor(
    @InjectRepository(Simulation) private simRepo: Repository<Simulation>,
    @InjectRepository(Sandbox) private sandboxRepo: Repository<Sandbox>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async getSimulation(
    sandboxId: string,
    endpoint: string,
  ): Promise<Simulation | null> {
    return this.simRepo.findOne({
      where: { sandbox: { id: sandboxId }, name: endpoint, enabled: true },
    });
  }

  // Register or update a simulation for a sandbox endpoint
  async registerSimulation(
    sandboxId: string,
    endpoint: string,
    config: SimulationConfig,
  ): Promise<Simulation> {
    const sandbox = await this.sandboxRepo.findOne({
      where: { id: sandboxId },
    });
    if (!sandbox) throw new Error('Sandbox not found');
    let sim = await this.simRepo.findOne({
      where: { sandbox: { id: sandboxId }, name: endpoint },
    });
    if (!sim) {
      sim = this.simRepo.create({
        sandbox,
        name: endpoint,
        config,
        enabled: true,
      });
    } else {
      sim.config = config;
      sim.enabled = true;
    }
    return this.simRepo.save(sim);
  }

  // Get simulation state from Redis
  async getSimulationState(
    sandboxId: string,
    endpoint: string,
  ): Promise<Record<string, unknown>> {
    const key = `sandbox:${sandboxId}:simstate:${endpoint}`;
    const stateStr = await this.redis.get(key);
    return stateStr ? (JSON.parse(stateStr) as Record<string, unknown>) : {};
  }

  // Set simulation state in Redis
  async setSimulationState(
    sandboxId: string,
    endpoint: string,
    state: Record<string, unknown>,
  ): Promise<void> {
    const key = `sandbox:${sandboxId}:simstate:${endpoint}`;
    await this.redis.set(key, JSON.stringify(state));
  }

  async executeSimulation(
    sandboxId: string,
    endpoint: string,
    req: Request,
  ): Promise<any> {
    // Use Redis for simulation state
    const state = await this.getSimulationState(sandboxId, endpoint);
    const sim = await this.getSimulation(sandboxId, endpoint);
    if (!sim) return undefined;
    let result;
    const config = sim.config as SimulationConfig;
    // If plugin, execute it
    if (config?.plugin && PluginRegistry[config.plugin]) {
      result = await PluginRegistry[config.plugin].execute(config, req, state);
    } else if (config?.scenario) {
      result = config.scenario;
    }
    // Save updated state back to Redis
    await this.setSimulationState(sandboxId, endpoint, state);
    return result;
  }

  // Example placeholder for using Redis in future methods
  // async getSimulationStateFromRedis(...) { /* use this.redis.get/set */ }
}
