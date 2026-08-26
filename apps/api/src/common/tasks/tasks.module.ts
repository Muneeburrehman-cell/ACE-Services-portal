import { Module } from '@nestjs/common';
import { EmailSummaryTask } from './email-summary.task';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, EmailModule, ConfigModule],
  providers: [EmailSummaryTask],
  exports: [EmailSummaryTask],
})
export class TasksModule {}
