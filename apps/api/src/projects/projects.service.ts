import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { EmailTriggersService } from '../email/email.triggers.service';
import { ConfigService } from '@nestjs/config';
import { AuditEventType, ProjectStatus, UserRole } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { CreateProjectDto } from './dto/create-project.dto';
import { AssignProjectDto } from './dto/assign-project.dto';
import { UpdateProjectStatusDto, UpdateMerchantFeeDto } from './dto/update-status.dto';

@Injectable()
export class ProjectsService {
  private logger = new Logger('ProjectsService');

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private emailService: EmailService,
    private emailTriggers: EmailTriggersService,
    private config: ConfigService,
  ) {}

  async create(dto: CreateProjectDto, bdAgentId: string) {
    const referenceNumber = await this.generateReferenceNumber();
    const clientCompanyName = dto.clientCompanyName || dto.clientName || 'Client Company';
    const clientContactPerson = dto.clientContactPerson || 'Primary Contact';
    const clientName = `${clientCompanyName} (${clientContactPerson})`;
    const decidedPrice = dto.decidedPrice ? Number(dto.decidedPrice) : null;
    const projectType = dto.projectType || 'estimation';

    const project = await this.prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          referenceNumber,
          bdAgentId,
          clientCompanyName,
          clientContactPerson,
          salespersonName: dto.salespersonName || null,
          decidedPrice,
          totalPrice: decidedPrice,
          clientName,
          clientEmail: dto.clientEmail,
          clientPhone: dto.clientPhone,
          scopeDescription: dto.scopeDescription,
          requestedDeadline: new Date(dto.requestedDeadline),
          projectType,
          status: ProjectStatus.received,
        },
      });
      await tx.projectStatusHistory.create({
        data: {
          projectId: p.id,
          fromStatus: null,
          toStatus: ProjectStatus.received,
          changedBy: bdAgentId,
        },
      });
      return p;
    });

    this.audit.log({
      eventType: AuditEventType.PROJECT_SUBMITTED,
      actorId: bdAgentId,
      actorRole: UserRole.BD_AGENT,
      targetId: project.id,
      metadata: { referenceNumber, clientCompanyName, decidedPrice, salespersonName: dto.salespersonName },
    });

    await this.notifications.notifyAdmin('PROJECT_SUBMITTED', {
      title: 'New Project Submitted',
      body: `Project ${referenceNumber} (${clientCompanyName}) has been submitted. Price: $${decidedPrice || 0}.`,
      metadata: { projectId: project.id, referenceNumber },
    });

    // Real-time email notification to Admin owner
    const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'georgeadam2492@gmail.com';
    const bdAgent = await this.prisma.user.findUnique({ where: { id: bdAgentId }, select: { fullName: true, email: true } });
    this.emailService.send({
      to: adminEmail,
      subject: `🚀 New Project Uploaded: ${referenceNumber} — ${clientCompanyName}`,
      text: `Hello Administrator,\n\nA new client project has just been uploaded by BD Agent ${bdAgent?.fullName || 'BD Agent'} (${bdAgent?.email || ''}).\n\nProject Details:\n- Reference: ${referenceNumber}\n- Company: ${clientCompanyName}\n- Contact Person: ${clientContactPerson}\n- Salesperson: ${dto.salespersonName || 'N/A'}\n- Decided Price: $${decidedPrice ? decidedPrice.toFixed(2) : '0.00'}\n- Department: ${projectType === 'design_drafting' ? 'Design & Drafting' : 'Cost Estimation'}\n- Client Email: ${dto.clientEmail}\n- Client Phone: ${dto.clientPhone}\n- Requested Deadline: ${new Date(dto.requestedDeadline).toLocaleDateString()}\n\nScope Description:\n${dto.scopeDescription}\n\nPlease log in to the portal to review drawings and assign to an engineer:\nhttp://localhost:3000/admin/dashboard\n\nACE Services Portal Management System`,
    }).catch((err) => {
      console.error('[ProjectsService] Failed to send admin email notification:', err);
    });

    // Trigger email: Project Submitted
    this.emailTriggers.triggerProjectSubmitted({
      projectId: project.id,
      projectName: referenceNumber,
      clientName: clientCompanyName,
      submittedBy: bdAgent?.fullName || 'BD Agent',
      fileCount: 0,
      time: new Date().toLocaleString(),
      supportEmail: adminEmail,
      recipients: [adminEmail],
    }).catch((err) => {
      this.logger.warn('Failed to send project submitted email', err);
    });

    return project;
  }

  async createAsAdmin(dto: CreateProjectDto, adminId: string) {
    // Similar to create() but marked as admin-created
    const referenceNumber = dto.referenceNumber || (await this.generateReferenceNumber());
    const clientCompanyName = dto.clientCompanyName || dto.clientName || 'Client Company';
    const clientContactPerson = dto.clientContactPerson || 'Primary Contact';
    const clientName = `${clientCompanyName} (${clientContactPerson})`;
    const decidedPrice = dto.decidedPrice ? Number(dto.decidedPrice) : null;
    const projectType = dto.projectType || 'estimation';

    const project = await this.prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          referenceNumber,
          bdAgentId: adminId, // Admin is the creator
          clientCompanyName,
          clientContactPerson,
          salespersonName: dto.salespersonName || null,
          decidedPrice,
          totalPrice: decidedPrice,
          clientName,
          clientEmail: dto.clientEmail,
          clientPhone: dto.clientPhone,
          scopeDescription: dto.scopeDescription,
          requestedDeadline: new Date(dto.requestedDeadline),
          projectType,
          status: ProjectStatus.received,
        },
      });
      await tx.projectStatusHistory.create({
        data: {
          projectId: p.id,
          fromStatus: null,
          toStatus: ProjectStatus.received,
          changedBy: adminId,
        },
      });
      return p;
    });

    this.audit.log({
      eventType: AuditEventType.PROJECT_SUBMITTED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: project.id,
      metadata: { referenceNumber, clientCompanyName, decidedPrice, salespersonName: dto.salespersonName },
    });

    await this.notifications.notifyAdmin('PROJECT_SUBMITTED', {
      title: 'New Project Created',
      body: `Project ${referenceNumber} (${clientCompanyName}) has been created by admin. Price: $${decidedPrice || 0}.`,
      metadata: { projectId: project.id, referenceNumber },
    });

    // Send email notification
    const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'georgeadam2492@gmail.com';
    const admin = await this.prisma.user.findUnique({ where: { id: adminId }, select: { fullName: true, email: true } });
    this.emailService.send({
      to: adminEmail,
      subject: `🚀 New Project Created: ${referenceNumber} — ${clientCompanyName}`,
      text: `Hello Administrator,\n\nA new client project has been created.\n\nProject Details:\n- Reference: ${referenceNumber}\n- Company: ${clientCompanyName}\n- Contact Person: ${clientContactPerson}\n- Salesperson: ${dto.salespersonName || 'N/A'}\n- Decided Price: $${decidedPrice ? decidedPrice.toFixed(2) : '0.00'}\n- Department: ${projectType === 'design_drafting' ? 'Design & Drafting' : 'Cost Estimation'}\n- Client Email: ${dto.clientEmail}\n- Client Phone: ${dto.clientPhone}\n- Requested Deadline: ${new Date(dto.requestedDeadline).toLocaleDateString()}\n\nScope Description:\n${dto.scopeDescription}\n\nPlease log in to the portal to review and assign to an engineer:\nhttp://localhost:3000/admin/dashboard\n\nACE Services Portal Management System`,
    }).catch((err) => {
      console.error('[ProjectsService] Failed to send admin email notification:', err);
    });

    return project;
  }

  async findByClient(clientCompanyName: string) {
    // Get all projects for a specific client company
    const projects = await this.prisma.project.findMany({
      where: {
        clientCompanyName: {
          contains: clientCompanyName,
          mode: 'insensitive',
        },
      },
      include: {
        files: true,
        assignedEngineer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return projects;
  }

  async findAll(user: { sub: string; role: UserRole }, filters: any) {
    const { status, engineerId, projectType, from, to, search, page = 1, limit = 100 } = filters;
    const safeLimit = Math.min(Number(limit), 200);
    const safePage = Math.max(Number(page), 1);

    let where: any = {};

    if (user.role === UserRole.BD_AGENT) {
      where.bdAgentId = user.sub;
    } else if (
      user.role === UserRole.ESTIMATION_ENGINEER ||
      user.role === UserRole.DESIGN_ENGINEER
    ) {
      where.assignedTo = user.sub;
    }
    // ADMIN: no user restriction

    if (status) where.status = status;
    if (engineerId && user.role === UserRole.ADMIN) where.assignedTo = engineerId;
    if (projectType) where.projectType = projectType;
    if (from || to) {
      where.submittedAt = {};
      if (from) where.submittedAt.gte = new Date(from as string);
      if (to) where.submittedAt.lte = new Date(to as string);
    }
    if (search) {
      where.OR = [
        { clientCompanyName: { contains: search, mode: 'insensitive' } },
        { clientContactPerson: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { salespersonName: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await this.prisma.withRlsContext(
      user.sub,
      user.role,
      async (tx) => {
        return Promise.all([
          tx.project.findMany({
            where,
            skip: (safePage - 1) * safeLimit,
            take: safeLimit,
            orderBy: { submittedAt: 'desc' },
            include: {
              bdAgent: { select: { fullName: true } },
              assignedEngineer: { select: { id: true, fullName: true, role: true } },
              files: {
                select: { id: true, originalName: true, sizeBytes: true, mimeType: true, category: true, uploadedBy: true },
              },
              deliverables: {
                select: { id: true, originalName: true, sizeBytes: true, mimeType: true, uploadedAt: true },
              },
              rfis: {
                select: { id: true, title: true, status: true, createdAt: true },
              },
            },
          }),
          tx.project.count({ where }),
        ]);
      },
    );

    return {
      data: projects.map((p: any) => this.toRoleView(p, user.role)),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async findOne(id: string, user: { sub: string; role: UserRole }) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        bdAgent: { select: { fullName: true, email: true } },
        assignedEngineer: { select: { id: true, fullName: true, role: true, email: true } },
        files: {
          select: { id: true, originalName: true, sizeBytes: true, mimeType: true, category: true, uploadedBy: true, uploadedAt: true },
        },
        deliverables: {
          select: {
            id: true,
            originalName: true,
            sizeBytes: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
        rfis: {
          include: { engineer: { select: { id: true, fullName: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: { orderBy: { changedAt: 'asc' } },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (user.role === UserRole.BD_AGENT && project.bdAgentId !== user.sub) {
      throw new ForbiddenException();
    }
    if (
      (user.role === UserRole.ESTIMATION_ENGINEER ||
        user.role === UserRole.DESIGN_ENGINEER) &&
      project.assignedTo !== user.sub
    ) {
      throw new ForbiddenException();
    }

    return this.toRoleView(project, user.role);
  }

  async updateStatus(projectId: string, dto: UpdateProjectStatusDto, user: { sub: string; role: UserRole }) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { bdAgent: { select: { email: true, fullName: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');

    if (user.role === UserRole.BD_AGENT && project.bdAgentId !== user.sub) {
      throw new ForbiddenException('Cannot update status of another agent\'s project');
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.followUpDate !== undefined) {
      updateData.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;
    }
    if (dto.followUpNotes !== undefined) {
      updateData.followUpNotes = dto.followUpNotes;
    }
    if (dto.decidedPrice !== undefined) {
      updateData.decidedPrice = Number(dto.decidedPrice);
      updateData.totalPrice = Number(dto.decidedPrice) + (Number(project.merchantFeeAmount) || 0);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.project.update({
        where: { id: projectId },
        data: updateData,
      });

      await tx.projectStatusHistory.create({
        data: {
          projectId,
          fromStatus: project.status,
          toStatus: dto.status,
          changedBy: user.sub,
          notes: dto.notes || (dto.followUpNotes ? `Follow-up: ${dto.followUpNotes}` : `Status updated to ${dto.status}`),
        },
      });

      return p;
    });

    this.audit.log({
      eventType: AuditEventType.PROJECT_STATUS_UPDATED,
      actorId: user.sub,
      actorRole: user.role,
      targetId: projectId,
      metadata: { fromStatus: project.status, toStatus: dto.status, followUpDate: dto.followUpDate },
    });

    // Trigger email: Project Status Changed
    this.emailTriggers.triggerProjectStatusChanged({
      projectId,
      projectName: project.referenceNumber,
      oldStatus: project.status,
      newStatus: dto.status,
      changedBy: user.sub,
      time: new Date().toLocaleString(),
      nextSteps: 'Your project status has been updated. Please log in to view details.',
      portalLink: `${this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000'}/projects/${projectId}`,
      recipients: [project.bdAgent?.email || 'admin@example.com'],
    }).catch((err) => {
      this.logger.warn('Failed to send project status changed email', err);
    });

    return updated;
  }

  async updateMerchantFee(projectId: string, dto: UpdateMerchantFeeDto, adminId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const basePrice = Number(project.decidedPrice) || 0;
    let feePercent = dto.merchantFeePercent !== undefined ? Number(dto.merchantFeePercent) : (Number(project.merchantFeePercent) || 0);
    let feeAmount = dto.merchantFeeAmount !== undefined ? Number(dto.merchantFeeAmount) : (basePrice * (feePercent / 100));
    
    if (dto.merchantFeePercent !== undefined && dto.merchantFeeAmount === undefined) {
      feeAmount = Number((basePrice * (feePercent / 100)).toFixed(2));
    }
    const totalPrice = Number((basePrice + feeAmount).toFixed(2));

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        merchantFeePercent: feePercent,
        merchantFeeAmount: feeAmount,
        totalPrice,
      },
    });

    return updated;
  }

  async deleteFile(projectId: string, fileId: string, user: { sub: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can remove project files');
    }

    const file = await this.prisma.projectFile.findUnique({ where: { id: fileId } });
    if (file && file.projectId === projectId) {
      await this.prisma.projectFile.delete({ where: { id: fileId } });
      return { success: true, deletedFile: file.originalName };
    }

    const deliverable = await this.prisma.deliverable.findUnique({ where: { id: fileId } });
    if (deliverable && deliverable.projectId === projectId) {
      await this.prisma.deliverable.delete({ where: { id: fileId } });
      return { success: true, deletedFile: deliverable.originalName };
    }

    throw new NotFoundException('File not found on project');
  }

  async assign(projectId: string, dto: AssignProjectDto, adminId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const engineer = await this.prisma.user.findUnique({
      where: { id: dto.engineerId },
      select: { id: true, fullName: true, email: true, role: true, isActive: true },
    });
    if (!engineer || !engineer.isActive)
      throw new BadRequestException('Engineer not found or inactive');

    const isEstimation = engineer.role === UserRole.ESTIMATION_ENGINEER;
    const isDesign = engineer.role === UserRole.DESIGN_ENGINEER;
    if (!isEstimation && !isDesign)
      throw new BadRequestException('Target user is not an engineer');

    const isReassignment = !!project.assignedTo;

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          assignedTo: dto.engineerId,
          status: ProjectStatus.assigned,
          internalDeadline: new Date(dto.internalDeadline),
          priority: dto.priority,
          adminInstructions: dto.adminInstructions ?? null,
          projectType: dto.projectType || project.projectType,
        },
      });
      await tx.projectStatusHistory.create({
        data: {
          projectId,
          fromStatus: project.status,
          toStatus: ProjectStatus.assigned,
          changedBy: adminId,
          notes: isReassignment
            ? `Reassigned to ${engineer.fullName}`
            : 'Initial assignment',
        },
      });
    });

    this.audit.log({
      eventType: isReassignment
        ? AuditEventType.PROJECT_REASSIGNED
        : AuditEventType.PROJECT_ASSIGNED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: projectId,
      metadata: { engineerId: dto.engineerId, isReassignment },
    });

    await this.notifications.notifyUser(dto.engineerId, 'PROJECT_ASSIGNED', {
      title: 'New Project Assigned',
      body: `Project ${project.referenceNumber} has been assigned to you. Deadline: ${dto.internalDeadline}.`,
      metadata: { projectId, referenceNumber: project.referenceNumber },
    });

    // Automated email dispatch to assigned engineer
    if (engineer && engineer.email) {
      const appBaseUrl = this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000';
      const workspaceUrl = `${appBaseUrl}/engineer/projects/${projectId}`;
      const internalDueDate = new Date(dto.internalDeadline).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      this.emailService.send({
        to: engineer.email,
        subject: `📐 New Assignment: ${project.referenceNumber} (${dto.projectType === 'design_drafting' ? 'CAD Design & Drafting' : 'Cost Estimation'})`,
        text: `Hello ${engineer.fullName},\n\nYou have been assigned a new project on the ACE Services Portal.\n\nAssignment Details:\n- Project Reference: ${project.referenceNumber}\n- Category: ${dto.projectType === 'design_drafting' ? 'CAD Design & Drafting' : 'Cost Estimation'}\n- Priority: ${String(dto.priority).toUpperCase()}\n- Internal Due Date: ${internalDueDate}\n\nScope of Work:\n${project.scopeDescription}\n\nAdmin Instructions:\n${dto.adminInstructions || 'None provided'}\n\nPlease click the direct link below to view client drawings, raise RFIs, and upload deliverables:\n${workspaceUrl}\n\nACE Services Engineering Production Desk`,
      }).catch((err) => {
        console.error('[ProjectsService] Failed to dispatch engineer notification email:', err);
      });

      // Trigger email: Project Assigned
      this.emailTriggers.triggerProjectAssigned({
        projectId,
        projectName: project.referenceNumber,
        engineerName: engineer.fullName,
        deadline: internalDueDate,
        clientName: project.clientCompanyName,
        clientEmail: project.clientEmail,
        fileCount: 0,
        portalLink: workspaceUrl,
        engineerEmail: engineer.email,
      }).catch((err) => {
        this.logger.warn('Failed to send project assigned email', err);
      });
    }

    return { success: true };
  }

  async markInProgress(projectId: string, engineerId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.assignedTo !== engineerId) throw new ForbiddenException();

    if (project.status === ProjectStatus.assigned) {
      await this.prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.in_progress },
        });
        await tx.projectStatusHistory.create({
          data: {
            projectId,
            fromStatus: ProjectStatus.assigned,
            toStatus: ProjectStatus.in_progress,
            changedBy: engineerId,
            notes: 'Engineer started work on takeoff/design',
          },
        });
      });
    }

    return { success: true };
  }

  async markDelivered(projectId: string, engineerId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { deliverables: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.assignedTo !== engineerId) throw new ForbiddenException();
    if (project.deliverables.length === 0) {
      throw new BadRequestException('Cannot mark delivered without uploading at least one deliverable file');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.delivered },
      });
      await tx.projectStatusHistory.create({
        data: {
          projectId,
          fromStatus: project.status,
          toStatus: ProjectStatus.delivered,
          changedBy: engineerId,
          notes: 'Engineer completed deliverables and marked ready for admin dispatch',
        },
      });
    });

    await this.notifications.notifyAdmin('PROJECT_DELIVERED', {
      title: 'Deliverables Ready for Review',
      body: `Engineer completed deliverables for project ${project.referenceNumber}. Ready for client dispatch.`,
      metadata: { projectId, referenceNumber: project.referenceNumber },
    });

    return { success: true };
  }

  async approveProject(projectId: string, adminId: string, notes?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { assignedEngineer: { select: { fullName: true, email: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.approved },
      });
      await tx.projectStatusHistory.create({
        data: {
          projectId,
          fromStatus: project.status,
          toStatus: ProjectStatus.approved,
          changedBy: adminId,
          notes: notes || 'Project deliverables approved by admin',
        },
      });
    });

    this.audit.log({
      eventType: AuditEventType.PROJECT_STATUS_UPDATED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: projectId,
      metadata: { action: 'APPROVED', notes },
    });

    // Trigger email: Project Approved
    this.emailTriggers.triggerProjectApproved({
      projectId,
      projectName: project.referenceNumber,
      approvedBy: 'Admin',
      time: new Date().toLocaleString(),
      nextSteps: 'Your project will be delivered to the client shortly',
      expectedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
      portalLink: `${this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000'}/engineer/projects/${projectId}`,
      recipients: [project.assignedEngineer?.email || 'engineer@example.com'],
    }).catch((err) => {
      this.logger.warn('Failed to send project approved email', err);
    });

    return { success: true };
  }

  async rejectProject(projectId: string, adminId: string, rejectionReason: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { assignedEngineer: { select: { fullName: true, email: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (!rejectionReason) throw new BadRequestException('Rejection reason is required');

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.declined },
      });
      await tx.projectStatusHistory.create({
        data: {
          projectId,
          fromStatus: project.status,
          toStatus: ProjectStatus.declined,
          changedBy: adminId,
          notes: `Rejected: ${rejectionReason}`,
        },
      });
    });

    this.audit.log({
      eventType: AuditEventType.PROJECT_STATUS_UPDATED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: projectId,
      metadata: { action: 'REJECTED', reason: rejectionReason },
    });

    // Trigger email: Project Rejected
    this.emailTriggers.triggerProjectRejected({
      projectId,
      projectName: project.referenceNumber,
      reason: rejectionReason,
      feedback: 'Please review the feedback and resubmit if necessary',
      supportEmail: this.config.get<string>('SUPPORT_EMAIL') || 'support@example.com',
      portalLink: `${this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000'}/engineer/projects/${projectId}`,
      recipients: [project.assignedEngineer?.email || 'engineer@example.com'],
    }).catch((err) => {
      this.logger.warn('Failed to send project rejected email', err);
    });

    return { success: true };
  }

  async completeProject(projectId: string, adminId: string, completionNotes?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { assignedEngineer: { select: { fullName: true, email: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.sent_to_client },
      });
      await tx.projectStatusHistory.create({
        data: {
          projectId,
          fromStatus: project.status,
          toStatus: ProjectStatus.sent_to_client,
          changedBy: adminId,
          notes: completionNotes || 'Project marked complete',
        },
      });
    });

    this.audit.log({
      eventType: AuditEventType.PROJECT_STATUS_UPDATED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: projectId,
      metadata: { action: 'COMPLETED', notes: completionNotes },
    });

    // Trigger email: Project Completed (sent to client)
    this.emailTriggers.triggerClientDelivery({
      projectId,
      projectName: project.referenceNumber,
      fileCount: 0,
      downloadLink: `${this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000'}/download/${projectId}`,
      expiresOn: new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString(),
      supportEmail: this.config.get<string>('SUPPORT_EMAIL') || 'support@example.com',
      clientEmail: project.clientEmail || '',
    }).catch((err) => {
      this.logger.warn('Failed to send project completed email', err);
    });

    return { success: true };
  }

  async getStatusHistory(projectId: string, user: { sub: string; role: UserRole }) {
    await this.findOne(projectId, user);
    return this.prisma.projectStatusHistory.findMany({
      where: { projectId },
      include: { changedByUser: { select: { fullName: true, role: true } } },
      orderBy: { changedAt: 'asc' },
    });
  }

  toRoleView(project: any, role: UserRole) {
    if (
      role === UserRole.ESTIMATION_ENGINEER ||
      role === UserRole.DESIGN_ENGINEER
    ) {
      // Department Privacy Invariant: Engineers NEVER see client email, phone, company, salesperson, or price
      const deadline = project.internalDeadline ? new Date(project.internalDeadline) : null;
      const now = new Date();
      const diffMs = deadline ? deadline.getTime() - now.getTime() : null;
      const days = diffMs !== null ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : null;
      const hours =
        diffMs !== null
          ? Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          : null;

      return {
        id: project.id,
        referenceNumber: project.referenceNumber,
        scopeDescription: project.scopeDescription,
        adminInstructions: project.adminInstructions,
        requestedDeadline: project.requestedDeadline,
        internalDeadline: project.internalDeadline,
        priority: project.priority,
        projectType: project.projectType || 'estimation',
        submittedAt: project.submittedAt,
        status: project.status,
        files: project.files ?? [],
        deliverables: project.deliverables ?? [],
        rfis: project.rfis ?? [],
        deadlineCountdown: deadline ? { days, hours } : null,
      };
    }

    if (role === UserRole.BD_AGENT) {
      return {
        id: project.id,
        referenceNumber: project.referenceNumber,
        clientCompanyName: project.clientCompanyName || project.clientName,
        clientContactPerson: project.clientContactPerson || '',
        salespersonName: project.salespersonName,
        decidedPrice: project.decidedPrice ? Number(project.decidedPrice) : null,
        merchantFeePercent: project.merchantFeePercent,
        merchantFeeAmount: project.merchantFeeAmount ? Number(project.merchantFeeAmount) : null,
        totalPrice: project.totalPrice ? Number(project.totalPrice) : (project.decidedPrice ? Number(project.decidedPrice) : null),
        clientName: project.clientName,
        clientEmail: project.clientEmail,
        clientPhone: project.clientPhone,
        scopeDescription: project.scopeDescription,
        requestedDeadline: project.requestedDeadline,
        submittedAt: project.submittedAt,
        status: project.status,
        followUpDate: project.followUpDate,
        followUpNotes: project.followUpNotes,
        assignedEngineer: project.assignedEngineer,
        internalDeadline: project.internalDeadline,
        priority: project.priority,
        projectType: project.projectType || 'estimation',
        files: project.files ?? [],
        deliverables: project.deliverables ?? [],
        rfis: project.rfis ?? [],
        statusHistory: project.statusHistory ?? [],
      };
    }

    // Admin: full view
    return {
      id: project.id,
      referenceNumber: project.referenceNumber,
      bdAgentName: project.bdAgent?.fullName,
      clientCompanyName: project.clientCompanyName || project.clientName,
      clientContactPerson: project.clientContactPerson || '',
      salespersonName: project.salespersonName,
      decidedPrice: project.decidedPrice ? Number(project.decidedPrice) : null,
      merchantFeePercent: project.merchantFeePercent,
      merchantFeeAmount: project.merchantFeeAmount ? Number(project.merchantFeeAmount) : null,
      totalPrice: project.totalPrice ? Number(project.totalPrice) : (project.decidedPrice ? Number(project.decidedPrice) : null),
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      scopeDescription: project.scopeDescription,
      requestedDeadline: project.requestedDeadline,
      submittedAt: project.submittedAt,
      status: project.status,
      followUpDate: project.followUpDate,
      followUpNotes: project.followUpNotes,
      assignedEngineer: project.assignedEngineer,
      internalDeadline: project.internalDeadline,
      priority: project.priority,
      adminInstructions: project.adminInstructions,
      projectType: project.projectType || 'estimation',
      invoice: project.invoice,
      statusHistory: project.statusHistory ?? [],
      files: project.files ?? [],
      deliverables: project.deliverables ?? [],
      rfis: project.rfis ?? [],
    };
  }

  private async generateReferenceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const seqName = `prj_seq_${year}`;
    const result = await this.prisma.$queryRaw<{ nextval: bigint }[]>`
      SELECT nextval(${seqName}::regclass) AS nextval
    `.catch(async () => {
      await this.prisma.$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1 INCREMENT 1 NO CYCLE`,
      );
      return this.prisma.$queryRaw<{ nextval: bigint }[]>`
        SELECT nextval(${seqName}::regclass) AS nextval
      `;
    });
    const n = Number(result[0].nextval);
    return `PRJ-${year}-${String(n).padStart(4, '0')}`;
  }

  async delete(id: string, adminId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.projectRfi.deleteMany({ where: { projectId: id } });
      await tx.clientDeliveryLog.deleteMany({ where: { projectId: id } });
      await tx.deliverable.deleteMany({ where: { projectId: id } });
      await tx.projectFile.deleteMany({ where: { projectId: id } });
      await tx.projectStatusHistory.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    });

    this.audit.log({
      eventType: AuditEventType.PROJECT_REASSIGNED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: id,
      metadata: { action: 'PROJECT_DELETED', referenceNumber: project.referenceNumber },
    });

    return { success: true, deletedReference: project.referenceNumber };
  }

  async exportWeeklyExcel(
    query: { range?: string; startDate?: string; endDate?: string; department?: string; status?: string },
    adminId: string,
  ) {
    const range = query.range || 'this_week';
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    let periodLabel = 'Current Week';

    if (query.startDate && query.endDate) {
      start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      periodLabel = `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
    } else if (range === 'this_week') {
      const dayOfWeek = now.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;
      start = new Date(now);
      start.setDate(now.getDate() - distanceToMonday);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      periodLabel = `This Week (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`;
    } else if (range === 'last_7_days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      periodLabel = `Last 7 Days (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`;
    } else if (range === 'last_week') {
      const dayOfWeek = now.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - distanceToMonday);
      thisMonday.setHours(0, 0, 0, 0);

      start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - 7);
      end = new Date(thisMonday);
      end.setDate(thisMonday.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      periodLabel = `Last Week (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`;
    } else if (range === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      periodLabel = `This Month (${now.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
    } else if (range === 'all') {
      start = null;
      end = null;
      periodLabel = 'All Time Archive';
    }

    const where: any = {};
    if (start && end) {
      where.submittedAt = { gte: start, lte: end };
    }
    if (query.department && query.department !== 'all') {
      where.projectType = query.department;
    }
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        bdAgent: { select: { fullName: true, email: true } },
        assignedEngineer: { select: { fullName: true, role: true, email: true } },
        files: { select: { id: true, originalName: true, sizeBytes: true, category: true, uploadedAt: true } },
        deliverables: { select: { id: true, originalName: true, sizeBytes: true, uploadedAt: true } },
        rfis: { select: { id: true, title: true, status: true, createdAt: true } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ACE Services Management Portal';
    workbook.lastModifiedBy = 'Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    // ──────────────────────────────────────────────────────────────────────────
    // Sheet 1: Weekly Projects Pipeline
    // ──────────────────────────────────────────────────────────────────────────
    const sheet1 = workbook.addWorksheet('Weekly Projects Pipeline', {
      views: [{ showGridLines: true }],
    });

    // Sheet 1 Title Banner
    sheet1.mergeCells('A1:U1');
    const titleCell = sheet1.getCell('A1');
    titleCell.value = 'ACE SERVICES — WEEKLY PRODUCTION & FINANCIAL PIPELINE REPORT';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(1).height = 36;

    // Subtitle / Period info
    sheet1.mergeCells('A2:U2');
    const subCell = sheet1.getCell('A2');
    subCell.value = `Report Period: ${periodLabel}   |   Generated: ${now.toLocaleString()}   |   Total Projects: ${projects.length}`;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFCBD5E1' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(2).height = 22;

    // KPI Summary Metrics
    const totalVolume = projects.length;
    const totalBaseRevenue = projects.reduce((sum, p) => sum + (Number(p.decidedPrice) || 0), 0);
    const totalFees = projects.reduce((sum, p) => sum + (Number(p.merchantFeeAmount) || 0), 0);
    const totalDue = projects.reduce((sum, p) => sum + (Number(p.totalPrice || p.decidedPrice) || 0), 0);
    const completedCount = projects.filter((p) => p.status === ProjectStatus.delivered || p.status === ProjectStatus.sent_to_client).length;

    sheet1.addRow([]); // Row 3 empty

    // Row 4: KPI Header Cards
    sheet1.mergeCells('B4:D4');
    sheet1.mergeCells('F4:H4');
    sheet1.mergeCells('J4:L4');
    sheet1.mergeCells('N4:P4');
    sheet1.mergeCells('R4:T4');

    sheet1.getCell('B4').value = `Total Projects: ${totalVolume}`;
    sheet1.getCell('F4').value = `Base Value: $${totalBaseRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    sheet1.getCell('J4').value = `Merchant Fees: $${totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    sheet1.getCell('N4').value = `Total Invoiced: $${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    sheet1.getCell('R4').value = `Completed / Sent: ${completedCount} / ${totalVolume}`;

    const kpiCells = ['B4', 'F4', 'J4', 'N4', 'R4'];
    kpiCells.forEach((c) => {
      const cell = sheet1.getCell(c);
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFF59E0B' } },
        bottom: { style: 'medium', color: { argb: 'FFF59E0B' } },
        left: { style: 'medium', color: { argb: 'FFF59E0B' } },
        right: { style: 'medium', color: { argb: 'FFF59E0B' } },
      };
    });
    sheet1.getRow(4).height = 26;

    sheet1.addRow([]); // Row 5 empty

    // Row 6: Table Headers
    const headers = [
      'Reference #',
      'Submitted Date',
      'Client Company',
      'Contact Person',
      'Client Email',
      'Client Phone',
      'Salesperson',
      'BD Agent',
      'Department',
      'Assigned Engineer',
      'Status',
      'Priority',
      'Internal Due Date',
      'Base Price ($)',
      'Merchant Fee (%)',
      'Merchant Fee ($)',
      'Total Due ($)',
      'Intake Drawings',
      'Deliverables',
      'Open RFIs',
      'Scope Summary',
    ];

    const headerRow = sheet1.addRow(headers);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF475569' } },
        bottom: { style: 'medium', color: { argb: 'FFF59E0B' } },
        left: { style: 'thin', color: { argb: 'FF475569' } },
        right: { style: 'thin', color: { argb: 'FF475569' } },
      };
    });

    const startDataRowIndex = 7;
    projects.forEach((p, idx) => {
      const basePrice = Number(p.decidedPrice) || 0;
      const feePct = Number(p.merchantFeePercent) || 0;
      const feeAmt = Number(p.merchantFeeAmount) || (basePrice * (feePct / 100));
      const totPrice = Number(p.totalPrice || (basePrice + feeAmt)) || 0;
      const dept = p.projectType === 'design_drafting' ? 'CAD Drafting' : 'Cost Estimation';
      const openRfis = (p.rfis || []).filter((r: any) => r.status === 'pending').length;

      const row = sheet1.addRow([
        p.referenceNumber,
        p.submittedAt ? new Date(p.submittedAt).toISOString().split('T')[0] : '',
        p.clientCompanyName || p.clientName || 'N/A',
        p.clientContactPerson || 'N/A',
        p.clientEmail || '',
        p.clientPhone || '',
        p.salespersonName || 'N/A',
        p.bdAgent?.fullName || 'N/A',
        dept,
        p.assignedEngineer?.fullName || 'Unassigned',
        p.status.toUpperCase().replace(/_/g, ' '),
        (p.priority || 'NORMAL').toUpperCase(),
        p.internalDeadline ? new Date(p.internalDeadline).toISOString().split('T')[0] : 'Not Set',
        basePrice,
        feePct > 0 ? `${feePct}%` : '0%',
        feeAmt,
        totPrice,
        p.files?.length || 0,
        p.deliverables?.length || 0,
        openRfis,
        p.scopeDescription || '',
      ]);

      row.height = 22;
      const isEven = idx % 2 === 0;
      const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Alignments & Number formats
        if (colNumber === 1 || colNumber === 2 || colNumber === 11 || colNumber === 12 || colNumber === 13) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 14 || colNumber === 16 || colNumber === 17) {
          cell.numFmt = '$#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colNumber === 15 || colNumber === 18 || colNumber === 19 || colNumber === 20) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    const lastDataRowIndex = startDataRowIndex + projects.length - 1;

    // Bottom Summary / Totals Row
    if (projects.length > 0) {
      const summaryRow = sheet1.addRow([
        'TOTALS',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        { formula: `=SUM(N${startDataRowIndex}:N${lastDataRowIndex})` },
        '',
        { formula: `=SUM(P${startDataRowIndex}:P${lastDataRowIndex})` },
        { formula: `=SUM(Q${startDataRowIndex}:Q${lastDataRowIndex})` },
        { formula: `=SUM(R${startDataRowIndex}:R${lastDataRowIndex})` },
        { formula: `=SUM(S${startDataRowIndex}:S${lastDataRowIndex})` },
        { formula: `=SUM(T${startDataRowIndex}:T${lastDataRowIndex})` },
        '',
      ]);

      summaryRow.height = 26;
      summaryRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FFF59E0B' } },
          bottom: { style: 'double', color: { argb: 'FFF59E0B' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if (colNumber === 14 || colNumber === 16 || colNumber === 17) {
          cell.numFmt = '$#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber >= 18 && colNumber <= 20) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    }

    // Auto Column Widths for Sheet 1
    const colWidths = [18, 14, 26, 20, 26, 18, 18, 18, 18, 20, 16, 12, 16, 16, 16, 16, 16, 16, 16, 14, 35];
    colWidths.forEach((w, idx) => {
      sheet1.getColumn(idx + 1).width = w;
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Sheet 2: Department & Financial Summary
    // ──────────────────────────────────────────────────────────────────────────
    const sheet2 = workbook.addWorksheet('Department & Sales Summary', {
      views: [{ showGridLines: true }],
    });

    sheet2.mergeCells('A1:G1');
    const s2Title = sheet2.getCell('A1');
    s2Title.value = 'ACE SERVICES — DEPARTMENT & REVENUE PERFORMANCE BREAKDOWN';
    s2Title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    s2Title.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet2.getRow(1).height = 32;

    sheet2.addRow([]); // Blank row 2

    // Department Breakdown Section
    const estProjects = projects.filter((p) => (p.projectType || 'estimation') === 'estimation');
    const cadProjects = projects.filter((p) => p.projectType === 'design_drafting');

    const estRevenue = estProjects.reduce((sum, p) => sum + (Number(p.totalPrice || p.decidedPrice) || 0), 0);
    const cadRevenue = cadProjects.reduce((sum, p) => sum + (Number(p.totalPrice || p.decidedPrice) || 0), 0);

    const s2DeptHeader = sheet2.addRow(['Service Category', 'Projects Count', 'Total Revenue ($)', 'Average Value ($)', 'Completed Projects', 'Pending Projects', 'Revenue Share']);
    s2DeptHeader.height = 24;
    s2DeptHeader.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const estRow = sheet2.addRow([
      'Cost Estimation & Takeoffs',
      estProjects.length,
      estRevenue,
      estProjects.length > 0 ? estRevenue / estProjects.length : 0,
      estProjects.filter((p) => p.status === 'delivered' || p.status === 'sent_to_client').length,
      estProjects.filter((p) => p.status !== 'delivered' && p.status !== 'sent_to_client').length,
      totalDue > 0 ? `${((estRevenue / totalDue) * 100).toFixed(1)}%` : '0%',
    ]);
    estRow.getCell(3).numFmt = '$#,##0.00';
    estRow.getCell(4).numFmt = '$#,##0.00';

    const cadRow = sheet2.addRow([
      'CAD Design & Drafting',
      cadProjects.length,
      cadRevenue,
      cadProjects.length > 0 ? cadRevenue / cadProjects.length : 0,
      cadProjects.filter((p) => p.status === 'delivered' || p.status === 'sent_to_client').length,
      cadProjects.filter((p) => p.status !== 'delivered' && p.status !== 'sent_to_client').length,
      totalDue > 0 ? `${((cadRevenue / totalDue) * 100).toFixed(1)}%` : '0%',
    ]);
    cadRow.getCell(3).numFmt = '$#,##0.00';
    cadRow.getCell(4).numFmt = '$#,##0.00';

    sheet2.addRow([]); // Blank row 6
    sheet2.addRow([]); // Blank row 7

    // Salesperson Breakdown Section
    const salesMap = new Map<string, { count: number; total: number; delivered: number }>();
    projects.forEach((p) => {
      const sp = p.salespersonName || 'Unassigned / Direct';
      const cur = salesMap.get(sp) || { count: 0, total: 0, delivered: 0 };
      cur.count += 1;
      cur.total += Number(p.totalPrice || p.decidedPrice) || 0;
      if (p.status === 'delivered' || p.status === 'sent_to_client') cur.delivered += 1;
      salesMap.set(sp, cur);
    });

    const s2SalesHeader = sheet2.addRow(['Salesperson', 'Projects Sourced', 'Closed Revenue ($)', 'Average Deal ($)', 'Delivered Deals', 'Pipeline Share', '']);
    s2SalesHeader.height = 24;
    s2SalesHeader.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    salesMap.forEach((val, sp) => {
      const row = sheet2.addRow([
        sp,
        val.count,
        val.total,
        val.count > 0 ? val.total / val.count : 0,
        val.delivered,
        totalDue > 0 ? `${((val.total / totalDue) * 100).toFixed(1)}%` : '0%',
        '',
      ]);
      row.getCell(3).numFmt = '$#,##0.00';
      row.getCell(4).numFmt = '$#,##0.00';
    });

    [28, 16, 20, 20, 18, 16, 16].forEach((w, i) => {
      sheet2.getColumn(i + 1).width = w;
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Sheet 3: Files & Deliverables Log
    // ──────────────────────────────────────────────────────────────────────────
    const sheet3 = workbook.addWorksheet('Files & Deliverables Log', {
      views: [{ showGridLines: true }],
    });

    sheet3.mergeCells('A1:F1');
    const s3Title = sheet3.getCell('A1');
    s3Title.value = 'ACE SERVICES — BLUEPRINTS, SPECS & DELIVERABLES INVENTORY';
    s3Title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    s3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    s3Title.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet3.getRow(1).height = 32;

    sheet3.addRow([]); // Blank

    const s3Header = sheet3.addRow(['Project Ref', 'File Classification', 'File Name', 'File Size (MB)', 'Upload Date', 'Associated Engineer / BD']);
    s3Header.height = 24;
    s3Header.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    projects.forEach((p) => {
      (p.files || []).forEach((f: any) => {
        sheet3.addRow([
          p.referenceNumber,
          'Input Blueprint / Specification',
          f.originalName,
          (Number(f.sizeBytes) / (1024 * 1024)).toFixed(2),
          f.uploadedAt ? new Date(f.uploadedAt).toISOString().split('T')[0] : '',
          p.bdAgent?.fullName || 'BD Agent',
        ]);
      });
      (p.deliverables || []).forEach((d: any) => {
        sheet3.addRow([
          p.referenceNumber,
          'Completed Deliverable',
          d.originalName,
          (Number(d.sizeBytes) / (1024 * 1024)).toFixed(2),
          d.uploadedAt ? new Date(d.uploadedAt).toISOString().split('T')[0] : '',
          p.assignedEngineer?.fullName || 'Assigned Engineer',
        ]);
      });
    });

    [18, 30, 40, 16, 16, 26].forEach((w, i) => {
      sheet3.getColumn(i + 1).width = w;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStamp = now.toISOString().split('T')[0];
    const cleanRange = range.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `ACE_Weekly_Projects_Report_${cleanRange}_${dateStamp}.xlsx`;

    this.audit.log({
      eventType: AuditEventType.PROJECT_STATUS_UPDATED,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      metadata: { action: 'EXPORT_WEEKLY_EXCEL', range, periodLabel, totalProjects: projects.length },
    });

    return {
      buffer: Buffer.from(buffer),
      filename,
    };
  }
}


