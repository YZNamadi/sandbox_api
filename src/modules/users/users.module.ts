import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Team } from './team.entity';
import { Role } from './role.entity';
import { RoleSeeder } from './role.seeder';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team, Role])],
  controllers: [UsersController],
  providers: [RoleSeeder, UsersService],
  exports: [TypeOrmModule, RoleSeeder],
})
export class UsersModule {}
