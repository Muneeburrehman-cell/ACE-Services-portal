import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FilesService } from '../files/files.service';
import { EmailService } from '../email/email.service';
import { EmailTriggersService } from '../email/email.triggers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditEventType, ProjectStatus, UserRole } from '@prisma/client';

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

@Injectable()
export class DeliveryService {
  private logger = new Logger('DeliveryService');

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private files: FilesService,
    private config: ConfigService,
    private emailService: EmailService,
    private emailTriggers: EmailTriggersService,
    private notifications: NotificationsService,
  ) {}

  async getPreview(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { deliverables: true },
    });
    if (!project) throw new NotFoundException();
    if (project.status !== ProjectStatus.delivered)
      throw new BadRequestException('Project is not in delivered status');

    const totalSize = project.deliverables.reduce((a, d) => a + Number(d.sizeBytes), 0);

    const basePrice = Number(project.decidedPrice) || 0;
    const feePercent = Number(project.merchantFeePercent) || 0;
    const feeAmount = Number(project.merchantFeeAmount) || (basePrice * (feePercent / 100));
    const totalDue = Number((basePrice + feeAmount).toFixed(2));

    const autoInvoice = `=======================================================
               OFFICIAL INVOICE & BREAKDOWN
=======================================================
Client Company:   ${project.clientCompanyName || project.clientName}
Attention:        ${project.clientContactPerson || 'Project Management'}
Project Ref:      ${project.referenceNumber}
Service Type:     ${project.projectType === 'design_drafting' ? 'CAD Architectural Design & Drafting' : 'Construction Takeoff & Cost Estimation'}

Scope Summary:
${project.scopeDescription}

-------------------------------------------------------
FINANCIAL BREAKDOWN
-------------------------------------------------------
Base Project Fee:             $${basePrice.toFixed(2)}
Merchant / Processing Fee:    ${feePercent > 0 ? `${feePercent}% ($${feeAmount.toFixed(2)})` : feeAmount > 0 ? `$${feeAmount.toFixed(2)}` : '$0.00'}
-------------------------------------------------------
TOTAL AMOUNT DUE:             $${totalDue.toFixed(2)}
=======================================================`;

    return {
      to: project.clientEmail,
      subject: `Your Project ${project.referenceNumber} Deliverables & Invoice — ${project.clientCompanyName || project.clientName}`,
      body: this.buildBody(project, autoInvoice),
      deliveryMethod: totalSize <= MAX_ATTACHMENT_BYTES ? 'attachment' : 'link',
      totalDeliverableSize: totalSize,
      invoice: project.invoice || autoInvoice,
      decidedPrice: basePrice,
      merchantFeePercent: feePercent,
      merchantFeeAmount: feeAmount,
      totalPrice: totalDue,
    };
  }

  async sendToClient(
    projectId: string,
    dto: {
      subject: string;
      body: string;
      deliveryMethod: 'attachment' | 'link';
      invoice?: string;
      merchantFeePercent?: number;
      merchantFeeAmount?: number;
    },
    adminId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { deliverables: true },
    });
    if (!project) throw new NotFoundException();
    if (project.status !== ProjectStatus.delivered)
      throw new BadRequestException('Project must be delivered before sending to client');

    // Save invoice & merchant fee to project record if provided
    const updateData: any = {};
    if (dto.invoice !== undefined) updateData.invoice = dto.invoice || null;
    if (dto.merchantFeePercent !== undefined) updateData.merchantFeePercent = dto.merchantFeePercent;
    if (dto.merchantFeeAmount !== undefined) updateData.merchantFeeAmount = dto.merchantFeeAmount;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: updateData,
      });
    }

    const recipientEmail = project.clientEmail;
    let success = false;
    let errorMessage: string | undefined;

    try {
      // Build email body — append invoice if provided
      let emailBody = dto.body;
      if (dto.invoice && dto.invoice.trim()) {
        emailBody += `\n\n${dto.invoice.trim()}`;
      }

      const emailOpts: Parameters<EmailService['send']>[0] = {
        to: recipientEmail,
        subject: dto.subject,
        text: emailBody,
      };

      if (dto.deliveryMethod === 'attachment') {
        const totalSize = project.deliverables.reduce((a, d) => a + Number(d.sizeBytes), 0);
        if (totalSize > MAX_ATTACHMENT_BYTES)
          throw new BadRequestException('Total size exceeds 25 MB. Use link delivery instead.');

        emailOpts.attachments = await Promise.all(
          project.deliverables.map(async (d) => {
            const stream = await this.files.getDeliverableStream(d.s3Key);
            const chunks: Buffer[] = [];
            for await (const chunk of stream as any)
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            return {
              filename: d.originalName,
              content: Buffer.concat(chunks),
              contentType: d.mimeType,
            };
          }),
        );
      } else {
        const links = await Promise.all(
          project.deliverables.map(async (d) => {
            const url = await this.files.getSignedUrlForDelivery(d.s3Key);
            return `${d.originalName}: ${url}`;
          }),
        );
        emailOpts.text +=
          '\n\nDownload your files (links valid for 72 hours):\n' + links.join('\n');
      }

      const sendResult = await this.emailService.send(emailOpts);
      success = sendResult.success;
    } catch (err: any) {
      errorMessage = err.message;
    }

    await this.prisma.clientDeliveryLog.create({
      data: {
        projectId,
        sentBy: adminId,
        recipientEmail,
        subject: dto.subject,
        deliveryMethod: dto.deliveryMethod,
        success,
        errorMessage: errorMessage ?? null,
      },
    });

    this.audit.log({
      eventType: success
        ? AuditEventType.SEND_TO_CLIENT_SUCCESS
        : AuditEventType.SEND_TO_CLIENT_FAILURE,
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      targetId: projectId,
      metadata: { recipientEmail, deliveryMethod: dto.deliveryMethod, success, errorMessage },
    });

    if (!success) throw new BadRequestException(`Failed to send email: ${errorMessage}`);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.sent_to_client },
    });
    await this.prisma.projectStatusHistory.create({
      data: {
        projectId,
        fromStatus: ProjectStatus.delivered,
        toStatus: ProjectStatus.sent_to_client,
        changedBy: adminId,
      },
    });

    // Trigger email: Client Delivery
    this.emailTriggers.triggerClientDelivery({
      projectId,
      projectName: project.referenceNumber,
      fileCount: project.deliverables.length,
      downloadLink: `${this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000'}/download/${projectId}`,
      expiresOn: new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString(),
      supportEmail: this.config.get<string>('SUPPORT_EMAIL') || 'support@example.com',
      clientEmail: recipientEmail,
    }).catch((err) => {
      this.logger.warn('Failed to send client delivery email', err);
    });

    return { success: true, sentTo: recipientEmail };
  }

  async handleResendWebhook(payload: any) {
    const eventType = payload.type || payload.event || 'email.event';
    const data = payload.data || payload;
    const emailId = data.email_id || data.id;
    const recipient = data.to ? (Array.isArray(data.to) ? data.to[0] : data.to) : data.recipient || 'Unknown';

    this.audit.log({
      eventType: AuditEventType.SEND_TO_CLIENT_SUCCESS,
      actorId: 'resend-webhook',
      actorRole: UserRole.ADMIN,
      metadata: { eventType, emailId, recipient, payload: data },
    });

    await this.notifications.notifyAdmin('EMAIL_EVENT', {
      title: `Email ${String(eventType).replace('email.', '').toUpperCase()}`,
      body: `Delivery event for ${recipient}: ${eventType}`,
      metadata: { eventType, emailId, recipient },
    });

    return { received: true };
  }

  private buildBody(project: any, invoiceText?: string): string {
    const company = this.config.get<string>('COMPANY_NAME') ?? 'ACE SERVICES';
    const clientName = project.clientContactPerson || project.clientCompanyName || project.clientName;
    return `Dear ${clientName},\n\nWe are pleased to inform you that your project deliverables for ${project.referenceNumber} (${project.projectType === 'design_drafting' ? 'CAD Architectural Design & Drafting' : 'Cost Estimation & Takeoff'}) are complete.\n\nPlease find your final files and itemized invoice breakdown below.\n\nThank you for choosing ${company}.\n\nBest regards,\n${company} Production Team`;
  }
}
