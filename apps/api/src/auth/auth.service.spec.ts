import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserRole, AuditEventType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  $transaction: jest.fn((ops) => (Array.isArray(ops) ? Promise.all(ops) : ops(mockPrisma))),
};

const mockJwt = { sign: jest.fn(() => 'signed-token'), verify: jest.fn() };
const mockConfig = { get: jest.fn((key: string) => {
  const cfg: Record<string, string> = {
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    APP_BASE_URL: 'http://localhost:3000',
    ADMIN_EMAIL: 'admin@portal.com',
  };
  return cfg[key] ?? '';
})};
const mockAudit = { log: jest.fn() };

const makeUser = (overrides: Partial<any> = {}) => ({
  id: 'user-uuid',
  email: 'user@test.com',
  passwordHash: '',
  role: UserRole.BD_AGENT,
  isActive: true,
  pendingSetup: false,
  lockoutUntil: null,
  failedLogins: 0,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditService, useValue: mockAudit },
        { provide: EmailService, useValue: { send: jest.fn().mockResolvedValue({ success: true }) } },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('throws UnauthorizedException when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('x@y.com', 'pass')).rejects.toThrow(UnauthorizedException);
    expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({
      eventType: AuditEventType.USER_LOGIN_FAILURE,
    }));
  });

  it('throws UnauthorizedException when user is inactive', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ isActive: false }));
    await expect(service.login('x@y.com', 'pass')).rejects.toThrow(UnauthorizedException);
  });

  it('throws ForbiddenException when account is locked', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(
      makeUser({ lockoutUntil: new Date(Date.now() + 60_000) }),
    );
    await expect(service.login('x@y.com', 'pass')).rejects.toThrow(ForbiddenException);
  });

  it('throws UnauthorizedException on wrong password and increments counter', async () => {
    const hash = await bcrypt.hash('correct', 12);
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: hash }));
    mockPrisma.user.update.mockResolvedValue({});

    await expect(service.login('x@y.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failedLogins: 1 }) }),
    );
  });

  it('locks account after 5 failed login attempts', async () => {
    const hash = await bcrypt.hash('correct', 12);
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: hash, failedLogins: 4 }));
    mockPrisma.user.update.mockResolvedValue({});

    await expect(service.login('x@y.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockoutUntil: expect.any(Date), failedLogins: 0 }),
      }),
    );
  });

  it('returns accessToken and refreshToken on successful login (non-admin)', async () => {
    const hash = await bcrypt.hash('pass', 12);
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: hash }));
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const result = await service.login('x@y.com', 'pass') as any;
    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBeDefined();
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AuditEventType.USER_LOGIN_SUCCESS }),
    );
  });

  it('allows admin users to log in without a second-factor gate in the current app', async () => {
    const hash = await bcrypt.hash('pass', 12);
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: hash, role: UserRole.ADMIN }));
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const result = await service.login('admin@test.com', 'pass') as any;
    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBeDefined();
  });

  it('produces a consistent SHA-256 hash', () => {
    const h1 = service.hashToken('abc');
    const h2 = service.hashToken('abc');
    const h3 = service.hashToken('xyz');
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).toHaveLength(64);
  });

  it('throws UnauthorizedException when refresh token not found', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
    await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when refresh token is revoked', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      revoked: true,
      expiresAt: new Date(Date.now() + 60_000),
      user: makeUser(),
    });
    await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when refresh token is expired', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      revoked: false,
      expiresAt: new Date(Date.now() - 1000),
      user: makeUser(),
    });
    await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
  });

  it('issues new tokens on valid refresh and revokes old token', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-id',
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user: makeUser(),
    });
    mockPrisma.refreshToken.update.mockResolvedValue({});
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const result = await service.refresh('valid-token') as any;
    expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { revoked: true } }),
    );
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});
