import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Simulation } from './simulation.entity';
import { Sandbox } from '../sandboxes/sandbox.entity';
import { SimulationsService } from './simulations.service';
import { RedisModule } from '../../utils/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Simulation, Sandbox]), RedisModule],
  controllers: [],
  providers: [SimulationsService],
  exports: [TypeOrmModule, SimulationsService],
})
export class SimulationsModule {} 