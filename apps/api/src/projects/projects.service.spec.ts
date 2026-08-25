import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserRole, ProjectStatus } from '@prisma/client';

const makeMockPrisma = () => ({
  project: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  projectStatusHistory: { create: jest.fn() },
  user: { findUnique: jest.fn() },
  $transaction: jest.fn((op: any) => Promise.resolve(op(makeMockPrisma()))),
  $queryRaw: jest.fn().mockResolvedValue([{ nextval: 1n }]),
  $executeRawUnsafe: jest.fn().mockResolvedValue(null),
});

const mockAudit = { log: jest.fn() };
const mockNotifications = { notifyUser: jest.fn(), notifyAdmin: jest.fn() };

const adminUser = { sub: 'admin-id', role: UserRole.ADMIN };
const bdUser = { sub: 'bd-id', role: UserRole.BD_AGENT };
const engUser = { sub: 'eng-id', role: UserRole.ESTIMATION_ENGINEER };

const makeProject = (overrides: Partial<any> = {}) => ({
  id: 'proj-id',
  referenceNumber: 'PRJ-2026-0001',
  bdAgentId: 'bd-id',
  assignedTo: null,
  status: ProjectStatus.received,
  clientCompanyName: 'ACME Corp',
  clientContactPerson: 'Jane Manager',
  clientName: 'ACME Corp',
  clientEmail: 'client@acme.com',
  clientPhone: '+1-555-0000',
  scopeDescription: 'Build a house',
  requestedDeadline: new Date('2026-12-01'),
  submittedAt: new Date(),
  internalDeadline: null,
  priority: null,
  adminInstructions: null,
  projectType: 'estimation',
  bdAgent: { fullName: 'BD Bob' },
  assignedEngineer: null,
  files: [],
  deliverables: [],
  rfis: [],
  statusHistory: [],
  ...overrides,
});

describe('ProjectsService — access control', () => {
  let service: ProjectsService;
  let prisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = makeMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: EmailService, useValue: { send: jest.fn().mockResolvedValue({ success: true }) } },
        { provide: ConfigService, useValue: { get: jest.fn((key: string) => ({ APP_BASE_URL: 'http://localhost:3000', ADMIN_EMAIL: 'admin@portal.com' }[key])) } },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('throws ForbiddenException when a BD agent requests another BD agent\'s project', async () => {
    prisma.project.findUnique.mockResolvedValue(makeProject({ bdAgentId: 'other-bd-id' }));

    await expect(service.findOne('proj-id', bdUser)).rejects.toThrow(ForbiddenException);
  });

  it('returns the current project for the owning BD agent', async () => {
    prisma.project.findUnique.mockResolvedValue(makeProject({ bdAgentId: 'bd-id', status: ProjectStatus.delivered }));

    const result: any = await service.findOne('proj-id', bdUser);
    expect(result.status).toBe(ProjectStatus.delivered);
    expect(result.clientEmail).toBe('client@acme.com');
  });

  it('throws ForbiddenException when an engineer requests a project assigned to someone else', async () => {
    prisma.project.findUnique.mockResolvedValue(makeProject({ assignedTo: 'other-eng-id' }));

    await expect(service.findOne('proj-id', engUser)).rejects.toThrow(ForbiddenException);
  });

  it('returns an engineer-scoped view without client identifiers', async () => {
    prisma.project.findUnique.mockResolvedValue(makeProject({ assignedTo: 'eng-id', status: ProjectStatus.assigned }));

    const result: any = await service.findOne('proj-id', engUser);
    expect(result).not.toHaveProperty('clientName');
    expect(result).not.toHaveProperty('clientEmail');
    expect(result).not.toHaveProperty('clientPhone');
    expect(result.scopeDescription).toBe('Build a house');
  });

  it('returns the full project view for admins', async () => {
    prisma.project.findUnique.mockResolvedValue(makeProject({ assignedTo: 'eng-id' }));

    const result: any = await service.findOne('proj-id', adminUser);
    expect(result.clientName).toBe('ACME Corp');
    expect(result.clientEmail).toBe('client@acme.com');
    expect(result.clientPhone).toBe('+1-555-0000');
    expect(result.bdAgentName).toBe('BD Bob');
  });

  it('throws BadRequestException when engineerId belongs to a non-engineer', async () => {
    prisma.project.findUnique.mockResolvedValue(makeProject());
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      role: UserRole.ADMIN,
      isActive: true,
      fullName: 'Admin User',
      email: 'admin@test.com',
    });

    await expect(
      service.assign('proj-id', {
        engineerId: 'admin-id',
        internalDeadline: '2026-12-01',
        priority: 'high' as any,
        projectType: 'estimation',
      }, 'admin-id'),
    ).rejects.toThrow(BadRequestException);
  });

  it('records assignment and notifies engineer on success', async () => {
    const project = makeProject();
    prisma.project.findUnique.mockResolvedValue(project);
    prisma.user.findUnique.mockResolvedValue({
      id: 'eng-id',
      role: UserRole.ESTIMATION_ENGINEER,
      isActive: true,
      fullName: 'Engineer One',
      email: 'engineer@test.com',
    });
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
    prisma.project.update.mockResolvedValue({});
    prisma.projectStatusHistory.create.mockResolvedValue({});

    await service.assign('proj-id', {
      engineerId: 'eng-id',
      internalDeadline: '2026-12-01',
      priority: 'high' as any,
      projectType: 'estimation',
    }, 'admin-id');

    expect(mockNotifications.notifyUser).toHaveBeenCalledWith(
      'eng-id',
      'PROJECT_ASSIGNED',
      expect.any(Object),
    );
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'PROJECT_ASSIGNED' }),
    );
  });
});
