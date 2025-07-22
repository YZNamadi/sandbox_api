import { Controller, Post, Get, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { CIIntegrationsService } from './ci-integrations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleEnum } from '../auth/roles.enum';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

interface JwtUser {
  userId: string;
  email: string;
  teamId: string;
  role: string;
}

@ApiTags('CI/CD')
@ApiBearerAuth()
@Controller('ci-tokens')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CIIntegrationsController {
  constructor(private readonly ciService: CIIntegrationsService) {}

  @Post()
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new CI token' })
  @ApiBody({ schema: { properties: { description: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'CI token created.' })
  async createToken(@Req() req: Request, @Body() body: { description?: string }) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.ciService.createToken(teamId, body.description);
  }

  @Delete()
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Revoke a CI token' })
  @ApiBody({ schema: { properties: { token: { type: 'string' } }, required: ['token'] } })
  @ApiResponse({ status: 200, description: 'CI token revoked.' })
  async revokeToken(@Req() req: Request, @Body() body: { token: string }) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.ciService.revokeToken(teamId, body.token);
  }

  @Get()
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.DEVELOPER, RoleEnum.VIEWER)
  @ApiOperation({ summary: 'List all CI tokens for the team' })
  @ApiResponse({ status: 200, description: 'List of CI tokens.' })
  async listTokens(@Req() req: Request) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.ciService.listTokens(teamId);
  }
} 