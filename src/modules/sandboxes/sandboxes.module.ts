import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sandbox } from './sandbox.entity';
import { Team } from '../users/team.entity';
import { SandboxesService } from './sandboxes.service';
import { SandboxesController } from './sandboxes.controller';
import { MocksModule } from '../mocks/mocks.module';
import { SimulationsModule } from '../simulations/simulations.module';
import { RedisModule } from '../../utils/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sandbox, Team]),
    forwardRef(() => MocksModule),
    SimulationsModule,
    RedisModule,
  ],
  controllers: [SandboxesController],
  providers: [SandboxesService],
  exports: [TypeOrmModule, SandboxesService],
})
export class SandboxesModule {}
