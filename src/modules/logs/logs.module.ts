import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { Sandbox } from '../sandboxes/sandbox.entity';
import { User } from '../users/user.entity';
import { LogInterceptor } from './log.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogsController } from './logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Log, Sandbox, User])],
  controllers: [LogsController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LogInterceptor },
  ],
  exports: [TypeOrmModule],
})
export class LogsModule {}
