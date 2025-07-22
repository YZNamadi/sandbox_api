export interface SimulationPlugin {
  name: string;
  execute(config: any, req: any, state: any): Promise<any>;
}
