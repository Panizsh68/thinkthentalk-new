import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { addDays } from 'date-fns';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
    });
  }

  async getMySubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
    });
  }

  async subscribe(userId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan || !plan.isActive) throw new BadRequestException('Invalid plan');

    const amount = plan.price as unknown as number;

    // Process payment via wallet
    await this.walletService.payWithWallet(
      userId,
      amount,
      `Subscription to ${plan.name}`,
      plan.id,
    );

    const existing = await this.getMySubscription(userId);
    const startDate =
      existing && existing.isActive && existing.endDate > new Date()
        ? existing.endDate
        : new Date();

    const endDate = addDays(startDate, plan.durationDays);

    return this.prisma.subscription.upsert({
      where: { userId },
      update: {
        planName: plan.name,
        endDate,
        isActive: true,
      },
      create: {
        userId,
        planName: plan.name,
        endDate,
        isActive: true,
      },
    });
  }
}
