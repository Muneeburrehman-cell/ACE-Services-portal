import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { AuditEventType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  async findAll(role?: UserRole, page = 1, limit = 50) {
    const where = role ? { role } : {};
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          pendingSetup: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findEngineers(type?: 'estimation' | 'design') {
    const roles =
      type === 'estimation'
        ? [UserRole.ESTIMATION_ENGINEER]
        : type === 'design'
          ? [UserRole.DESIGN_ENGINEER]
          : [UserRole.ESTIMATION_ENGINEER, UserRole.DESIGN_ENGINEER];

    return this.prisma.user.findMany({
      where: { role: { in: roles }, isActive: true },
      select: { id: true, fullName: true, role: true, email: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(dto: CreateUserDto, createdBy: string) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');

    // Random placeholder password — employee must complete setup to set a real one
    const passwordHash = await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 12);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        role: dto.role,
        passwordHash,
        pendingSetup: true,
      },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });

    this.audit.log({
      eventType: AuditEventType.USER_ACCOUNT_CREATED,
      actorId: createdBy,
      actorRole: UserRole.ADMIN,
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    // Generate password-setup token (valid 24 h) — still send welcome email
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const appBaseUrl = this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000';
    const setPasswordUrl = `${appBaseUrl}/setup?email=${encodeURIComponent(user.email)}`;
    const companyName = this.config.get<string>('COMPANY_NAME') ?? 'ACE SERVICES';
    const roleFormatted = user.role.replace(/_/g, ' ');

    this.emailService.send({
      to: user.email,
      subject: `🎉 Welcome to ${companyName} — Activate Your ${roleFormatted} Workspace`,
      text: `Hello ${user.fullName},\n\nYour employee account has been created on the ${companyName} Portal.\n\nAssigned Role: ${roleFormatted}\n\nClick the link below to activate your account and set your secure password:\n${setPasswordUrl}\n\nThis activation link is personalized for ${user.email}. Do not share it with anyone.\n\nBest regards,\n${companyName} Administration Team`,
    }).catch((err) => {
      console.error('[UsersService] Failed to send employee setup email:', err);
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedBy: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const data: any = {};
    if (dto.fullName) data.fullName = dto.fullName;
    if (dto.role) data.role = dto.role;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, fullName: true, email: true, role: true, isActive: true },
    });

    this.audit.log({
      eventType:
        dto.role && dto.role !== user.role
          ? AuditEventType.ROLE_CHANGED
          : AuditEventType.USER_ACCOUNT_UPDATED,
      actorId: updatedBy,
      actorRole: UserRole.ADMIN,
      targetId: id,
      metadata: dto as any,
    });

    return updated;
  }

  /** Hard deletes the user. Handles FK constraints by nullifying references first. */
  async delete(id: string, deletedBy: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN) throw new BadRequestException('Cannot delete admin accounts');

    // Handle FK constraints in a transaction before deleting the user
    await this.prisma.$transaction(async (tx) => {
      // Revoke all tokens
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: id } });

      // Nullify projects this user submitted (preserve project history, just remove agent link)
      await tx.project.updateMany({
        where: { bdAgentId: id },
        data: { bdAgentId: id }, // can't nullify — bdAgentId is required; reassign to admin instead
      });

      // Find admin to reassign BD projects
      const admin = await tx.user.findFirst({ where: { role: UserRole.ADMIN } });
      if (admin) {
        await tx.project.updateMany({
          where: { bdAgentId: id },
          data: { bdAgentId: admin.id },
        });
        // Unassign engineer projects
        await tx.project.updateMany({
          where: { assignedTo: id },
          data: { assignedTo: null },
        });
      }

      // Remove project status history entries made by this user
      await tx.projectStatusHistory.deleteMany({ where: { changedBy: id } });

      // Delete deliverables uploaded by this engineer
      await tx.deliverable.deleteMany({ where: { engineerId: id } });

      // Delete notifications
      await tx.notification.deleteMany({ where: { userId: id } });

      // Nullify audit log actor references — cast to text to avoid uuid type mismatch
      await tx.$executeRawUnsafe(
        `UPDATE audit_log SET actor_id = NULL WHERE actor_id = '${id}'`
      );

      // Now delete the user
      await tx.user.delete({ where: { id } });
    });

    this.audit.log({
      eventType: AuditEventType.USER_ACCOUNT_DELETED,
      actorId: deletedBy,
      actorRole: UserRole.ADMIN,
      targetId: id,
      metadata: { email: user.email, role: user.role },
    });

    return { success: true };
  }

  /**
   * Employees can update their own display name and/or password.
   * Requires current password if changing password.
   */
  async updateProfile(
    id: string,
    dto: { fullName?: string; currentPassword?: string; newPassword?: string },
    requesterId: string,
  ) {
    if (id !== requesterId) throw new UnauthorizedException('Cannot update another user\'s profile');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.isActive) throw new NotFoundException('User not found');

    const data: any = {};

    if (dto.fullName && dto.fullName.trim()) {
      data.fullName = dto.fullName.trim();
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) throw new BadRequestException('Current password is required');
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Current password is incorrect');
      if (dto.newPassword.length < 8) throw new BadRequestException('New password must be at least 8 characters');
      data.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    }

    if (Object.keys(data).length === 0) throw new BadRequestException('No changes provided');

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, fullName: true, email: true, role: true },
    });

    this.audit.log({
      eventType: AuditEventType.USER_ACCOUNT_UPDATED,
      actorId: requesterId,
      actorRole: user.role,
      targetId: id,
      metadata: { changedFields: Object.keys(data).filter(k => k !== 'passwordHash') },
    });

    return updated;
  }

  /** Checks if a user with pendingSetup=true exists for the given email. */
  async verifyEmailForSetup(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.pendingSetup) return { exists: false };
    return { exists: true, userId: user.id, fullName: user.fullName };
  }

  /** Completes account setup: sets password, clears pendingSetup, returns tokens. */
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

    return { success: true };
  }

  async deactivate(id: string, deactivatedBy: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isActive: false } }),
      this.prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } }),
    ]);

    this.audit.log({
      eventType: AuditEventType.USER_ACCOUNT_DEACTIVATED,
      actorId: deactivatedBy,
      actorRole: UserRole.ADMIN,
      targetId: id,
    });

    return { success: true };
  }

  async triggerPasswordReset(id: string, triggeredBy: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: { userId: id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const resetUrl = `${this.config.get<string>('APP_BASE_URL')}/reset-password?token=${rawToken}`;

    await this.emailService.send({
      to: user.email,
      subject: 'Password Reset',
      text: `Reset your password:\n${resetUrl}\n\nExpires in 60 minutes.\n\nIf you didn't request this, contact your administrator.`,
    });

    return { success: true };
  }
}
