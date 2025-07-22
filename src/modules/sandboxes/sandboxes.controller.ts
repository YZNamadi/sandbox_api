import { Controller, Post, Get, Patch, Delete, Param, Body, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { SandboxesService } from './sandboxes.service';
import { CreateSandboxDto } from './dto/create-sandbox.dto';
import { UpdateSandboxStateDto } from './dto/update-sandbox-state.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleEnum } from '../auth/roles.enum';
import { SandboxState } from './sandbox.entity';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

// Extend Express Request to include user property
interface AuthenticatedRequest extends ExpressRequest {
  user?: any; // Replace 'any' with your JWT payload type if available
}

@ApiTags('Sandboxes')
@ApiBearerAuth()
@Controller('sandbox')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SandboxesController {
  constructor(private readonly sandboxesService: SandboxesService) {}

  @Post()
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.DEVELOPER)
  @ApiOperation({ summary: 'Create a new sandbox' })
  @ApiBody({ type: CreateSandboxDto })
  @ApiResponse({ status: 201, description: 'Sandbox created.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSandboxDto) {
    const teamId = req.user?.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.sandboxesService.create(teamId, dto);
  }

  @Get(':id')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.DEVELOPER, RoleEnum.VIEWER)
  @ApiOperation({ summary: 'Get a sandbox by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Sandbox details.' })
  @ApiResponse({ status: 404, description: 'Sandbox not found.' })
  async get(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const teamId = req.user?.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.sandboxesService.findOne(teamId, id);
  }

  @Patch(':id/state')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update sandbox state' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateSandboxStateDto })
  @ApiResponse({ status: 200, description: 'Sandbox state updated.' })
  async updateState(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSandboxStateDto) {
    const teamId = req.user?.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.sandboxesService.updateState(teamId, id, dto.state);
  }

  @Delete(':id')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete a sandbox' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Sandbox deleted.' })
  async delete(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const teamId = req.user?.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.sandboxesService.delete(teamId, id);
  }
} 