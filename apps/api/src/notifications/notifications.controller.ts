import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.notifications.findForUser(
      req.user.sub,
      req.user.role,
      Number(page),
      Number(limit),
    );
  }

  // Static routes MUST come before dynamic param routes in NestJS
  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: any) {
    return this.notifications.markRead(id, req.user.sub);
  }
}

