import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PlanTier } from './payment.entity';
import { Team } from '../users/team.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
  ) {}

  // Placeholder: create Stripe customer and subscription
  async createSubscription(teamId: string, plan: PlanTier) {
    // TODO: Integrate with Stripe API
    // 1. Create Stripe customer if not exists
    // 2. Create Stripe subscription for the plan
    // 3. Save customer/subscription IDs in Payment entity
    return { message: 'Stripe integration needed', teamId, plan };
  }

  // Placeholder: handle Stripe webhook events
  async handleStripeWebhook(event: any) {
    // TODO: Process Stripe webhook events (subscription updates, cancellations, etc.)
    return { received: true };
  }

  // Track API usage for billing
  async incrementUsage(teamId: string) {
    const payment = await this.paymentRepo.findOne({ where: { team: { id: teamId } } });
    if (payment) {
      payment.requestsUsed += 1;
      await this.paymentRepo.save(payment);
    }
  }

  // Get current subscription info
  async getSubscription(teamId: string) {
    return this.paymentRepo.findOne({ where: { team: { id: teamId } } });
  }
} 