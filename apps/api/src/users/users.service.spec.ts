import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { UserRole, AuditEventType } from '@prisma/client';
import { NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let audit: any;
  let emailService: any;
  let config: any;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: UserRole.ESTIMATION_ENGINEER,
    isActive: true,
    pendingSetup: false,
    passwordHash: 'hashedpassword',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      project: {
        updateMany: jest.fn(),
      },
      projectStatusHistory: {
        deleteMany: jest.fn(),
      },
      deliverable: {
        deleteMany: jest.fn(),
      },
      notification: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callbackOrArray) => {
        if (typeof callbackOrArray === 'function') {
          return callbackOrArray(prisma);
        }
        return Promise.all(callbackOrArray);
      }),
      $executeRawUnsafe: jest.fn(),
    };

    audit = {
      log: jest.fn(),
    };

    emailService = {
      send: jest.fn().mockResolvedValue(true),
    };

    config = {
      get: jest.fn((key: string) => {
        if (key === 'APP_BASE_URL') return 'http://localhost:3000';
        if (key === 'COMPANY_NAME') return 'ACE SERVICES';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: EmailService, useValue: emailService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return paginated users list', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll(UserRole.ESTIMATION_ENGINEER, 1, 10);
      expect(result).toEqual({
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: UserRole.ESTIMATION_ENGINEER },
        select: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findEngineers', () => {
    it('should return estimation engineers when type is estimation', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      const result = await service.findEngineers('estimation');
      expect(result).toEqual([mockUser]);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: [UserRole.ESTIMATION_ENGINEER] }, isActive: true },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should throw ConflictException if user already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        service.create(
          { fullName: 'Jane', email: 'john@example.com', role: UserRole.BD_AGENT },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new user and send activation email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-id',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        role: UserRole.BD_AGENT,
        createdAt: new Date(),
      });
      prisma.passwordResetToken.create.mockResolvedValue({});

      const result = await service.create(
        { fullName: 'Jane Doe', email: 'jane@example.com', role: UserRole.BD_AGENT },
        'admin-id',
      );

      expect(result.id).toBe('new-id');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.USER_ACCOUNT_CREATED,
          actorId: 'admin-id',
        }),
      );
      expect(emailService.send).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update('invalid-id', { fullName: 'Test' }, 'admin-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update user and log audit', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, fullName: 'Updated Name' });

      const result = await service.update(mockUser.id, { fullName: 'Updated Name' }, 'admin-id');
      expect(result.fullName).toBe('Updated Name');
      expect(audit.log).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate user and revoke refresh tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.updateMany.mockResolvedValue({});

      const result = await service.deactivate(mockUser.id, 'admin-id');
      expect(result).toEqual({ success: true });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.USER_ACCOUNT_DEACTIVATED,
        }),
      );
    });
  });

  describe('verifyEmailForSetup', () => {
    it('should return exists: true if pending setup', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, pendingSetup: true });
      const result = await service.verifyEmailForSetup('john@example.com');
      expect(result).toEqual({
        exists: true,
        userId: mockUser.id,
        fullName: mockUser.fullName,
      });
    });

    it('should return exists: false if user does not exist or setup already completed', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser); // pendingSetup is false
      const result = await service.verifyEmailForSetup('john@example.com');
      expect(result).toEqual({ exists: false });
    });
  });

  describe('completeSetup', () => {
    it('should update password and clear pending setup', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, pendingSetup: true });
      prisma.user.update.mockResolvedValue({});

      const result = await service.completeSetup('john@example.com', 'newPassword123');
      expect(result).toEqual({ success: true });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({ pendingSetup: false }),
      });
    });

    it('should throw BadRequestException for short password', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, pendingSetup: true });
      await expect(service.completeSetup('john@example.com', 'short')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
