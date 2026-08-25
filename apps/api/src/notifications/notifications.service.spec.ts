import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    eventType: 'PROJECT_ASSIGNED',
    title: 'New Project Assigned',
    body: 'You have been assigned to project ACE-101',
    metadata: {},
    read: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      withRlsContext: jest.fn((userId, role, callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('notifyUser', () => {
    it('should create and store notification in database', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.notifyUser('user-1', 'PROJECT_ASSIGNED', {
        title: 'New Project Assigned',
        body: 'You have been assigned to project ACE-101',
      });

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          eventType: 'PROJECT_ASSIGNED',
          title: 'New Project Assigned',
          body: 'You have been assigned to project ACE-101',
          metadata: {},
        },
      });
    });

    it('should trigger gateway if set', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);
      const mockGateway = { sendToUser: jest.fn() };
      service.setGateway(mockGateway);

      await service.notifyUser('user-1', 'PROJECT_ASSIGNED', {
        title: 'Test',
        body: 'Test body',
      });

      expect(mockGateway.sendToUser).toHaveBeenCalledWith('user-1', mockNotification);
    });
  });

  describe('notifyAdmin', () => {
    it('should find admin and send notification', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'admin-id' });
      prisma.notification.create.mockResolvedValue({ ...mockNotification, userId: 'admin-id' });

      await service.notifyAdmin('SYSTEM_ALERT', { title: 'Alert', body: 'System check' });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      });
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  describe('findForUser', () => {
    it('should return paginated notifications for user', async () => {
      prisma.notification.findMany.mockResolvedValue([mockNotification]);
      prisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const result = await service.findForUser('user-1', UserRole.ESTIMATION_ENGINEER, 1, 10);

      expect(result).toEqual({
        data: [mockNotification],
        total: 1,
        unreadCount: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('markRead', () => {
    it('should update read status of a notification', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markRead('notif-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { read: true },
      });
    });
  });

  describe('markAllRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllRead('user-1');

      expect(result).toEqual({ success: true });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      });
    });
  });
});
