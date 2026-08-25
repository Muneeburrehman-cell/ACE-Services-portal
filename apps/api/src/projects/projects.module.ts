import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { RfisService } from './rfis.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [NotificationsModule, EmailModule, ConfigModule],
  providers: [ProjectsService, RfisService],
  controllers: [ProjectsController],
  exports: [ProjectsService, RfisService],
})
export class ProjectsModule {}
