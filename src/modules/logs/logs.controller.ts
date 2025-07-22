import { Controller, Get, Query, UseGuards, Req, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './log.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleEnum } from '../auth/roles.enum';
import { Request } from 'express';
import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

interface JwtUser {
  userId: string;
  email: string;
  teamId: string;
  role: string;
}

class LogQueryDto {
  @IsOptional() @IsString() sandboxId?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() fromDate?: string;
  @IsOptional() @IsString() toDate?: string;
  @IsOptional() @IsNumberString() limit?: number;
}

const logger = new Logger('LogsController');

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogsController {
  constructor(
    @InjectRepository(Log) private readonly logRepo: Repository<Log>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs for a team or sandbox' })
  @ApiQuery({ name: 'sandboxId', required: false, type: 'string' })
  @ApiQuery({ name: 'userId', required: false, type: 'string' })
  @ApiQuery({ name: 'route', required: false, type: 'string' })
  @ApiQuery({ name: 'method', required: false, type: 'string' })
  @ApiQuery({ name: 'fromDate', required: false, type: 'string' })
  @ApiQuery({ name: 'toDate', required: false, type: 'string' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'List of audit logs.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getLogs(@Req() req: Request, @Query() query: LogQueryDto) {
    // JwtAuthGuard and RolesGuard ensure req.user is always defined here
    const user = req.user as JwtUser;
    const qb = this.logRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.sandbox', 'sandbox')
      .leftJoinAndSelect('log.user', 'user');
    if (query.sandboxId) qb.andWhere('sandbox.id = :sandboxId', { sandboxId: query.sandboxId });
    if (query.userId) qb.andWhere('user.id = :userId', { userId: query.userId });
    if (query.route) qb.andWhere('log.route = :route', { route: query.route });
    if (query.method) qb.andWhere('log.method = :method', { method: query.method });
    if (query.fromDate) qb.andWhere('log.timestamp >= :fromDate', { fromDate: query.fromDate });
    if (query.toDate) qb.andWhere('log.timestamp <= :toDate', { toDate: query.toDate });
    if (query.limit) qb.limit(query.limit);
    if (![RoleEnum.OWNER, RoleEnum.ADMIN].includes(user.role as RoleEnum)) {
      if (user.teamId) {
        qb.andWhere('sandbox.team = :teamId', { teamId: user.teamId });
      } else {
        qb.andWhere('user.id = :userId', { userId: user.userId });
      }
    }
    qb.orderBy('log.timestamp', 'DESC');
    const logs = await qb.getMany();
    return logs;
  }
} 