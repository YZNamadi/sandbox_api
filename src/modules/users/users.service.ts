import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Team } from './team.entity';
import { Role } from './role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  async listUsers(teamId: string) {
    return this.userRepo.find({ where: { team: { id: teamId } }, relations: ['role', 'team'] });
  }

  async inviteUser(teamId: string, email: string, name: string, roleName: string) {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    const role = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!team || !role) throw new Error('Invalid team or role');
    const user = this.userRepo.create({ email, name, team, role, password: 'changeme' });
    return this.userRepo.save(user);
  }

  async removeUser(teamId: string, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, team: { id: teamId } } });
    if (!user) throw new Error('User not found');
    return this.userRepo.remove(user);
  }

  async changeUserRole(teamId: string, userId: string, roleName: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, team: { id: teamId } }, relations: ['role'] });
    const role = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!user || !role) throw new Error('Invalid user or role');
    user.role = role;
    return this.userRepo.save(user);
  }

  async listTeams() {
    return this.teamRepo.find();
  }

  async getTeam(teamId: string) {
    return this.teamRepo.findOne({ where: { id: teamId }, relations: ['users'] });
  }
} 