/**
 * Email Triggers Service
 * Handles all 54 email actions across the system
 */

import { Injectable, Logger } from '@nestjs/common';
import { EmailService, EmailOptions } from './email.service';
import { EmailTemplates } from './email.templates';

export interface EmailTriggerParams {
  [key: string]: any;
}

@Injectable()
export class EmailTriggersService {
  private readonly logger = new Logger(EmailTriggersService.name);

  constructor(private emailService: EmailService) {}

  // ============ AUTHENTICATION TRIGGERS ============

  async triggerAccountCreated(params: {
    firstName: string;
    email: string;
    role: string;
    supportEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.accountCreated(params);
    await this.send(params.email, template);
    this.logger.log(`Account created email sent to ${params.email}`);
  }

  async triggerLoginNotification(params: {
    email: string;
    time: string;
    device: string;
    ip: string;
    supportEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.loginNotification(params);
    await this.send(params.email, template);
    this.logger.log(`Login notification sent to ${params.email}`);
  }

  async triggerFailedLoginAlert(params: {
    email: string;
    attempts: number;
    time: string;
    supportEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.failedLoginAlert(params);
    await this.send(params.email, template);
    this.logger.log(`Failed login alert sent to ${params.email}`);
  }

  async triggerAccountLocked(params: {
    email: string;
    time: string;
    unlockTime: string;
    supportEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.accountLocked(params);
    await this.send(params.email, template);
    this.logger.log(`Account locked email sent to ${params.email}`);
  }

  async triggerAccountUnlocked(params: {
    email: string;
    time: string;
    supportEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.accountUnlocked(params);
    await this.send(params.email, template);
    this.logger.log(`Account unlocked email sent to ${params.email}`);
  }

  async triggerPasswordResetRequest(params: {
    email: string;
    resetLink: string;
    expiresIn: string;
    supportEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.passwordResetRequest(params);
    await this.send(params.email, template);
    this.logger.log(`Password reset email sent to ${params.email}`);
  }

  async triggerPasswordChanged(params: {
    email: string;
    time: string;
    supportEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.passwordChanged(params);
    await this.send(params.email, template);
    this.logger.log(`Password changed confirmation sent to ${params.email}`);
  }

  async triggerAccountDeactivated(params: {
    email: string;
    time: string;
    reason?: string;
    supportEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.accountDeactivated(params);
    await this.send(params.email, template);
    this.logger.log(`Account deactivated email sent to ${params.email}`);
  }

  async triggerAccountReactivated(params: {
    email: string;
    time: string;
    loginLink: string;
  }): Promise<void> {
    const template = EmailTemplates.accountReactivated(params);
    await this.send(params.email, template);
    this.logger.log(`Account reactivated email sent to ${params.email}`);
  }

  // ============ PROJECT MANAGEMENT TRIGGERS ============

  async triggerProjectSubmitted(params: {
    projectId: string;
    projectName: string;
    clientName: string;
    submittedBy: string;
    fileCount: number;
    time: string;
    supportEmail: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.projectSubmitted(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`Project submitted email sent to ${params.recipients.join(', ')}`);
  }

  async triggerProjectStatusChanged(params: {
    projectId: string;
    projectName: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    time: string;
    nextSteps: string;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.projectStatusChanged(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`Project status changed email sent to ${params.recipients.join(', ')}`);
  }

  async triggerProjectAssigned(params: {
    projectId: string;
    projectName: string;
    engineerName: string;
    deadline: string;
    clientName: string;
    clientEmail: string;
    fileCount: number;
    portalLink: string;
    engineerEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.projectAssigned(params);
    await this.send(params.engineerEmail, template);
    this.logger.log(`Project assigned email sent to ${params.engineerEmail}`);
  }

  async triggerProjectApproved(params: {
    projectId: string;
    projectName: string;
    approvedBy: string;
    time: string;
    nextSteps: string;
    expectedDelivery: string;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.projectApproved(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`Project approved email sent to ${params.recipients.join(', ')}`);
  }

  async triggerProjectRejected(params: {
    projectId: string;
    projectName: string;
    reason: string;
    feedback: string;
    supportEmail: string;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.projectRejected(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`Project rejected email sent to ${params.recipients.join(', ')}`);
  }

  async triggerProjectCompleted(params: {
    projectId: string;
    projectName: string;
    completedOn: string;
    feedbackLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.projectCompleted(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`Project completed email sent to ${params.recipients.join(', ')}`);
  }

  // ============ RFI TRIGGERS ============

  async triggerRFICreated(params: {
    rfiId: string;
    projectId: string;
    title: string;
    question: string;
    deadline?: string;
    attachmentName?: string;
    responseLink: string;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.rfiCreated(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`RFI created email sent to ${params.recipients.join(', ')}`);
  }

  async triggerRFIAnswered(params: {
    rfiId: string;
    projectId: string;
    title: string;
    question: string;
    answer: string;
    answeredOn: string;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.rfiAnswered(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`RFI answered email sent to ${params.recipients.join(', ')}`);
  }

  async triggerRFIOverdue(params: {
    rfiId: string;
    projectId: string;
    title: string;
    originalDeadline: string;
    daysOverdue: number;
    contactEmail: string;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.rfiOverdue(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`RFI overdue email sent to ${params.recipients.join(', ')}`);
  }

  async triggerRFIForwarded(params: {
    rfiId: string;
    projectId: string;
    title: string;
    question: string;
    clientName: string;
    clientEmail: string;
    forwardedOn: string;
    responseDeadline: string;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.rfiForwarded(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`RFI forwarded email sent to ${params.recipients.join(', ')}`);
  }

  // ============ FILE TRIGGERS ============

  async triggerFileUploaded(params: {
    fileName: string;
    projectId: string;
    uploadedBy: string;
    fileSize: string;
    fileType: string;
    uploadedOn: string;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.fileUploaded(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`File uploaded email sent to ${params.recipients.join(', ')}`);
  }

  async triggerClientDelivery(params: {
    projectId: string;
    projectName: string;
    fileCount: number;
    downloadLink: string;
    expiresOn: string;
    supportEmail: string;
    clientEmail: string;
  }): Promise<void> {
    const template = EmailTemplates.clientDeliveryEmail(params);
    await this.send(params.clientEmail, template);
    this.logger.log(`Client delivery email sent to ${params.clientEmail}`);
  }

  // ============ REPORT TRIGGERS ============

  async triggerDailySummary(params: {
    date: string;
    projectsAdded: number;
    projectsCompleted: number;
    projectsInProgress: number;
    rfisReceived: number;
    rfisAnswered: number;
    filesUploaded: number;
    issueCount: number;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.dailySummary(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`Daily summary sent to ${params.recipients.join(', ')}`);
  }

  async triggerWeeklySummary(params: {
    weekStart: string;
    weekEnd: string;
    projectsStarted: number;
    projectsCompleted: number;
    avgCompletionTime: string;
    atRiskCount: number;
    highPriorityCount: number;
    portalLink: string;
    recipients: string[];
  }): Promise<void> {
    const template = EmailTemplates.weeklySummary(params);
    for (const recipient of params.recipients) {
      await this.send(recipient, template);
    }
    this.logger.log(`Weekly summary sent to ${params.recipients.join(', ')}`);
  }

  // ============ HELPER METHOD ============

  private async send(to: string, template: any): Promise<void> {
    try {
      const emailOptions: EmailOptions = {
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };
      await this.emailService.send(emailOptions);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }
}
