import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleEnum } from '../auth/roles.enum';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

interface JwtUser {
  userId: string;
  email: string;
  teamId: string;
  role: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'List all users in the team' })
  @ApiResponse({ status: 200, description: 'List of users.' })
  async listUsers(@Req() req: Request) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.usersService.listUsers(teamId);
  }

  @Post('users/invite')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Invite a new user to the team' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        roleName: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User invited.' })
  async inviteUser(
    @Req() req: Request,
    @Body() body: { email: string; name: string; roleName: string },
  ) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.usersService.inviteUser(
      teamId,
      body.email,
      body.name,
      body.roleName,
    );
  }

  @Delete('users/:userId')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Remove a user from the team' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiResponse({ status: 200, description: 'User removed.' })
  async removeUser(@Req() req: Request, @Param('userId') userId: string) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.usersService.removeUser(teamId, userId);
  }

  @Patch('users/:userId/role')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Change a user role' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiBody({ schema: { properties: { roleName: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'User role updated.' })
  async changeUserRole(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() body: { roleName: string },
  ) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.usersService.changeUserRole(teamId, userId, body.roleName);
  }

  @Get('teams')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'List all teams' })
  @ApiResponse({ status: 200, description: 'List of teams.' })
  async listTeams() {
    return this.usersService.listTeams();
  }

  @Get('teams/:teamId')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get a team by ID' })
  @ApiParam({ name: 'teamId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Team details.' })
  async getTeam(@Req() req: Request, @Param('teamId') teamId: string) {
    return this.usersService.getTeam(teamId);
  }
}
