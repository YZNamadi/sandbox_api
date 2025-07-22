import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { RoleEnum } from '../auth/roles.enum';

@Injectable()
export class RoleSeeder implements OnModuleInit {
  private readonly logger = new Logger(RoleSeeder.name);
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {}

  async onModuleInit() {
    for (const roleName of Object.values(RoleEnum)) {
      const exists = await this.roleRepo.findOne({ where: { name: roleName } });
      if (!exists) {
        await this.roleRepo.save(this.roleRepo.create({ name: roleName }));
        this.logger.log(`Seeded role: ${roleName}`);
      }
    }
  }
} 