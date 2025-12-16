import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, Prisma, Discount } from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { DiscountDto } from './dto/discount.dto';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import {
  DiscountFormDataDto,
  UpdateDiscountFormDataDto,
} from './dto/discount-form-data.dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  status(): { status: 'ok'; module: string; timestamp: string } {
    return {
      status: 'ok',
      module: 'discounts',
      timestamp: new Date().toISOString(),
    };
  }

  async listDiscounts(): Promise<DiscountDto[]> {
    const discounts = await this.prisma.discount.findMany({
      include: { events: true },
    });
    return discounts.map((d) =>
      this.toDiscountDto(
        d,
        d.events.map((e) => e.eventId),
      ),
    );
  }

  async listPublicDiscounts(eventId?: string): Promise<DiscountDto[]> {
    const now = new Date();
    const discounts = await this.prisma.discount.findMany({
      where: {
        isActive: true,
        isPublic: true,
        startDate: { lte: now },
        endDate: { gte: now },
        ...(eventId
          ? {
              OR: [
                { events: { some: { eventId } } },
                { events: { none: {} } }, // applies to all if no linkage
              ],
            }
          : {}),
      },
      include: { events: true },
    });

    return discounts.map((d) =>
      this.toDiscountDto(
        d,
        d.events.map((e) => e.eventId),
      ),
    );
  }

  async createDiscount(dto: DiscountFormDataDto): Promise<DiscountDto> {
    this.validateDates(dto.startDate, dto.endDate);

    const eventIds = dto.applicableEventIds ?? [];
    const created = await this.prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          name: dto.name,
          code: dto.code,
          type: dto.type,
          value: dto.value,
          maxUses: dto.maxUses,
          maxUsesPerUser: dto.maxUsesPerUser,
          minAmount: dto.minAmount ?? null,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          isActive: dto.isActive,
          isPublic: dto.isPublic,
        },
      });

      if (eventIds.length) {
        await tx.discountOnEvent.createMany({
          data: eventIds.map((eventId) => ({
            discountId: discount.id,
            eventId,
          })),
        });
      }
      return discount;
    });

    return this.toDiscountDto(created, eventIds);
  }

  async updateDiscount(
    discountId: string,
    dto: UpdateDiscountFormDataDto,
  ): Promise<DiscountDto | null> {
    const existing = await this.prisma.discount.findUnique({
      where: { id: discountId },
      include: { events: true },
    });
    if (!existing) {
      return null;
    }

    if (dto.startDate || dto.endDate) {
      this.validateDates(
        dto.startDate ?? existing.startDate.toISOString(),
        dto.endDate ?? existing.endDate.toISOString(),
      );
    }

    const eventIds =
      dto.applicableEventIds ?? existing.events.map((e) => e.eventId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const discount = await tx.discount.update({
        where: { id: discountId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.code !== undefined ? { code: dto.code } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.value !== undefined ? { value: dto.value } : {}),
          ...(dto.maxUses !== undefined ? { maxUses: dto.maxUses } : {}),
          ...(dto.maxUsesPerUser !== undefined
            ? { maxUsesPerUser: dto.maxUsesPerUser }
            : {}),
          ...(dto.minAmount !== undefined ? { minAmount: dto.minAmount } : {}),
          ...(dto.startDate !== undefined
            ? { startDate: new Date(dto.startDate) }
            : {}),
          ...(dto.endDate !== undefined
            ? { endDate: new Date(dto.endDate) }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
        },
      });

      await tx.discountOnEvent.deleteMany({ where: { discountId } });
      if (eventIds.length) {
        await tx.discountOnEvent.createMany({
          data: eventIds.map((eventId) => ({ discountId, eventId })),
        });
      }

      return discount;
    });

    return this.toDiscountDto(updated, eventIds);
  }

  async deleteDiscount(discountId: string): Promise<boolean> {
    const existing = await this.prisma.discount.findUnique({
      where: { id: discountId },
    });
    if (!existing) {
      return false;
    }
    await this.prisma.discount.delete({ where: { id: discountId } });
    return true;
  }

  async validateDiscount(
    userId: string,
    dto: ValidateDiscountDto,
  ): Promise<DiscountDto> {
    const discount = await this.prisma.discount.findFirst({
      where: {
        code: dto.code,
        isActive: true,
      },
      include: { events: true },
    });

    if (!discount) {
      throw new BadRequestException('Discount is not valid.');
    }

    const now = new Date();
    if (discount.startDate > now || discount.endDate < now) {
      throw new BadRequestException('Discount is not valid.');
    }

    const applicableEventIds = discount.events.map((e) => e.eventId);
    if (
      applicableEventIds.length > 0 &&
      !applicableEventIds.includes(dto.eventId)
    ) {
      throw new BadRequestException('Discount is not valid.');
    }

    if (discount.minAmount) {
      const minAmount =
        (discount.minAmount as any).toNumber?.() ??
        (discount.minAmount as unknown as number);
      if (dto.ticketPrice < minAmount) {
        throw new BadRequestException('Discount is not valid.');
      }
    }

    if (discount.maxUses !== null && discount.maxUses !== undefined) {
      if (discount.usedCount >= discount.maxUses) {
        throw new BadRequestException('Discount is not valid.');
      }
    }

    // Note: maxUsesPerUser validation is skipped due to lack of per-user usage tracking.
    return this.toDiscountDto(discount, applicableEventIds);
  }

  private toDiscountDto(
    discount:
      | Prisma.DiscountGetPayload<{ include?: { events?: true } }>
      | Discount,
    applicableEventIds: string[],
  ): DiscountDto {
    return {
      id: discount.id,
      name: discount.name,
      code: discount.code ?? undefined,
      type: discount.type as DiscountType,
      value:
        (discount.value as any).toNumber?.() ??
        (discount.value as unknown as number),
      applicableEventIds,
      maxUses: discount.maxUses ?? undefined,
      usedCount: discount.usedCount,
      maxUsesPerUser: discount.maxUsesPerUser ?? undefined,
      minAmount:
        discount.minAmount !== null && discount.minAmount !== undefined
          ? ((discount.minAmount as any).toNumber?.() ??
            (discount.minAmount as unknown as number))
          : undefined,
      startDate: discount.startDate.toISOString(),
      endDate: discount.endDate.toISOString(),
      isActive: discount.isActive,
      isPublic: discount.isPublic,
    };
  }

  private validateDates(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      throw new BadRequestException('Invalid discount dates.');
    }
  }
}
