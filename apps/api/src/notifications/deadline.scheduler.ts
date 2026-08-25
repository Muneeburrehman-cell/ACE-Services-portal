import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { ProjectStatus, UserRole } from '@prisma/client';

@Injectable()
export class DeadlineScheduler {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkDeadlines() {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const now = new Date();

    const urgentProjects = await this.prisma.project.findMany({
      where: {
        status: { in: [ProjectStatus.assigned, ProjectStatus.in_progress] },
        internalDeadline: { lte: in24h, gte: now },
      },
      include: {
        assignedEngineer: { select: { id: true, fullName: true } },
      },
    });

    for (const project of urgentProjects) {
      if (!project.assignedTo) continue;

      await this.notifications.notifyUser(project.assignedTo, 'DEADLINE_APPROACHING', {
        title: 'Deadline Approaching',
        body: `Project ${project.referenceNumber} is due within 24 hours.`,
        metadata: { projectId: project.id, referenceNumber: project.referenceNumber },
      });

      await this.notifications.notifyAdmin('DEADLINE_APPROACHING', {
        title: 'Engineer Deadline Approaching',
        body: `Project ${project.referenceNumber} deadline is within 24 hours.`,
        metadata: { projectId: project.id, referenceNumber: project.referenceNumber },
      });
    }
  }
}
