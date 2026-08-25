import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { AuditEventType, UserRole } from '@prisma/client';
import { CreateRfiDto, AnswerRfiDto } from './dto/create-rfi.dto';

@Injectable()
export class RfisService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  async create(projectId: string, dto: CreateRfiDto, engineerId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { assignedEngineer: { select: { fullName: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.assignedTo !== engineerId) {
      throw new ForbiddenException('Only the assigned engineer can raise an RFI for this project');
    }

    const rfi = await this.prisma.projectRfi.create({
      data: {
        projectId,
        engineerId,
        title: dto.title,
        question: dto.question,
        attachmentName: dto.attachmentName || null,
        attachmentS3Key: dto.attachmentS3Key || null,
        status: 'pending',
      },
    });

    this.audit.log({
      eventType: AuditEventType.RFI_CREATED,
      actorId: engineerId,
      actorRole: UserRole.ESTIMATION_ENGINEER,
      targetId: projectId,
      metadata: { rfiId: rfi.id, title: dto.title },
    });

    await this.notifications.notifyAdmin('RFI_CREATED', {
      title: `New RFI: ${project.referenceNumber}`,
      body: `Engineer ${project.assignedEngineer?.fullName || 'Engineer'} raised an RFI: "${dto.title}"`,
      metadata: { projectId, rfiId: rfi.id, referenceNumber: project.referenceNumber },
    });

    // Send email alert to admin
    const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'georgeadam2492@gmail.com';
    this.emailService.send({
      to: adminEmail,
      subject: `❓ New Engineering RFI: ${project.referenceNumber} — ${dto.title}`,
      text: `Hello Administrator,\n\nAssigned Engineer ${project.assignedEngineer?.fullName || 'Engineer'} has raised a Request for Information (RFI) for project ${project.referenceNumber} (${project.clientCompanyName || project.clientName}).\n\nRFI Subject: ${dto.title}\n\nQuestion / Clarification Details:\n${dto.question}\n\nSupporting Document: ${dto.attachmentName || 'None'}\n\nPlease review this in the admin portal to answer directly or forward to the client:\nhttp://localhost:3000/admin/projects/${projectId}\n\nACE Services Portal System`,
    }).catch((err) => {
      console.error('[RfisService] Failed to send admin RFI email:', err);
    });

    return rfi;
  }

  async findByProject(projectId: string) {
    return this.prisma.projectRfi.findMany({
      where: { projectId },
      include: { engineer: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async answerRfi(projectId: string, rfiId: string, dto: AnswerRfiDto, adminId: string) {
    const rfi = await this.prisma.projectRfi.findUnique({
      where: { id: rfiId },
      include: { project: true, engineer: true },
    });
    if (!rfi || rfi.projectId !== projectId) throw new NotFoundException('RFI not found');

    const updated = await this.prisma.projectRfi.update({
      where: { id: rfiId },
      data: {
        adminAnswer: dto.adminAnswer,
        status: 'answered',
      },
    });

    this.audit.log({
      eventType: AuditEventType.RFI_ANSWERED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: projectId,
      metadata: { rfiId, title: rfi.title },
    });

    await this.notifications.notifyUser(rfi.engineerId, 'RFI_ANSWERED', {
      title: `RFI Answered: ${rfi.project.referenceNumber}`,
      body: `Administrator answered your RFI "${rfi.title}".`,
      metadata: { projectId, rfiId },
    });

    return updated;
  }

  async forwardToClient(projectId: string, rfiId: string, adminId: string) {
    const rfi = await this.prisma.projectRfi.findUnique({
      where: { id: rfiId },
      include: { project: true, engineer: true },
    });
    if (!rfi || rfi.projectId !== projectId) throw new NotFoundException('RFI not found');

    const clientEmail = rfi.project.clientEmail;
    if (!clientEmail) throw new BadRequestException('Client email not set on this project');

    // Dispatch email to client
    const emailResult = await this.emailService.send({
      to: clientEmail,
      subject: `Inquiry / Request for Information regarding Project ${rfi.project.referenceNumber}`,
      text: `Dear ${rfi.project.clientContactPerson || rfi.project.clientCompanyName || 'Valued Client'},\n\nOur engineering team is currently working on your project (${rfi.project.referenceNumber} — ${rfi.project.scopeDescription.slice(0, 100)}).\n\nTo ensure complete accuracy in our takeoffs and drawings, we kindly request clarification on the following:\n\nSubject: ${rfi.title}\n\nDetails:\n${rfi.question}\n\nPlease reply directly to this email with any additional details or amended plans.\n\nThank you,\nACE Services Project Team`,
    });

    const updated = await this.prisma.projectRfi.update({
      where: { id: rfiId },
      data: {
        forwardedToClient: true,
        forwardedAt: new Date(),
        status: 'forwarded_to_client',
      },
    });

    this.audit.log({
      eventType: AuditEventType.RFI_FORWARDED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: projectId,
      metadata: { rfiId, clientEmail, title: rfi.title },
    });

    return { success: true, forwardedTo: clientEmail, rfi: updated };
  }
}
