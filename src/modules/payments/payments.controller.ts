import { Controller, Post, Get, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleEnum } from '../auth/roles.enum';
import { PlanTier } from './payment.entity';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

interface JwtUser {
  userId: string;
  email: string;
  teamId: string;
  role: string;
}

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe team to a plan' })
  @ApiBody({ schema: { properties: { plan: { type: 'string', enum: ['FREE', 'PRO', 'ENTERPRISE'] } } } })
  @ApiResponse({ status: 201, description: 'Subscription created.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  async subscribe(@Req() req: Request, @Body() body: { plan: PlanTier }) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.paymentsService.createSubscription(teamId, body.plan);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get current team subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription details.' })
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.DEVELOPER, RoleEnum.VIEWER)
  async getSubscription(@Req() req: Request) {
    const user = req.user as JwtUser;
    const teamId = user.teamId;
    if (!teamId) throw new Error('Missing teamId in JWT payload');
    return this.paymentsService.getSubscription(teamId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiBody({ schema: { properties: { event: { type: 'object' } } } })
  @ApiResponse({ status: 200, description: 'Webhook received.' })
  @HttpCode(200)
  async stripeWebhook(@Body() event: any) {
    // Stripe will POST events here
    return this.paymentsService.handleStripeWebhook(event);
  }
} 