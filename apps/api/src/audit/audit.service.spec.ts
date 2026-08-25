import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEventType, UserRole } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('log', () => {
    it('should create an audit log entry in fire-and-forget mode', () => {
      service.log({
        eventType: AuditEventType.PROJECT_SUBMITTED,
        actorId: 'user-1',
        actorRole: UserRole.BD_AGENT,
        targetId: 'project-100',
        metadata: { name: 'Test Project' },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          eventType: AuditEventType.PROJECT_SUBMITTED,
          actorId: 'user-1',
          actorRole: UserRole.BD_AGENT,
          targetId: 'project-100',
          metadata: { name: 'Test Project' },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const mockLog = {
        id: 'audit-1',
        eventType: AuditEventType.PROJECT_SUBMITTED,
        actorId: 'user-1',
        occurredAt: new Date(),
        actor: { fullName: 'John Agent', email: 'john@example.com' },
      };

      prisma.auditLog.findMany.mockResolvedValue([mockLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({
        eventType: AuditEventType.PROJECT_SUBMITTED,
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: [mockLog],
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { eventType: AuditEventType.PROJECT_SUBMITTED },
        orderBy: { occurredAt: 'desc' },
        skip: 0,
        take: 10,
        include: { actor: { select: { fullName: true, email: true } } },
      });
    });
  });
});
