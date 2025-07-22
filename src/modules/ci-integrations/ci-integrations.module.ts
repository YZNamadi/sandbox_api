import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CIToken } from './ci-token.entity';
import { Team } from '../users/team.entity';
import { CIIntegrationsController } from './ci-integrations.controller';
import { CIIntegrationsService } from './ci-integrations.service';

@Module({
  imports: [TypeOrmModule.forFeature([CIToken, Team])],
  controllers: [CIIntegrationsController],
  providers: [CIIntegrationsService],
  exports: [TypeOrmModule],
})
export class CIIntegrationsModule {}
