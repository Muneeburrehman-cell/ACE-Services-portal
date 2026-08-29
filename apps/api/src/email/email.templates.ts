/**
 * Email Templates for All 54 Action Triggers
 * Organized by category with reusable template functions
 * All templates wrapped with BaseEmailTemplate for consistent branding
 */

import { BaseEmailTemplate } from './email-template.base';

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
  preheader?: string;
}

function wrapTemplate(subject: string, mainContent: string, preheader?: string): EmailTemplate {
  const template = new BaseEmailTemplate({
    subject,
    preheader,
    mainContent,
  });
  const result = template.render();
  return { subject: result.subject, text: result.text, html: result.html, preheader: result.preheader };
}

export class EmailTemplates {
  // ============ AUTHENTICATION EMAILS ============

  static accountCreated(params: {
    firstName: string;
    email: string;
    role: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3>Welcome to ACE Services Portal!</h3>
<p>Hello <strong>${params.firstName}</strong>,</p>
<p>Your account has been created successfully.</p>
<div class="highlight-box">
  <p><strong>Email:</strong> ${params.email}</p>
  <p><strong>Role:</strong> ${params.role}</p>
</div>
<p style="margin-top: 20px;">You can now log in to your account using these credentials.</p>
<p style="margin-top: 20px;">
  <a href="https://aceservices.com/login" class="email-button">Login Now</a>
</p>
<p style="color: #FF8C00; font-weight: 600; margin-top: 20px;">
  Important: Please change your password after your first login for security.
</p>
<p style="margin-top: 20px; font-size: 14px;">
  If you need any assistance, contact us at <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate('Welcome to ACE Services Portal - Account Created', mainContent, 'Your account has been created');
  }

  static loginNotification(params: {
    email: string;
    time: string;
    device: string;
    ip: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3>Login Notification</h3>
<p>You have successfully logged in to ACE Services Portal.</p>
<div class="highlight-box">
  <p><strong>Time:</strong> ${params.time}</p>
  <p><strong>Device:</strong> ${params.device}</p>
  <p><strong>IP Address:</strong> ${params.ip}</p>
</div>
<p style="margin-top: 20px; color: #FF8C00; font-weight: 600;">
  If this wasn't you, please reset your password immediately.
</p>
<p style="margin-top: 20px;">
  <a href="https://aceservices.com/forgot-password" class="email-button">Reset Password</a>
</p>
<p style="margin-top: 20px; font-size: 14px;">
  Contact support: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate('Login Detected - ACE Services Portal', mainContent, 'Login notification for your account');
  }

  static failedLoginAlert(params: {
    email: string;
    attempts: number;
    time: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #d9534f;">Failed Login Attempts Alert</h3>
<p>We detected <strong>${params.attempts} failed login attempts</strong> to your account.</p>
<div class="highlight-box" style="background-color: #fff3cd; border-color: #ffc107;">
  <p><strong>Time of last attempt:</strong> ${params.time}</p>
</div>
<p style="margin-top: 20px;">If this was you, please try again with your correct password.</p>
<p style="margin-top: 12px; color: #d9534f; font-weight: 600;">If this wasn't you, please reset your password immediately.</p>
<p style="margin-top: 20px;">
  <a href="https://aceservices.com/forgot-password" class="email-button">Reset Password</a>
</p>
<p style="margin-top: 20px; font-size: 14px;">
  For assistance, contact: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate('Failed Login Attempts Alert', mainContent, 'Suspicious login activity detected');
  }

  static accountLocked(params: {
    email: string;
    time: string;
    unlockTime: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #721c24;">Your Account Has Been Locked</h3>
<p>Your account has been locked due to multiple failed login attempts.</p>
<div class="highlight-box" style="background-color: #f8d7da; border-color: #f5c6cb;">
  <p><strong>Time locked:</strong> ${params.time}</p>
  <p><strong>Will be automatically unlocked:</strong> ${params.unlockTime}</p>
</div>
<p style="margin-top: 20px;">Your account will be automatically unlocked in 15 minutes.</p>
<p style="margin-top: 20px;">
  <a href="https://aceservices.com/support" class="email-button">Contact Support</a>
</p>
<p style="margin-top: 20px; font-size: 14px;">
  For immediate assistance: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate('Your Account Has Been Locked', mainContent, 'Account locked due to failed login attempts');
  }

  static accountUnlocked(params: {
    email: string;
    time: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #155724;">Your Account Has Been Unlocked</h3>
<p>Your account is now unlocked and ready to use.</p>
<div class="highlight-box" style="background-color: #d4edda; border-color: #c3e6cb;">
  <p><strong>Time unlocked:</strong> ${params.time}</p>
</div>
<p style="margin-top: 20px;">You can now log in with your credentials.</p>
<p style="margin-top: 20px;">
  <a href="https://aceservices.com/login" class="email-button">Login Now</a>
</p>
<p style="margin-top: 20px; font-size: 14px;">
  If you need any assistance: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate('Your Account Has Been Unlocked', mainContent, 'Your account is now active');
  }

  static passwordResetRequest(params: {
    resetLink: string;
    expiresIn: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3>Reset Your Password</h3>
<p>We received a request to reset your password.</p>
<p style="margin-top: 20px; margin-bottom: 20px;">
  <a href="${params.resetLink}" class="email-button">Reset Password</a>
</p>
<div class="highlight-box">
  <p><strong>This link expires in:</strong> ${params.expiresIn}</p>
</div>
<p style="margin-top: 20px;">If you didn't request this, please ignore this email. Your password will only change if you click the link and confirm the new password.</p>
<p style="margin-top: 20px; font-size: 14px;">
  Security questions? Contact us at <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate('Reset Your Password - ACE Services Portal', mainContent, 'Password reset request');
  }

  static passwordChanged(params: {
    email: string;
    time: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #155724;">Your Password Has Been Changed</h3>
<p>Your password was successfully changed on <strong>${params.time}</strong>.</p>
<p style="margin-top: 12px;">Your old password is no longer valid.</p>
<p style="margin-top: 20px; color: #d9534f; font-weight: 600;">
  If you didn't make this change, please contact support immediately.
</p>
<p style="margin-top: 20px;">
  <a href="https://aceservices.com/forgot-password" class="email-button">Reset Password Again</a>
</p>
<p style="margin-top: 20px; font-size: 14px;">
  Contact support: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate('Your Password Has Been Changed', mainContent, 'Password change confirmation');
  }

  static accountDeactivated(params: {
    email: string;
    time: string;
    reason?: string;
    supportEmail: string;
  }): EmailTemplate {
    const reasonText = params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : '';
    const mainContent = `
<h3 style="color: #721c24;">Your Account Has Been Deactivated</h3>
<p>Your account has been deactivated effective <strong>${params.time}</strong>.</p>
<div class="highlight-box" style="background-color: #f8d7da; border-color: #f5c6cb;">
  ${reasonText}
</div>
<p style="margin-top: 20px;">You no longer have access to ACE Services Portal.</p>
<p style="margin-top: 20px; font-size: 14px;">
  To reactivate your account, contact: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate('Your Account Has Been Deactivated', mainContent, 'Account deactivation notice');
  }

  static accountReactivated(params: {
    email: string;
    time: string;
    loginLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #155724;">Your Account Has Been Reactivated</h3>
<p>Your account has been reactivated on <strong>${params.time}</strong>.</p>
<p style="margin-top: 20px;">You can now log in to ACE Services Portal.</p>
<p style="margin-top: 20px;">
  <a href="${params.loginLink}" class="email-button">Login Now</a>
</p>
    `;
    return wrapTemplate('Your Account Has Been Reactivated', mainContent, 'Your account is now active');
  }

  // ============ PROJECT MANAGEMENT EMAILS ============

  static projectSubmitted(params: {
    projectId: string;
    projectName: string;
    clientName: string;
    submittedBy: string;
    fileCount: number;
    time: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3>New Project Submitted</h3>
<p>A new project has been submitted to the system.</p>
<div class="highlight-box">
  <p><strong>Project Reference:</strong> ${params.projectId}</p>
  <p><strong>Project Name:</strong> ${params.projectName}</p>
  <p><strong>Client:</strong> ${params.clientName}</p>
  <p><strong>Submitted by:</strong> ${params.submittedBy}</p>
  <p><strong>Files attached:</strong> ${params.fileCount}</p>
  <p><strong>Submitted:</strong> ${params.time}</p>
</div>
<p style="margin-top: 20px;"><strong>Next steps:</strong> Admin review and engineer assignment</p>
<p style="margin-top: 20px;">
  <a href="https://aceservices.com/projects/${params.projectId}" class="email-button">View Project</a>
</p>
    `;
    return wrapTemplate(`New Project Submitted - ${params.projectId}`, mainContent, 'New project submission');
  }

  static projectStatusChanged(params: {
    projectId: string;
    projectName: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    time: string;
    nextSteps: string;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3>Project Status Updated</h3>
<p>Your project status has been updated.</p>
<div class="highlight-box">
  <p><strong>Project Reference:</strong> ${params.projectId}</p>
  <p><strong>Project Name:</strong> ${params.projectName}</p>
  <p><strong>Previous Status:</strong> ${params.oldStatus}</p>
  <p><strong>New Status:</strong> ${params.newStatus}</p>
  <p><strong>Updated by:</strong> ${params.changedBy}</p>
  <p><strong>Updated:</strong> ${params.time}</p>
</div>
<p style="margin-top: 20px;"><strong>Next steps:</strong> ${params.nextSteps}</p>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">View Project</a>
</p>
    `;
    return wrapTemplate(`Project Status Updated - ${params.projectId}`, mainContent, 'Project status change notification');
  }

  static projectAssigned(params: {
    projectId: string;
    projectName: string;
    engineerName: string;
    deadline: string;
    clientName: string;
    clientEmail: string;
    fileCount: number;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #155724;">New Project Assigned</h3>
<p>A new project has been assigned to you.</p>
<div class="highlight-box" style="background-color: #d4edda; border-color: #c3e6cb;">
  <p><strong>Project Reference:</strong> ${params.projectId}</p>
  <p><strong>Project Name:</strong> ${params.projectName}</p>
  <p><strong>Client:</strong> ${params.clientName}</p>
  <p><strong>Client Email:</strong> ${params.clientEmail}</p>
  <p><strong>Deadline:</strong> ${params.deadline}</p>
  <p><strong>Files to review:</strong> ${params.fileCount}</p>
</div>
<p style="margin-top: 20px;">Please log in to the portal to review project details and begin work.</p>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">View Project</a>
</p>
    `;
    return wrapTemplate(`New Project Assigned - ${params.projectId}`, mainContent, 'New project assignment');
  }

  static projectApproved(params: {
    projectId: string;
    projectName: string;
    approvedBy: string;
    time: string;
    nextSteps: string;
    expectedDelivery: string;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #155724;">Great News! Project Approved</h3>
<p>Your project has been approved!</p>
<div class="highlight-box" style="background-color: #d4edda; border-color: #c3e6cb;">
  <p><strong>Project Reference:</strong> ${params.projectId}</p>
  <p><strong>Project Name:</strong> ${params.projectName}</p>
  <p><strong>Approved by:</strong> ${params.approvedBy}</p>
  <p><strong>Approved:</strong> ${params.time}</p>
  <p><strong>Expected delivery:</strong> ${params.expectedDelivery}</p>
</div>
<p style="margin-top: 20px;"><strong>Next steps:</strong> ${params.nextSteps}</p>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">View Project</a>
</p>
    `;
    return wrapTemplate(`Great News! Project Approved - ${params.projectId}`, mainContent, 'Project approved');
  }

  static projectRejected(params: {
    projectId: string;
    projectName: string;
    reason: string;
    feedback: string;
    supportEmail: string;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #856404;">Project Changes Required</h3>
<p>Your project requires modifications before approval.</p>
<div class="highlight-box" style="background-color: #fff3cd; border-color: #ffc107;">
  <p><strong>Project Reference:</strong> ${params.projectId}</p>
  <p><strong>Project Name:</strong> ${params.projectName}</p>
  <p><strong>Status:</strong> CHANGES REQUIRED</p>
  <p><strong>Reason:</strong> ${params.reason}</p>
</div>
<p style="margin-top: 20px;"><strong>Feedback:</strong></p>
<p style="margin-left: 20px; border-left: 3px solid #ffc107; padding-left: 12px;">${params.feedback}</p>
<p style="margin-top: 20px;">Please resubmit your project with the requested changes.</p>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">View Project</a>
</p>
<p style="margin-top: 20px; font-size: 14px;">
  For assistance, contact: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate(`Project Changes Required - ${params.projectId}`, mainContent, 'Project requires changes');
  }

  static projectCompleted(params: {
    projectId: string;
    projectName: string;
    completedOn: string;
    feedbackLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #155724;">Project Completed!</h3>
<p>Your project has been successfully completed!</p>
<div class="highlight-box" style="background-color: #d4edda; border-color: #28a745;">
  <p><strong>Project Reference:</strong> ${params.projectId}</p>
  <p><strong>Project Name:</strong> ${params.projectName}</p>
  <p><strong>Completed on:</strong> ${params.completedOn}</p>
</div>
<p style="margin-top: 20px;">We would greatly appreciate your feedback on this project.</p>
<p style="margin-top: 20px;">
  <a href="${params.feedbackLink}" class="email-button">Share Feedback</a>
</p>
<p style="margin-top: 30px; font-size: 14px; color: #666;">Thank you for using ACE Services!</p>
    `;
    return wrapTemplate(`Project Completed! - ${params.projectId}`, mainContent, 'Project successfully completed');
  }

  // ============ RFI EMAILS ============

  static rfiCreated(params: {
    rfiId: string;
    projectId: string;
    title: string;
    question: string;
    deadline?: string;
    attachmentName?: string;
    attachmentUrl?: string;
    responseLink: string;
    portalLink: string;
  }): EmailTemplate {
    const attachmentHtml = params.attachmentName
      ? `<p><strong>Attachment:</strong> ${params.attachmentName}${params.attachmentUrl ? `<br/><a href="${params.attachmentUrl}" style="color: #FF8C00; text-decoration: none;">📥 Download File</a>` : ''}</p>`
      : '';
    const deadlineHtml = params.deadline
      ? `<p><strong>Response deadline:</strong> ${params.deadline}</p>`
      : '';

    const mainContent = `
<h3>Request for Information</h3>
<p>We need clarification on the following:</p>
<div class="highlight-box">
  <p><strong>RFI Reference:</strong> ${params.rfiId}</p>
  <p><strong>Title:</strong> ${params.title}</p>
  <p><strong>Question:</strong></p>
  <p style="margin-left: 20px;">${params.question}</p>
  ${attachmentHtml}
  ${deadlineHtml}
</div>
<p style="margin-top: 20px;">
  <a href="${params.responseLink}" class="email-button">Respond to RFI</a>
</p>
<p style="margin-top: 20px; font-size: 14px;">
  Or reply to this email with your response.
</p>
    `;
    return wrapTemplate(`Request for Information - ${params.projectId}`, mainContent, 'RFI response required');
  }

  static rfiAnswered(params: {
    rfiId: string;
    projectId: string;
    title: string;
    question: string;
    answer: string;
    answeredOn: string;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #155724;">Your RFI Has Been Answered</h3>
<p>Your request for information has been answered.</p>
<div class="highlight-box" style="background-color: #d4edda; border-color: #c3e6cb;">
  <p><strong>RFI Reference:</strong> ${params.rfiId}</p>
  <p><strong>Title:</strong> ${params.title}</p>
  <p><strong>Original Question:</strong></p>
  <p style="margin-left: 20px; font-style: italic;">${params.question}</p>
</div>
<p style="margin-top: 20px;"><strong>Answer:</strong></p>
<p>${params.answer}</p>
<p style="margin-top: 20px; font-size: 12px; color: #666;">Answered on: ${params.answeredOn}</p>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">View Full RFI</a>
</p>
    `;
    return wrapTemplate(`Your RFI Has Been Answered - ${params.projectId}`, mainContent, 'RFI answered');
  }

  static rfiOverdue(params: {
    rfiId: string;
    projectId: string;
    title: string;
    originalDeadline: string;
    daysOverdue: number;
    contactEmail: string;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #721c24;">URGENT: RFI Response Overdue</h3>
<p>Your RFI response is now <strong>OVERDUE</strong>.</p>
<div class="highlight-box" style="background-color: #f8d7da; border-color: #f5c6cb;">
  <p><strong>RFI Reference:</strong> ${params.rfiId}</p>
  <p><strong>Title:</strong> ${params.title}</p>
  <p><strong>Original deadline:</strong> ${params.originalDeadline}</p>
  <p style="color: #d9534f;"><strong>Days overdue:</strong> ${params.daysOverdue}</p>
</div>
<p style="margin-top: 20px; color: #d9534f; font-weight: 600;">Please provide your response urgently to avoid project delays.</p>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">Respond Now</a>
</p>
<p style="margin-top: 20px; font-size: 14px;">
  Or contact: <a href="mailto:${params.contactEmail}">${params.contactEmail}</a>
</p>
    `;
    return wrapTemplate(`URGENT: RFI Response Overdue - ${params.projectId}`, mainContent, 'RFI overdue');
  }

  static rfiForwarded(params: {
    rfiId: string;
    projectId: string;
    title: string;
    question: string;
    clientName: string;
    clientEmail: string;
    forwardedOn: string;
    responseDeadline: string;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3>Request for Information</h3>
<p>Dear ${params.clientName},</p>
<p>Our engineering team is currently working on your project <strong>${params.projectId}</strong>.</p>
<p>To ensure complete accuracy, we kindly request clarification on the following:</p>
<div class="highlight-box">
  <p><strong>Title:</strong> ${params.title}</p>
  <p><strong>Question:</strong></p>
  <p style="margin-left: 20px;">${params.question}</p>
</div>
<p style="margin-top: 20px;">
  <strong>Please reply directly to this email or respond through the portal:</strong>
</p>
<p style="margin: 15px 0;">
  <a href="${params.portalLink}" class="email-button">Respond in Portal</a>
</p>
<p style="margin-top: 20px; font-size: 14px; color: #666;">
  <strong>Response Deadline:</strong> ${params.responseDeadline}
</p>
<p style="margin-top: 30px; font-size: 12px; color: #999;">
  Thank you for your prompt attention to this matter.
</p>
    `;
    return wrapTemplate(`Request for Information - ${params.projectId}`, mainContent, 'Clarification needed');
  }

  // ============ FILE EMAILS ============

  static fileUploaded(params: {
    fileName: string;
    projectId: string;
    uploadedBy: string;
    fileSize: string;
    fileType: string;
    uploadedOn: string;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3>File Uploaded</h3>
<p>New file uploaded to project:</p>
<div class="highlight-box">
  <p><strong>File Name:</strong> ${params.fileName}</p>
  <p><strong>File Size:</strong> ${params.fileSize}</p>
  <p><strong>File Type:</strong> ${params.fileType}</p>
  <p><strong>Uploaded by:</strong> ${params.uploadedBy}</p>
  <p><strong>Uploaded on:</strong> ${params.uploadedOn}</p>
</div>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">View File</a>
</p>
    `;
    return wrapTemplate(`File Uploaded - ${params.projectId}`, mainContent, 'New file available');
  }

  static clientDeliveryEmail(params: {
    projectId: string;
    projectName: string;
    fileCount: number;
    downloadLink: string;
    expiresOn: string;
    supportEmail: string;
  }): EmailTemplate {
    const mainContent = `
<h3 style="color: #155724;">Your Project Deliverables Are Ready!</h3>
<p>Your project deliverables have been sent and are ready for download.</p>
<div class="highlight-box" style="background-color: #d4edda; border-color: #28a745;">
  <p><strong>Project Reference:</strong> ${params.projectId}</p>
  <p><strong>Project Name:</strong> ${params.projectName}</p>
  <p><strong>Number of files:</strong> ${params.fileCount}</p>
</div>
<p style="margin-top: 20px;">
  <a href="${params.downloadLink}" class="email-button">Download Files</a>
</p>
<p style="color: #d9534f; margin-top: 20px; font-weight: 600;">
  Important: Download links expire on ${params.expiresOn}
</p>
<p style="margin-top: 20px; font-size: 14px;">
  If you have any questions, contact: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
</p>
    `;
    return wrapTemplate(`Your Project Deliverables Are Ready! - ${params.projectId}`, mainContent, 'Deliverables ready for download');
  }

  // ============ SUMMARY REPORT EMAILS ============

  static dailySummary(params: {
    date: string;
    projectsAdded: number;
    projectsCompleted: number;
    projectsInProgress: number;
    rfisReceived: number;
    rfisAnswered: number;
    filesUploaded: number;
    issueCount: number;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3>Daily Summary Report</h3>
<p><strong>${params.date}</strong></p>
<div class="highlight-box">
  <p><strong>Projects added:</strong> ${params.projectsAdded}</p>
  <p><strong>Projects completed:</strong> ${params.projectsCompleted}</p>
  <p><strong>Projects in progress:</strong> ${params.projectsInProgress}</p>
  <p><strong>RFIs received:</strong> ${params.rfisReceived}</p>
  <p><strong>RFIs answered:</strong> ${params.rfisAnswered}</p>
  <p><strong>Files uploaded:</strong> ${params.filesUploaded}</p>
  <p><strong>Issues/Alerts:</strong> <span style="color: ${params.issueCount > 0 ? '#d9534f' : '#28a745'};">${params.issueCount}</span></p>
</div>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">View Detailed Report</a>
</p>
    `;
    return wrapTemplate(`Daily Summary Report - ${params.date}`, mainContent, 'Today\'s activity summary');
  }

  static weeklySummary(params: {
    weekStart: string;
    weekEnd: string;
    projectsStarted: number;
    projectsCompleted: number;
    avgCompletionTime: string;
    atRiskCount: number;
    highPriorityCount: number;
    portalLink: string;
  }): EmailTemplate {
    const mainContent = `
<h3>Weekly Summary Report</h3>
<p><strong>${params.weekStart} to ${params.weekEnd}</strong></p>
<div class="highlight-box">
  <p><strong>Projects started:</strong> ${params.projectsStarted}</p>
  <p><strong>Projects completed:</strong> <span style="color: #28a745;">${params.projectsCompleted}</span></p>
  <p><strong>Average completion time:</strong> ${params.avgCompletionTime}</p>
  <p><strong>At risk (overdue):</strong> <span style="color: #d9534f;">${params.atRiskCount}</span></p>
  <p><strong>High priority:</strong> <span style="color: #ff9800;">${params.highPriorityCount}</span></p>
</div>
<p style="margin-top: 20px;">
  <a href="${params.portalLink}" class="email-button">View Detailed Report</a>
</p>
    `;
    return wrapTemplate(`Weekly Summary Report - Week of ${params.weekStart}`, mainContent, 'Weekly activity summary');
  }
}
