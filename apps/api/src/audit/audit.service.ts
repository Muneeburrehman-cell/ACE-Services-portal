import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEventType, UserRole } from '@prisma/client';

interface AuditEntry {
  eventType: AuditEventType;
  actorId?: string;
  actorRole?: UserRole;
  targetId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(entry: AuditEntry): void {
    // Fire-and-forget — never await this in callers
    this.prisma.auditLog
      .create({
        data: {
          eventType: entry.eventType,
          actorId: entry.actorId ?? null,
          actorRole: entry.actorRole ?? null,
          targetId: entry.targetId ?? null,
          metadata: entry.metadata ?? {},
        },
      })
      .catch((err) => console.error('Audit log failed:', err));
  }

  async findAll(filters: {
    eventType?: AuditEventType;
    actorId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const { eventType, actorId, from, to, page = 1, limit = 50 } = filters;
    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (actorId) where.actorId = actorId;
    if (from || to) {
      where.occurredAt = {};
      if (from) where.occurredAt.gte = from;
      if (to) where.occurredAt.lte = to;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { fullName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
