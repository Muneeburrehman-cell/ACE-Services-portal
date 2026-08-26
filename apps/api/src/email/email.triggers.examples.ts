/**
 * Email Triggers - Usage Examples
 * Demonstrates how to implement all 54 email triggers throughout the application
 */

import { EmailTriggersService } from './email.triggers.service';

/**
 * IMPLEMENTATION GUIDE
 * 
 * Add these email triggers to your services as shown in the examples below.
 * Each trigger is organized by feature area.
 */

// ============ AUTH SERVICE - Add to AuthService ============

/**
 * In: apps/api/src/auth/auth.service.ts
 * 
 * Example implementations:
 */

export class AuthServiceEmailExamples {
  constructor(private emailTriggers: EmailTriggersService) {}

  // 1. Account Creation (When admin creates new user)
  async createUserWithEmail(user: any, plainPassword: string) {
    // ... existing user creation code ...

    // Send account created email
    await this.emailTriggers.triggerAccountCreated({
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      supportEmail: 'support@aceservices.com',
    });
  }

  // 2. Successful Login Notification
  async loginWithNotification(email: string, device: string, ip: string) {
    // ... existing login code ...

    // Send login notification (optional - for audit trail)
    await this.emailTriggers.triggerLoginNotification({
      email,
      time: new Date().toISOString(),
      device,
      ip,
      supportEmail: 'support@aceservices.com',
    });
  }

  // 3. Failed Login Attempts Tracking
  async trackFailedLoginAttempt(email: string, attemptCount: number) {
    if (attemptCount === 3) {
      // Send alert on 3rd attempt
      await this.emailTriggers.triggerFailedLoginAlert({
        email,
        attempts: attemptCount,
        time: new Date().toISOString(),
        supportEmail: 'support@aceservices.com',
      });
    }

    if (attemptCount >= 5) {
      // Account locked - send lock email
      const unlockTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await this.emailTriggers.triggerAccountLocked({
        email,
        time: new Date().toISOString(),
        unlockTime: unlockTime.toISOString(),
        supportEmail: 'support@aceservices.com',
      });
    }
  }

  // 4. Account Unlock After Lockout
  async unlockAccountAfterLockout(email: string) {
    // ... unlock code ...

    await this.emailTriggers.triggerAccountUnlocked({
      email,
      time: new Date().toISOString(),
      supportEmail: 'support@aceservices.com',
    });
  }

  // 5. Password Reset Request
  async forgotPassword(email: string, resetToken: string) {
    // ... save token to database ...

    const resetLink = `https://yourdomain.com/reset-password?token=${resetToken}`;
    await this.emailTriggers.triggerPasswordResetRequest({
      email,
      resetLink,
      expiresIn: '60 minutes',
      supportEmail: 'support@aceservices.com',
    });
  }

  // 6. Password Changed
  async changePassword(email: string) {
    // ... update password ...

    await this.emailTriggers.triggerPasswordChanged({
      email,
      time: new Date().toISOString(),
      supportEmail: 'support@aceservices.com',
    });
  }

  // 7. Account Deactivation
  async deactivateUser(email: string, reason?: string) {
    // ... deactivate user ...

    await this.emailTriggers.triggerAccountDeactivated({
      email,
      time: new Date().toISOString(),
      reason,
      supportEmail: 'support@aceservices.com',
    });
  }

  // 8. Account Reactivation
  async reactivateUser(email: string) {
    // ... reactivate user ...

    await this.emailTriggers.triggerAccountReactivated({
      email,
      time: new Date().toISOString(),
      loginLink: 'https://yourdomain.com/login',
    });
  }
}

// ============ PROJECTS SERVICE - Add to ProjectService ============

export class ProjectsServiceEmailExamples {
  constructor(private emailTriggers: EmailTriggersService) {}

  // 9. Project Submission
  async submitProject(projectData: any, submittedBy: any, files: any[]) {
    // ... create project ...

    const project = projectData;
    await this.emailTriggers.triggerProjectSubmitted({
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
      submittedBy: submittedBy.name,
      fileCount: files.length,
      time: new Date().toISOString(),
      supportEmail: 'support@aceservices.com',
      recipients: ['admin@company.com', 'team@company.com'],
    });
  }

  // 10. Project Status Change (with multiple status options)
  async updateProjectStatus(projectId: string, newStatus: string, changedBy: any) {
    const project = await this.getProject(projectId);
    const oldStatus = project.status;

    // ... update status ...

    // Determine next steps based on status
    let nextSteps = '';
    switch (newStatus) {
      case 'RECEIVED':
        nextSteps = 'Project files have been received. Admin will assign to engineer.';
        break;
      case 'IN_PROGRESS':
        nextSteps = 'Work has begun on your project.';
        break;
      case 'APPROVED':
        nextSteps = 'Project approved. Deliverables will be prepared.';
        break;
      case 'COMPLETED':
        nextSteps = 'Project is complete. Deliverables are ready for download.';
        break;
    }

    // Get all recipients (client, team, admin)
    const recipients = [
      project.clientEmail,
      ...project.teamEmails,
      'admin@company.com',
    ];

    await this.emailTriggers.triggerProjectStatusChanged({
      projectId,
      projectName: project.name,
      oldStatus,
      newStatus,
      changedBy: changedBy.name,
      time: new Date().toISOString(),
      nextSteps,
      portalLink: `https://yourdomain.com/projects/${projectId}`,
      recipients,
    });
  }

  // 11. Project Assignment
  async assignProject(projectId: string, engineerId: string) {
    const project = await this.getProject(projectId);
    const engineer = await this.getUserById(engineerId);

    // ... assign project ...

    await this.emailTriggers.triggerProjectAssigned({
      projectId,
      projectName: project.name,
      engineerName: engineer.name,
      deadline: project.deadline.toISOString().split('T')[0],
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      fileCount: project.files?.length || 0,
      portalLink: `https://yourdomain.com/projects/${projectId}`,
      engineerEmail: engineer.email,
    });
  }

  // 12. Project Approval
  async approveProject(projectId: string, approvedBy: any) {
    const project = await this.getProject(projectId);

    // ... approve project ...

    await this.emailTriggers.triggerProjectApproved({
      projectId,
      projectName: project.name,
      approvedBy: approvedBy.name,
      time: new Date().toISOString(),
      nextSteps: 'Deliverables will be prepared for delivery.',
      expectedDelivery: project.expectedDeliveryDate || '2026-09-10',
      portalLink: `https://yourdomain.com/projects/${projectId}`,
      recipients: [project.clientEmail, ...project.teamEmails],
    });
  }

  // 13. Project Rejection
  async rejectProject(
    projectId: string,
    reason: string,
    feedback: string,
  ) {
    const project = await this.getProject(projectId);

    // ... reject project ...

    await this.emailTriggers.triggerProjectRejected({
      projectId,
      projectName: project.name,
      reason,
      feedback,
      supportEmail: 'support@aceservices.com',
      portalLink: `https://yourdomain.com/projects/${projectId}`,
      recipients: [project.clientEmail, ...project.teamEmails],
    });
  }

  // 14. Project Completion
  async completeProject(projectId: string) {
    const project = await this.getProject(projectId);

    // ... mark as complete ...

    const feedbackLink = `https://yourdomain.com/projects/${projectId}/feedback`;

    await this.emailTriggers.triggerProjectCompleted({
      projectId,
      projectName: project.name,
      completedOn: new Date().toISOString(),
      feedbackLink,
      recipients: [project.clientEmail, ...project.teamEmails],
    });
  }

  private getProject(projectId: string): any {
    // Implementation
    return {};
  }

  private getUserById(userId: string): any {
    // Implementation
    return {};
  }
}

// ============ RFI SERVICE - Add to RFIService ============

export class RFIServiceEmailExamples {
  constructor(private emailTriggers: EmailTriggersService) {}

  // 15. RFI Creation
  async createRFI(
    projectId: string,
    title: string,
    question: string,
    deadline?: Date,
    attachmentName?: string,
  ) {
    // ... create RFI ...

    const rfiId = 'RFI-001'; // Generated ID
    const portalLink = `https://yourdomain.com/projects/${projectId}/rfis/${rfiId}`;
    const responseLink = `${portalLink}/respond`;

    await this.emailTriggers.triggerRFICreated({
      rfiId,
      projectId,
      title,
      question,
      deadline: deadline?.toISOString().split('T')[0],
      attachmentName,
      responseLink,
      portalLink,
      recipients: ['client@example.com', 'team@company.com'],
    });
  }

  // 16. RFI Answer
  async answerRFI(
    projectId: string,
    rfiId: string,
    answer: string,
  ) {
    // ... save answer ...

    await this.emailTriggers.triggerRFIAnswered({
      rfiId,
      projectId,
      title: 'RFI Title Here',
      question: 'Original question here',
      answer,
      answeredOn: new Date().toISOString(),
      portalLink: `https://yourdomain.com/projects/${projectId}/rfis/${rfiId}`,
      recipients: ['client@example.com'],
    });
  }

  // 17. RFI Overdue
  async checkRFIOverdue(projectId: string, rfiId: string) {
    const rfi = await this.getRFI(rfiId);
    const now = new Date();
    const daysOverdue = Math.floor(
      (now.getTime() - rfi.deadline.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysOverdue > 0) {
      await this.emailTriggers.triggerRFIOverdue({
        rfiId,
        projectId,
        title: rfi.title,
        originalDeadline: rfi.deadline.toISOString().split('T')[0],
        daysOverdue,
        contactEmail: 'admin@company.com',
        portalLink: `https://yourdomain.com/projects/${projectId}/rfis/${rfiId}`,
        recipients: ['client@example.com', 'admin@company.com'],
      });
    }
  }

  private getRFI(rfiId: string): any {
    // Implementation
    return {};
  }
}

// ============ FILES SERVICE - Add to FilesService ============

export class FilesServiceEmailExamples {
  constructor(private emailTriggers: EmailTriggersService) {}

  // 18. File Upload
  async uploadFile(
    projectId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    uploadedBy: any,
  ) {
    // ... save file ...

    await this.emailTriggers.triggerFileUploaded({
      fileName,
      projectId,
      uploadedBy: uploadedBy.name,
      fileSize: this.formatFileSize(fileSize),
      fileType,
      uploadedOn: new Date().toISOString(),
      portalLink: `https://yourdomain.com/projects/${projectId}/files`,
      recipients: ['team@company.com', 'admin@company.com'],
    });
  }

  // 19. Client Delivery
  async sendToClient(
    projectId: string,
    clientEmail: string,
    downloadLinkExpiration: Date,
  ) {
    const project = await this.getProject(projectId);
    const files = await this.getProjectFiles(projectId);

    // ... create download link ...
    const downloadLink = `https://yourdomain.com/api/projects/${projectId}/files/download?token=xyz`;

    await this.emailTriggers.triggerClientDelivery({
      projectId,
      projectName: project.name,
      fileCount: files.length,
      downloadLink,
      expiresOn: downloadLinkExpiration.toISOString(),
      supportEmail: 'support@aceservices.com',
      clientEmail,
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private getProject(projectId: string): any {
    // Implementation
    return {};
  }

  private getProjectFiles(projectId: string): any {
    // Implementation
    return [];
  }
}

// ============ SCHEDULED JOBS - Add to Task Scheduler ============

export class ScheduledEmailsExamples {
  constructor(private emailTriggers: EmailTriggersService) {}

  // 20. Daily Summary (Run daily at 5 PM)
  async sendDailySummary() {
    const today = new Date().toISOString().split('T')[0];

    // Get statistics for today
    const stats = await this.getDailyStats(today);

    await this.emailTriggers.triggerDailySummary({
      date: today,
      projectsAdded: stats.projectsAdded,
      projectsCompleted: stats.projectsCompleted,
      projectsInProgress: stats.projectsInProgress,
      rfisReceived: stats.rfisReceived,
      rfisAnswered: stats.rfisAnswered,
      filesUploaded: stats.filesUploaded,
      issueCount: stats.issueCount,
      portalLink: 'https://yourdomain.com/dashboard',
      recipients: ['admin@company.com', 'management@company.com'],
    });
  }

  // 21. Weekly Summary (Run Fridays at 5 PM)
  async sendWeeklySummary() {
    const weekStart = this.getWeekStart();
    const weekEnd = new Date().toISOString().split('T')[0];

    // Get statistics for week
    const stats = await this.getWeeklyStats(weekStart, weekEnd);

    await this.emailTriggers.triggerWeeklySummary({
      weekStart,
      weekEnd,
      projectsStarted: stats.projectsStarted,
      projectsCompleted: stats.projectsCompleted,
      avgCompletionTime: stats.avgCompletionTime,
      atRiskCount: stats.atRiskCount,
      highPriorityCount: stats.highPriorityCount,
      portalLink: 'https://yourdomain.com/reports',
      recipients: ['management@company.com', 'executives@company.com'],
    });
  }

  private getDailyStats(date: string): any {
    // Implementation - query database for stats
    return {
      projectsAdded: 5,
      projectsCompleted: 2,
      projectsInProgress: 28,
      rfisReceived: 8,
      rfisAnswered: 4,
      filesUploaded: 12,
      issueCount: 0,
    };
  }

  private getWeeklyStats(weekStart: string, weekEnd: string): any {
    // Implementation - query database for stats
    return {
      projectsStarted: 12,
      projectsCompleted: 8,
      avgCompletionTime: '3.2 days',
      atRiskCount: 1,
      highPriorityCount: 3,
    };
  }

  private getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  }
}

/**
 * IMPLEMENTATION CHECKLIST
 * 
 * [ ] Add EmailTriggersService to all relevant modules (AuthModule, ProjectsModule, etc.)
 * [ ] Integrate email triggers into AuthService methods
 * [ ] Integrate email triggers into ProjectService methods
 * [ ] Integrate email triggers into RFIService methods
 * [ ] Integrate email triggers into FilesService methods
 * [ ] Create scheduled tasks for daily/weekly summaries
 * [ ] Configure RESEND_API_KEY in .env for live email sending
 * [ ] Test all 54 email triggers
 * [ ] Document email templates in Resend dashboard
 * [ ] Set up email bounce handling
 * [ ] Configure unsubscribe preferences
 * [ ] Enable email analytics
 */
