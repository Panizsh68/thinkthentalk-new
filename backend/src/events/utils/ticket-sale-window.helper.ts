import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface TicketSaleWindow {
  saleStartDate: Date | null;
  saleEndDate: Date | null;
}

export async function getTicketSaleWindows(
  prisma: PrismaService,
  ticketIds: string[],
): Promise<Map<string, TicketSaleWindow>> {
  if (!ticketIds || ticketIds.length === 0) {
    return new Map();
  }

  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: string; saleStartDate: Date | null; saleEndDate: Date | null }>
    >(
      Prisma.sql`
        SELECT id, saleStartDate, saleEndDate
        FROM EventTicketConfig
        WHERE id IN (${Prisma.join(ticketIds)})
      `,
    );

    return rows.reduce((acc, row) => {
      acc.set(row.id, {
        saleStartDate: row.saleStartDate,
        saleEndDate: row.saleEndDate,
      });
      return acc;
    }, new Map<string, TicketSaleWindow>());
  } catch (error) {
    // Gracefully handle missing columns during migration transitions
    return new Map();
  }
}
