import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditParams {
  adminId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(params: AuditParams): Promise<void> {
    try {
      await (this.prisma as any).adminAuditLog.create({
        data: {
          adminId: params.adminId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to record audit log',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
