import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sandbox, SandboxState } from './sandbox.entity';
import { Team } from '../users/team.entity';
import { CreateSandboxDto } from './dto/create-sandbox.dto';
import { DynamicMockRouterService } from '../mocks/dynamic-mock-router.service';
import { HttpAdapterHost } from '@nestjs/core';
import { Express } from 'express';

@Injectable()
export class SandboxesService {
  constructor(
    @InjectRepository(Sandbox) private sandboxRepo: Repository<Sandbox>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    private readonly dynamicMockRouter: DynamicMockRouterService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async create(teamId: string, dto: CreateSandboxDto) {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new ForbiddenException('Invalid team');
    const sandbox = this.sandboxRepo.create({ ...dto, team });
    return this.sandboxRepo.save(sandbox);
  }

  async findOne(teamId: string, id: string) {
    const sandbox = await this.sandboxRepo.findOne({
      where: { id },
      relations: ['team'],
    });
    if (!sandbox || sandbox.team.id !== teamId)
      throw new NotFoundException('Sandbox not found');
    return sandbox;
  }

  async updateState(teamId: string, id: string, state: SandboxState) {
    const sandbox = await this.findOne(teamId, id);
    sandbox.state = state;
    return this.sandboxRepo.save(sandbox);
  }

  async updateOpenApiSpec(teamId: string, id: string, openapiSpec: object) {
    const sandbox = await this.findOne(teamId, id);
    sandbox.openapiSpec = openapiSpec;
    return this.sandboxRepo.save(sandbox);
  }

  async delete(teamId: string, id: string) {
    const sandbox = await this.findOne(teamId, id);
    // Unregister dynamic mock routes
    const expressApp = this.httpAdapterHost.httpAdapter.getInstance<Express>();
    this.dynamicMockRouter.unregisterMockRoutes(sandbox.id, expressApp);
    await this.sandboxRepo.remove(sandbox);
    return { deleted: true };
  }
}
