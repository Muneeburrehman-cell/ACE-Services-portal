import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) implements OnModuleInit {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set. Refusing to start.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  onModuleInit() {
    // Only JWT_SECRET is required — no refresh secret needed in strategy
    if (!this.config.get<string>('JWT_SECRET')) {
      throw new Error('JWT_SECRET environment variable is not set. Refusing to start.');
    }
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true, pendingSetup: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();
    if (user.pendingSetup) {
      throw new UnauthorizedException('Please complete your account setup');
    }
    return { sub: user.id, role: user.role };
  }
}
