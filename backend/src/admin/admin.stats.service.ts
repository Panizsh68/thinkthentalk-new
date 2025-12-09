import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisService } from '../infrastructure/cache/redis.service';

@Injectable()
export class AdminStatsService {
  private readonly cacheKey = 'admin:stats';
  private readonly ttlSeconds = 60;

  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async getStats(): Promise<{
    upcomingEvents: number;
    totalRegistrations: number;
    paidRegistrations: number;
    totalRevenue: number;
  }> {
    const cached = await this.redis.get(this.cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached as string);
      } catch (_) {
        // ignore parse errors
      }
    }

    const [upcomingEvents, totalRegistrations, paidRegistrations, totalRevenueAgg] = await Promise.all([
      this.prisma.event.count({ where: { startDateTime: { gt: new Date() } } }),
      this.prisma.registration.count(),
      this.prisma.registration.count({ where: { status: 'PAID' as any } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' as any },
      }),
    ]);

    const totalRevenue = totalRevenueAgg._sum.amount
      ? (totalRevenueAgg._sum.amount as any).toNumber?.() ?? (totalRevenueAgg._sum.amount as unknown as number)
      : 0;

    const stats = { upcomingEvents, totalRegistrations, paidRegistrations, totalRevenue };
    await this.redis.setWithTTL(this.cacheKey, JSON.stringify(stats), this.ttlSeconds);
    return stats;
  }
}
