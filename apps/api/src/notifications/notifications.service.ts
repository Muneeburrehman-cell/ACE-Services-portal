import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

interface NotificationPayload {
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private gateway: any;

  constructor(private prisma: PrismaService) {}

  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  async notifyUser(userId: string, eventType: string, payload: NotificationPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        eventType,
        title: payload.title,
        body: payload.body,
        metadata: payload.metadata ?? {},
      },
    });

    if (this.gateway) {
      this.gateway.sendToUser(userId, notification);
    }

    return notification;
  }

  async notifyAdmin(eventType: string, payload: NotificationPayload) {
    const admin = await this.prisma.user.findFirst({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });
    if (!admin) return;
    return this.notifyUser(admin.id, eventType, payload);
  }

  /**
   * Runs inside RLS context so the notifications table policy ensures the
   * caller can only read their own rows — even if a bug passes the wrong userId.
   */
  async findForUser(userId: string, role: UserRole, page = 1, limit = 50) {
    const safeLimit = Math.min(limit, 100);

    return this.prisma.withRlsContext(userId, role, async (tx: any) => {
      const [data, total, unreadCount] = await Promise.all([
        tx.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * safeLimit,
          take: safeLimit,
        }),
        tx.notification.count({ where: { userId } }),
        tx.notification.count({ where: { userId, read: false } }),
      ]);
      return { data, total, unreadCount, page, limit: safeLimit };
    });
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
