import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*', credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  afterInit() {
    this.notificationsService.setGateway(this);
  }

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      const payload = this.jwtService.verify(token as string, {
        secret: this.config.get('JWT_SECRET'),
      });
      socket.data.user = payload;
      socket.join(`user:${payload.sub}`);
    } catch {
      socket.disconnect();
    }
  }

  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
