import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { INestApplication, RequestMethod } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Sandbox } from '../sandboxes/sandbox.entity';
import { MocksService } from './mocks.service';
import { Express, Request, Response } from 'express';
import { Mock } from './mock.entity';
import { SimulationsService } from '../simulations/simulations.service';
import { Redis } from 'ioredis';

@Injectable()
export class DynamicMockRouterService implements OnModuleInit {
  private readonly logger = new Logger(DynamicMockRouterService.name);
  private registeredRoutes: Map<string, Array<{ method: string; path: string; handler: any }>> = new Map();
  private simulationState: Record<string, any> = {};

  constructor(
    private readonly mocksService: MocksService,
    private readonly simulationsService: SimulationsService,
    @Inject(HttpAdapterHost) private readonly httpAdapterHost: HttpAdapterHost,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  onModuleInit() {
    // Placeholder: will be called on app bootstrap
  }

  public setApp(app: INestApplication) {
    // Optionally store the app instance if needed for future use
    // this.app = app;
  }

  async registerMockRoutes(sandbox: Sandbox, openapi: any) {
    const expressApp = this.httpAdapterHost.httpAdapter.getInstance();
    // Unregister existing routes for this sandbox first
    this.unregisterMockRoutes(sandbox.id, expressApp);
    const routes: Array<{ method: string; path: string; handler: any }> = [];
    for (const path in openapi.paths) {
      const pathItem = openapi.paths[path];
      for (const method of Object.keys(pathItem)) {
        const lowerMethod = method.toLowerCase();
        const routePath = `/sandbox/${sandbox.id}/api${path}`;
        const handler = async (req: Request, res: Response) => {
          // 1. Check for simulation
          const endpointKey = `${method.toUpperCase()} ${path}`;
          // Use Redis-backed simulation state
          const simResult = await this.simulationsService.executeSimulation(sandbox.id, endpointKey, req);
          if (simResult !== undefined) {
            await this.redis.lpush(
              `sandbox:${sandbox.id}:requests`,
              JSON.stringify({
                endpoint: endpointKey,
                request: { body: req.body, query: req.query, params: req.params },
                response: simResult,
                timestamp: Date.now(),
              })
            );
            return res.json(simResult);
          }
          // 2. Check for custom mock
          const customMock = await this.mocksService.getMockResponse(sandbox.id, path, method.toUpperCase());
          if (customMock != null) {
            if (customMock.delayMs) await new Promise(r => setTimeout(r, customMock.delayMs));
            let responseToSend;
            if (customMock.isRandomized && Array.isArray(customMock.response)) {
              const idx = Math.floor(Math.random() * customMock.response.length);
              responseToSend = customMock.response[idx];
            } else {
              responseToSend = customMock.response;
            }
            await this.redis.lpush(
              `sandbox:${sandbox.id}:requests`,
              JSON.stringify({
                endpoint: endpointKey,
                request: { body: req.body, query: req.query, params: req.params },
                response: responseToSend,
                timestamp: Date.now(),
              })
            );
            return res.json(responseToSend);
          }
          // 3. Generate mock response from OpenAPI schema
          const operation = pathItem[method];
          let mockResponse = { message: 'No mock defined' };
          if (operation && operation.responses) {
            const resp = operation.responses['200'] || operation.responses['default'];
            if (resp && resp.content && resp.content['application/json'] && resp.content['application/json'].schema) {
              mockResponse = this.generateMockFromSchema(resp.content['application/json'].schema);
            }
          }
          await this.redis.lpush(
            `sandbox:${sandbox.id}:requests`,
            JSON.stringify({
              endpoint: endpointKey,
              request: { body: req.body, query: req.query, params: req.params },
              response: mockResponse,
              timestamp: Date.now(),
            })
          );
          return res.json(mockResponse);
        };
        (expressApp as any)[lowerMethod](routePath, handler);
        routes.push({ method: lowerMethod, path: routePath, handler });
        this.logger.log(`Registered mock route: [${method}] ${routePath}`);
      }
    }
    this.registeredRoutes.set(sandbox.id, routes);
  }

  unregisterMockRoutes(sandboxId: string, expressApp: Express) {
    if (!expressApp._router || !expressApp._router.stack) return;
    const routes = this.registeredRoutes.get(sandboxId);
    if (!routes) return;
    // Remove routes from Express stack
    for (const { method, path } of routes) {
      const stack = expressApp._router.stack;
      for (let i = stack.length - 1; i >= 0; i--) {
        const layer = stack[i];
        if (layer.route && layer.route.path === path && layer.route.methods[method]) {
          stack.splice(i, 1);
        }
      }
      this.logger.log(`Unregistered mock route: [${method.toUpperCase()}] ${path}`);
    }
    this.registeredRoutes.delete(sandboxId);
  }

  async reloadMockRoutes(sandbox: Sandbox, openapi: any) {
    await this.registerMockRoutes(sandbox, openapi);
  }

  generateMockFromSchema(schema: any): any {
    // Simple mock generator for OpenAPI schema (expand as needed)
    if (schema.type === 'object' && schema.properties) {
      const obj: any = {};
      for (const key in schema.properties) {
        obj[key] = this.generateMockFromSchema(schema.properties[key]);
      }
      return obj;
    }
    if (schema.type === 'array' && schema.items) {
      return [this.generateMockFromSchema(schema.items)];
    }
    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;
    if (schema.type === 'string') return 'string';
    if (schema.type === 'number') return 0;
    if (schema.type === 'boolean') return false;
    return null;
  }

  // Example placeholder for using Redis in future methods
  // async recordRequestInRedis(...) { /* use this.redis.lpush */ }
} 