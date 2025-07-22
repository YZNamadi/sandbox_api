import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mock } from './mock.entity';
import { Sandbox } from '../sandboxes/sandbox.entity';
import { MocksService } from './mocks.service';
import { MocksController } from './mocks.controller';
import { SandboxesModule } from '../sandboxes/sandboxes.module';
import { DynamicMockRouterService } from './dynamic-mock-router.service';
import { SimulationsModule } from '../simulations/simulations.module';
import { RedisModule } from '../../utils/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mock, Sandbox]),
    forwardRef(() => SandboxesModule),
    SimulationsModule,
    RedisModule,
  ],
  controllers: [MocksController],
  providers: [MocksService, DynamicMockRouterService],
  exports: [TypeOrmModule, MocksService, DynamicMockRouterService],
})
export class MocksModule {}
