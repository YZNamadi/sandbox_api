import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { MocksService } from './mocks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleEnum } from '../auth/roles.enum';
import { SandboxesService } from '../sandboxes/sandboxes.service';
import { DynamicMockRouterService } from './dynamic-mock-router.service';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Mocks')
@ApiBearerAuth()
@Controller('sandbox/:sandboxId/mocks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MocksController {
  constructor(
    private readonly mocksService: MocksService,
    private readonly sandboxesService: SandboxesService,
    private readonly dynamicMockRouter: DynamicMockRouterService,
  ) {}

  @Post('openapi')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.DEVELOPER)
  @ApiOperation({ summary: 'Upload and validate OpenAPI spec for a sandbox' })
  @ApiParam({ name: 'sandboxId', type: 'string' })
  @ApiBody({ schema: { properties: { spec: { type: 'object' } } } })
  @ApiResponse({
    status: 201,
    description: 'OpenAPI spec validated and routes reloaded.',
  })
  @ApiResponse({ status: 400, description: 'Invalid OpenAPI spec.' })
  async uploadOpenApi(
    @Param('sandboxId', ParseUUIDPipe) sandboxId: string,
    @Body('spec') spec: Record<string, unknown>,
    @Req() req: Request,
  ): Promise<{ message: string; openapi: object }> {
    // Validate OpenAPI spec
    const openapi = await this.mocksService.validateOpenApiSpec(spec);
    // Save to sandbox
    const teamId = (req.user as { teamId?: string })?.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    const sandbox = await this.sandboxesService.updateOpenApiSpec(
      teamId,
      sandboxId,
      openapi,
    );
    // Reload dynamic routes (unregister + register)
    this.dynamicMockRouter.reloadMockRoutes(sandbox, openapi);
    return {
      message: 'OpenAPI spec validated, saved, and routes reloaded',
      openapi,
    };
  }

  @Post('custom')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.DEVELOPER)
  @ApiOperation({
    summary: 'Save a custom mock response for a sandbox endpoint',
  })
  @ApiParam({ name: 'sandboxId', type: 'string' })
  @ApiBody({
    schema: {
      properties: {
        path: { type: 'string' },
        method: { type: 'string' },
        response: { type: 'object' },
        isRandomized: { type: 'boolean' },
        delayMs: { type: 'number' },
      },
      required: ['path', 'method', 'response'],
    },
  })
  @ApiResponse({ status: 201, description: 'Custom mock saved.' })
  @ApiResponse({ status: 400, description: 'Missing required fields.' })
  async saveCustomMock(
    @Param('sandboxId', ParseUUIDPipe) sandboxId: string,
    @Body()
    body: {
      path: string;
      method: string;
      response: unknown;
      isRandomized?: boolean;
      delayMs?: number;
    },
    @Req() req: Request,
  ): Promise<unknown> {
    if (!body.path || !body.method || !body.response) {
      throw new BadRequestException('Missing required fields');
    }
    const teamId = (req.user as { teamId?: string })?.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    // Optionally, you could check teamId ownership here
    return this.mocksService.saveCustomMock(
      sandboxId,
      body.path,
      body.method,
      body.response as Record<string, unknown>,
      body.isRandomized,
      body.delayMs,
    );
  }
}
