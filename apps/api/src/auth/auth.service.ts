import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { EmailTriggersService } from '../email/email.triggers.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditEventType, UserRole } from '@prisma/client';

const LOGIN_LOCKOUT_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private audit: AuditService,
    private emailService: EmailService,
    private emailTriggers: EmailTriggersService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      this.audit.log({
        eventType: AuditEventType.USER_LOGIN_FAILURE,
        metadata: { email, reason: 'user_not_found_or_inactive' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remaining = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Account locked. Try again in ${remaining} minute(s).`);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const newCount = (user.failedLogins ?? 0) + 1;
      const update: any = { failedLogins: newCount };
      
      // Send failed login alert on 3rd attempt
      if (newCount === 3) {
        await this.emailTriggers
          .triggerFailedLoginAlert({
            email: user.email,
            attempts: newCount,
            time: new Date().toISOString(),
            supportEmail: this.config.get('SUPPORT_EMAIL') || 'support@aceservices.com',
          })
          .catch(err => this.logger.warn('Failed to send login alert', err));
      }
      
      // Lock account on 5th attempt
      if (newCount >= LOGIN_LOCKOUT_ATTEMPTS) {
        const lockoutTime = new Date(Date.now() + LOGIN_LOCKOUT_MINUTES * 60 * 1000);
        update.lockoutUntil = lockoutTime;
        update.failedLogins = 0;
        
        // Send account locked email
        await this.emailTriggers
          .triggerAccountLocked({
            email: user.email,
            time: new Date().toISOString(),
            unlockTime: lockoutTime.toISOString(),
            supportEmail: this.config.get('SUPPORT_EMAIL') || 'support@aceservices.com',
          })
          .catch(err => this.logger.warn('Failed to send lock email', err));
      }
      
      await this.prisma.user.update({ where: { id: user.id }, data: update });
      this.audit.log({
        eventType: AuditEventType.USER_LOGIN_FAILURE,
        actorId: user.id,
        actorRole: user.role,
        metadata: { reason: 'wrong_password', failCount: newCount },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failure counter on successful login
    if (user.failedLogins > 0) {
      await this.prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0 } });
    }

    this.audit.log({
      eventType: AuditEventType.USER_LOGIN_SUCCESS,
      actorId: user.id,
      actorRole: user.role,
    });
    
    return this.issueTokens(user.id, user.role);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revoked || stored.expiresAt < new Date())
      throw new UnauthorizedException('Invalid refresh token');
    if (!stored.user.isActive) throw new UnauthorizedException();

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    return this.issueTokens(stored.user.id, stored.user.role);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return; // Silent — prevent email enumeration

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    this.audit.log({
      eventType: AuditEventType.PASSWORD_RESET_REQUEST,
      actorId: user.id,
      actorRole: user.role,
    });

    const resetUrl = `${this.config.get<string>('APP_BASE_URL') || 'https://yourdomain.com'}/reset-password?token=${rawToken}`;
    
    // Send password reset email
    await this.emailTriggers
      .triggerPasswordResetRequest({
        email: user.email,
        resetLink: resetUrl,
        expiresIn: '60 minutes',
        supportEmail: this.config.get('SUPPORT_EMAIL') || 'support@aceservices.com',
      })
      .catch(err => this.logger.warn('Failed to send password reset email', err));
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.used || record.expiresAt < new Date())
      throw new BadRequestException('Invalid or expired reset link');

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
      this.prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);

    // Send password changed confirmation email
    await this.emailTriggers
      .triggerPasswordChanged({
        email: record.user.email,
        time: new Date().toISOString(),
        supportEmail: this.config.get('SUPPORT_EMAIL') || 'support@aceservices.com',
      })
      .catch(err => this.logger.warn('Failed to send password changed email', err));

    this.audit.log({
      eventType: AuditEventType.PASSWORD_RESET_COMPLETE,
      actorId: record.userId,
      actorRole: record.user.role,
    });
  }

  /** Check if an email belongs to a user who still needs to complete setup */
  async checkEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.pendingSetup) return { exists: false };
    return { exists: true, fullName: user.fullName, email: user.email };
  }

  /** Complete account setup: set password, clear pendingSetup, return tokens */
  async completeSetup(email: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.pendingSetup || !user.isActive) {
      throw new BadRequestException('Email not found or setup already completed');
    }
    if (newPassword.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, pendingSetup: false },
    });

    this.audit.log({
      eventType: AuditEventType.USER_ACCOUNT_UPDATED,
      actorId: user.id,
      actorRole: user.role,
      metadata: { action: 'setup_completed' },
    });

    return this.issueTokens(user.id, user.role);
  }

  async issueTokens(userId: string, role: UserRole) {
    const jwtSecret = this.config.get<string>('JWT_SECRET');
    if (!jwtSecret) throw new InternalServerErrorException('Server misconfigured: JWT_SECRET not set');

    const payload = { sub: userId, role };
    const accessToken = this.jwtService.sign(payload, { secret: jwtSecret });

    const rawRefresh = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefresh);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: rawRefresh, role };
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
