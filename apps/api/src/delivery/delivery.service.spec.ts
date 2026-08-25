import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FilesService } from '../files/files.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectStatus, AuditEventType } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let prisma: any;
  let audit: any;
  let files: any;
  let config: any;
  let emailService: any;
  let notifications: any;

  const mockProject = {
    id: 'project-1',
    referenceNumber: 'ACE-2026-001',
    clientEmail: 'client@example.com',
    clientName: 'Client Inc',
    clientCompanyName: 'Client Inc',
    clientContactPerson: 'John Smith',
    scopeDescription: 'CAD Drafting Scope',
    projectType: 'design_drafting',
    status: ProjectStatus.delivered,
    decidedPrice: 500,
    merchantFeePercent: 3,
    merchantFeeAmount: 15,
    deliverables: [
      { id: 'del-1', originalName: 'plan.pdf', s3Key: 'keys/plan.pdf', sizeBytes: 1024, mimeType: 'application/pdf' },
    ],
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      clientDeliveryLog: {
        create: jest.fn(),
      },
      projectStatusHistory: {
        create: jest.fn(),
      },
    };

    audit = { log: jest.fn() };
    files = {
      getDeliverableStream: jest.fn(),
      getSignedUrlForDelivery: jest.fn(),
    };
    config = {
      get: jest.fn((key) => {
        if (key === 'COMPANY_NAME') return 'ACE SERVICES';
        return null;
      }),
    };
    emailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
    };
    notifications = {
      notifyAdmin: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: FilesService, useValue: files },
        { provide: ConfigService, useValue: config },
        { provide: EmailService, useValue: emailService },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  describe('getPreview', () => {
    it('should throw NotFoundException if project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.getPreview('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if project status is not delivered', async () => {
      prisma.project.findUnique.mockResolvedValue({ ...mockProject, status: ProjectStatus.in_progress });
      await expect(service.getPreview(mockProject.id)).rejects.toThrow(BadRequestException);
    });

    it('should return invoice preview for delivered project', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      const preview = await service.getPreview(mockProject.id);

      expect(preview.to).toBe('client@example.com');
      expect(preview.totalPrice).toBe(515);
      expect(preview.deliveryMethod).toBe('attachment');
    });
  });

  describe('sendToClient', () => {
    it('should send email with link delivery when requested', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      files.getSignedUrlForDelivery.mockResolvedValue('https://s3.aws.com/signed-url');

      const result = await service.sendToClient(
        mockProject.id,
        {
          subject: 'Your Deliverables',
          body: 'Here are your files.',
          deliveryMethod: 'link',
        },
        'admin-id',
      );

      expect(result).toEqual({ success: true, sentTo: 'client@example.com' });
      expect(emailService.send).toHaveBeenCalled();
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: { status: ProjectStatus.sent_to_client },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: AuditEventType.SEND_TO_CLIENT_SUCCESS }),
      );
    });
  });

  describe('handleResendWebhook', () => {
    it('should log audit event and notify admin on webhook', async () => {
      const payload = { type: 'email.delivered', data: { id: 'email-123', to: 'client@example.com' } };
      const result = await service.handleResendWebhook(payload);

      expect(result).toEqual({ received: true });
      expect(notifications.notifyAdmin).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalled();
    });
  });
});
