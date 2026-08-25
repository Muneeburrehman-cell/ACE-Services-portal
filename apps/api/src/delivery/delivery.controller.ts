import { Controller, Get, Post, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('delivery')
export class DeliveryController {
  constructor(private delivery: DeliveryService) {}

  @Get(':projectId/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  preview(@Param('projectId') projectId: string) {
    return this.delivery.getPreview(projectId);
  }

  @Post(':projectId/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  send(@Param('projectId') projectId: string, @Body() body: any, @Req() req: any) {
    return this.delivery.sendToClient(projectId, body, req.user.sub);
  }

  /**
   * Public Webhook endpoint for Resend email events (delivered, bounced, received, opened)
   */
  @Post('resend-webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: any) {
    return this.delivery.handleResendWebhook(body);
  }
}
