import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Team } from '../users/team.entity';
import { Role } from '../users/role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, password: string, name: string, teamName: string, roleName: string = 'Owner') {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already in use');
    let team = await this.teamRepo.findOne({ where: { name: teamName } });
    if (!team) {
      team = this.teamRepo.create({ name: teamName });
      await this.teamRepo.save(team);
    }
    let role = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!role) {
      role = this.roleRepo.create({ name: roleName });
      await this.roleRepo.save(role);
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, password: hashed, name, team, role });
    await this.userRepo.save(user);
    return this.login(email, password);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email }, relations: ['team', 'role'] });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, email: user.email, teamId: user.team.id, role: user.role.name };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, team: user.team.name, role: user.role.name },
    };
  }
} 