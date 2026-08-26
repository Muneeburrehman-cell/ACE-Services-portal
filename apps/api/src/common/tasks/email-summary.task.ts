import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTriggersService } from '../../email/email.triggers.service';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class EmailSummaryTask {
  private logger = new Logger('EmailSummaryTask');

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private emailService: EmailService,
    private emailTriggers: EmailTriggersService,
  ) {}

  /**
   * Daily summary email - runs every day at 5 PM UTC
   */
  @Cron('0 17 * * *', {
    name: 'DailySummaryEmail',
    timeZone: 'UTC',
  })
  async sendDailySummary() {
    this.logger.log('🌅 Starting daily summary email task...');
    try {
      const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'admin@example.com';
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Get metrics
      const projectsCreated = await this.prisma.project.count({
        where: { submittedAt: { gte: today } },
      });

      const pendingRfis = await this.prisma.projectRfi.count({
        where: { status: 'pending' },
      });

      // Send summary
      await this.emailService.send({
        to: adminEmail,
        subject: `📊 Daily Summary — ${today.toLocaleDateString()}`,
        text: `Daily Report: ${projectsCreated} projects, ${pendingRfis} pending RFIs`,
      });

      // Trigger email
      this.emailTriggers.triggerDailySummary({
        date: today.toLocaleDateString(),
        projectsAdded: projectsCreated,
        projectsCompleted: 0,
        projectsInProgress: 0,
        rfisReceived: 0,
        rfisAnswered: 0,
        filesUploaded: 0,
        issueCount: pendingRfis,
        portalLink: `${this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000'}/admin/dashboard`,
        recipients: [adminEmail],
      }).catch(err => this.logger.warn('Daily summary email trigger failed', err));

      this.logger.log('✅ Daily summary sent');
    } catch (error) {
      this.logger.error('❌ Daily summary failed', error);
    }
  }

  /**
   * Weekly summary email - runs every Friday at 5 PM UTC
   */
  @Cron('0 17 * * 5', {
    name: 'WeeklySummaryEmail',
    timeZone: 'UTC',
  })
  async sendWeeklySummary() {
    this.logger.log('📅 Starting weekly summary email task...');
    try {
      const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'admin@example.com';
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get weekly metrics
      const projectsCreated = await this.prisma.project.count({
        where: {
          submittedAt: { gte: startDate, lte: endDate },
        },
      });

      const projectsCompleted = await this.prisma.project.count({
        where: {
          status: ProjectStatus.sent_to_client,
          updatedAt: { gte: startDate, lte: endDate },
        },
      });

      const rfisCreated = await this.prisma.projectRfi.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      // Send summary
      await this.emailService.send({
        to: adminEmail,
        subject: `📊 Weekly Summary — Week of ${startDate.toLocaleDateString()}`,
        text: `Weekly Report: ${projectsCreated} created, ${projectsCompleted} completed, ${rfisCreated} RFIs`,
      });

      // Trigger email
      this.emailTriggers.triggerWeeklySummary({
        weekStart: startDate.toLocaleDateString(),
        weekEnd: endDate.toLocaleDateString(),
        projectsStarted: projectsCreated,
        projectsCompleted,
        avgCompletionTime: '0 days',
        atRiskCount: 0,
        highPriorityCount: 0,
        portalLink: `${this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000'}/admin/dashboard`,
        recipients: [adminEmail],
      }).catch(err => this.logger.warn('Weekly summary email trigger failed', err));

      this.logger.log('✅ Weekly summary sent');
    } catch (error) {
      this.logger.error('❌ Weekly summary failed', error);
    }
  }
}
