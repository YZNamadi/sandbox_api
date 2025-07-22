import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CIToken } from './ci-token.entity';
import { Team } from '../users/team.entity';
import * as crypto from 'crypto';

@Injectable()
export class CIIntegrationsService {
  constructor(
    @InjectRepository(CIToken) private ciTokenRepo: Repository<CIToken>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
  ) {}

  async createToken(teamId: string, description?: string) {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new Error('Team not found');
    const token = crypto.randomBytes(32).toString('hex');
    const ciToken = this.ciTokenRepo.create({ team, token, description, active: true });
    return this.ciTokenRepo.save(ciToken);
  }

  async revokeToken(teamId: string, token: string) {
    const ciToken = await this.ciTokenRepo.findOne({ where: { team: { id: teamId }, token } });
    if (!ciToken) throw new Error('Token not found');
    ciToken.active = false;
    return this.ciTokenRepo.save(ciToken);
  }

  async listTokens(teamId: string) {
    return this.ciTokenRepo.find({ where: { team: { id: teamId } } });
  }
} 