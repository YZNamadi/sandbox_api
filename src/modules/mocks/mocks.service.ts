import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mock } from './mock.entity';
import { Sandbox } from '../sandboxes/sandbox.entity';
import SwaggerParser from '@apidevtools/swagger-parser';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
type OpenAPIObject = Record<string, unknown>;

@Injectable()
export class MocksService {
  constructor(
    @InjectRepository(Mock) private mockRepo: Repository<Mock>,
    @InjectRepository(Sandbox) private sandboxRepo: Repository<Sandbox>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  // Cache OpenAPI spec in Redis
  async cacheOpenApiSpec(sandboxId: string, spec: object): Promise<void> {
    await this.redis.set(`sandbox:${sandboxId}:openapi`, JSON.stringify(spec));
  }

  async getCachedOpenApiSpec(
    sandboxId: string,
  ): Promise<Record<string, unknown> | null> {
    const specStr = await this.redis.get(`sandbox:${sandboxId}:openapi`);
    return specStr ? (JSON.parse(specStr) as Record<string, unknown>) : null;
  }

  // Cache mock response in Redis
  async cacheMockResponse(
    sandboxId: string,
    path: string,
    method: string,
    response: unknown,
  ): Promise<void> {
    await this.redis.set(
      `sandbox:${sandboxId}:mock:${method}:${path}`,
      JSON.stringify(response),
    );
  }

  async getCachedMockResponse(
    sandboxId: string,
    path: string,
    method: string,
  ): Promise<unknown> {
    const respStr = await this.redis.get(
      `sandbox:${sandboxId}:mock:${method}:${path}`,
    );
    return respStr ? JSON.parse(respStr) : null;
  }

  async validateOpenApiSpec(
    spec: Record<string, unknown>,
  ): Promise<OpenAPIObject> {
    try {
      // Optionally cache the spec after validation
      // SwaggerParser.validate accepts string | Document<{}>
      return (await SwaggerParser.validate(
        spec as any,
      )) as unknown as OpenAPIObject;
    } catch (e) {
      if (e instanceof Error) {
        throw new BadRequestException('Invalid OpenAPI spec: ' + e.message);
      }
      throw new BadRequestException('Invalid OpenAPI spec');
    }
  }

  async saveCustomMock(
    sandboxId: string,
    path: string,
    method: string,
    response: Record<string, unknown>,
    isRandomized = false,
    delayMs?: number,
  ): Promise<Mock> {
    const sandbox = await this.sandboxRepo.findOne({
      where: { id: sandboxId },
    });
    if (!sandbox) throw new BadRequestException('Sandbox not found');
    const mock = this.mockRepo.create({
      sandbox,
      path,
      method,
      response,
      isRandomized,
      delayMs,
    });
    const saved = await this.mockRepo.save(mock);
    // Cache the mock response in Redis
    await this.cacheMockResponse(sandboxId, path, method, response);
    return saved;
  }

  async getMockResponse(
    sandboxId: string,
    path: string,
    method: string,
  ): Promise<Mock | null> {
    // Try Redis cache first
    const cached = await this.getCachedMockResponse(sandboxId, path, method);
    if (cached) return cached as Mock;
    // Fallback to DB
    const dbMock = await this.mockRepo.findOne({
      where: { sandbox: { id: sandboxId }, path, method },
    });
    if (dbMock) {
      // Cache for future
      await this.cacheMockResponse(sandboxId, path, method, dbMock.response);
      return dbMock;
    }
    return null;
  }

  // Example placeholder for using Redis in future methods
  // async cacheMockResponse(...) { /* use this.redis.set/get */ }
}
