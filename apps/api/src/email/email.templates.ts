/**
 * Email Templates for All 54 Action Triggers
 * Organized by category with reusable template functions
 */

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export class EmailTemplates {
  // ============ AUTHENTICATION EMAILS ============

  static accountCreated(params: {
    firstName: string;
    email: string;
    role: string;
    supportEmail: string;
  }): EmailTemplate {
    const text = `
Welcome to ACE Services Portal!

Hello ${params.firstName},

Your account has been created successfully.

Email: ${params.email}
Role: ${params.role}

You can now log in at: https://aceservices.com/login

Important: Please change your password after your first login.

If you need any assistance, contact us at: ${params.supportEmail}

Best regards,
ACE Services Team
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>Welcome to ACE Services Portal!</h2>
    <p>Hello <strong>${params.firstName}</strong>,</p>
    <p>Your account has been created successfully.</p>
    <ul style="background-color: white; padding: 15px; border-radius: 3px;">
      <li><strong>Email:</strong> ${params.email}</li>
      <li><strong>Role:</strong> ${params.role}</li>
    </ul>
    <p style="margin-top: 20px;">
      <a href="https://aceservices.com/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Login Now</a>
    </p>
    <p style="font-size: 12px; color: #666; margin-top: 30px;">
      Need help? Contact us at <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
    </p>
  </div>
</div>
    `;

    return { subject: 'Welcome to ACE Services Portal - Account Created', text, html };
  }

  static loginNotification(params: {
    email: string;
    time: string;
    device: string;
    ip: string;
    supportEmail: string;
  }): EmailTemplate {
    const text = `
Login Notification - ACE Services Portal

You logged in to ACE Services Portal

Time: ${params.time}
Device: ${params.device}
IP Address: ${params.ip}

If this wasn't you, please reset your password immediately or contact support.

Support: ${params.supportEmail}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>Login Notification</h2>
    <p>You have successfully logged in to ACE Services Portal.</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Time:</strong> ${params.time}</p>
      <p><strong>Device:</strong> ${params.device}</p>
      <p><strong>IP Address:</strong> ${params.ip}</p>
    </div>
    <p style="color: #d9534f; margin-top: 20px;">
      <strong>If this wasn't you, please reset your password immediately.</strong>
    </p>
    <p>Contact support: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a></p>
  </div>
</div>
    `;

    return { subject: 'Login Detected - ACE Services Portal', text, html };
  }

  static failedLoginAlert(params: {
    email: string;
    attempts: number;
    time: string;
    supportEmail: string;
  }): EmailTemplate {
    const text = `
Failed Login Attempts Alert

Dear User,

We detected ${params.attempts} failed login attempts to your account.

Time of last attempt: ${params.time}

If this was you, please try again with your correct password.
If this wasn't you, please reset your password immediately: https://aceservices.com/forgot-password

Support: ${params.supportEmail}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107;">
    <h2>Failed Login Attempts Alert</h2>
    <p>We detected <strong>${params.attempts} failed login attempts</strong> to your account.</p>
    <p><strong>Time of last attempt:</strong> ${params.time}</p>
    <div style="margin-top: 20px; padding: 15px; background-color: white; border-radius: 3px;">
      <p>If this was you, please try again with your correct password.</p>
      <p style="color: #d9534f;">If this wasn't you, please reset your password immediately.</p>
      <p style="margin-top: 15px;">
        <a href="https://aceservices.com/forgot-password" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Reset Password</a>
      </p>
    </div>
  </div>
</div>
    `;

    return { subject: 'Failed Login Attempts Alert', text, html };
  }

  static accountLocked(params: {
    email: string;
    time: string;
    unlockTime: string;
    supportEmail: string;
  }): EmailTemplate {
    const text = `
Your Account Has Been Locked

Dear User,

Your account has been locked due to multiple failed login attempts.

Time locked: ${params.time}
Will be automatically unlocked: ${params.unlockTime}

Your account will be automatically unlocked in 15 minutes.

For immediate assistance, contact: ${params.supportEmail}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; border-left: 4px solid #f5c6cb;">
    <h2 style="color: #721c24;">Your Account Has Been Locked</h2>
    <p>Your account has been locked due to multiple failed login attempts.</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Time locked:</strong> ${params.time}</p>
      <p><strong>Will be automatically unlocked:</strong> ${params.unlockTime}</p>
    </div>
    <p>Your account will be automatically unlocked in 15 minutes.</p>
    <p>For immediate assistance, contact: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a></p>
  </div>
</div>
    `;

    return { subject: 'Your Account Has Been Locked', text, html };
  }

  static accountUnlocked(params: {
    email: string;
    time: string;
    supportEmail: string;
  }): EmailTemplate {
    const text = `
Your Account Has Been Unlocked

Dear User,

Your account is now unlocked and ready to use.

Time unlocked: ${params.time}

You can now log in with your credentials.

If you need any assistance: ${params.supportEmail}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #c3e6cb;">
    <h2 style="color: #155724;">Your Account Has Been Unlocked</h2>
    <p>Your account is now unlocked and ready to use.</p>
    <p><strong>Time unlocked:</strong> ${params.time}</p>
    <p style="margin-top: 20px;">
      <a href="https://aceservices.com/login" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Login Now</a>
    </p>
  </div>
</div>
    `;

    return { subject: 'Your Account Has Been Unlocked', text, html };
  }

  static passwordResetRequest(params: {
    resetLink: string;
    expiresIn: string;
    supportEmail: string;
  }): EmailTemplate {
    const text = `
Reset Your Password - ACE Services Portal

Click the link below to reset your password:

${params.resetLink}

This link expires in ${params.expiresIn}.

If you didn't request this, please ignore this email.
Your password will only change if you click the link and confirm the new password.

For security questions: ${params.supportEmail}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password.</p>
    <p style="margin-top: 20px;">
      <a href="${params.resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 3px; display: inline-block;">Reset Password</a>
    </p>
    <p style="color: #666; font-size: 12px; margin-top: 20px;">
      This link expires in <strong>${params.expiresIn}</strong>.
    </p>
    <p style="color: #666; font-size: 12px; margin-top: 10px;">
      If you didn't request this, please ignore this email. Your password will only change if you click the link and confirm the new password.
    </p>
    <p style="margin-top: 20px; font-size: 12px;">
      Questions? Contact us at <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
    </p>
  </div>
</div>
    `;

    return { subject: 'Reset Your Password - ACE Services Portal', text, html };
  }

  static passwordChanged(params: {
    email: string;
    time: string;
    supportEmail: string;
  }): EmailTemplate {
    const text = `
Your Password Has Been Changed

Dear User,

Your password was successfully changed on ${params.time}.

Your old password is no longer valid.

If you didn't make this change, please contact support immediately.

Support: ${params.supportEmail}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #c3e6cb;">
    <h2>Your Password Has Been Changed</h2>
    <p>Your password was successfully changed on <strong>${params.time}</strong>.</p>
    <p style="color: #666;">Your old password is no longer valid.</p>
    <p style="margin-top: 20px; color: #d9534f;">
      <strong>If you didn't make this change, please contact support immediately.</strong>
    </p>
    <p style="margin-top: 20px;">
      <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
    </p>
  </div>
</div>
    `;

    return { subject: 'Your Password Has Been Changed', text, html };
  }

  static accountDeactivated(params: {
    email: string;
    time: string;
    reason?: string;
    supportEmail: string;
  }): EmailTemplate {
    const reasonText = params.reason ? `\nReason: ${params.reason}` : '';
    const text = `
Your Account Has Been Deactivated

Dear User,

Your account has been deactivated effective ${params.time}.${reasonText}

You no longer have access to ACE Services Portal.

To reactivate your account, contact: ${params.supportEmail}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; border-left: 4px solid #f5c6cb;">
    <h2 style="color: #721c24;">Your Account Has Been Deactivated</h2>
    <p>Your account has been deactivated effective <strong>${params.time}</strong>.</p>
    ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ''}
    <p style="margin-top: 20px;">You no longer have access to ACE Services Portal.</p>
    <p style="margin-top: 20px;">
      To reactivate your account, contact: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
    </p>
  </div>
</div>
    `;

    return { subject: 'Your Account Has Been Deactivated', text, html };
  }

  static accountReactivated(params: {
    email: string;
    time: string;
    loginLink: string;
  }): EmailTemplate {
    const text = `
Your Account Has Been Reactivated

Dear User,

Your account has been reactivated on ${params.time}.

You can now log in to ACE Services Portal.

${params.loginLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #c3e6cb;">
    <h2 style="color: #155724;">Your Account Has Been Reactivated</h2>
    <p>Your account has been reactivated on <strong>${params.time}</strong>.</p>
    <p style="margin-top: 20px;">You can now log in to ACE Services Portal.</p>
    <p style="margin-top: 20px;">
      <a href="${params.loginLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Login Now</a>
    </p>
  </div>
</div>
    `;

    return { subject: 'Your Account Has Been Reactivated', text, html };
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
    const text = `
New Project Submitted - ${params.projectId}

A new project has been submitted:

Project Reference: ${params.projectId}
Project Name: ${params.projectName}
Client: ${params.clientName}
Submitted by: ${params.submittedBy}
Files attached: ${params.fileCount}
Submitted: ${params.time}

Next steps: Admin review and engineer assignment

View in portal: https://aceservices.com/projects/${params.projectId}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>New Project Submitted</h2>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Project Reference:</strong> ${params.projectId}</p>
      <p><strong>Project Name:</strong> ${params.projectName}</p>
      <p><strong>Client:</strong> ${params.clientName}</p>
      <p><strong>Submitted by:</strong> ${params.submittedBy}</p>
      <p><strong>Files attached:</strong> ${params.fileCount}</p>
      <p><strong>Submitted:</strong> ${params.time}</p>
    </div>
    <p style="margin-top: 20px;">Next steps: Admin review and engineer assignment</p>
    <p style="margin-top: 20px;">
      <a href="https://aceservices.com/projects/${params.projectId}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View Project</a>
    </p>
  </div>
</div>
    `;

    return { subject: `New Project Submitted - ${params.projectId}`, text, html };
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
    const text = `
Project Status Updated - ${params.projectId}

Your project status has been updated.

Project Reference: ${params.projectId}
Project Name: ${params.projectName}
Previous Status: ${params.oldStatus}
New Status: ${params.newStatus}
Updated by: ${params.changedBy}
Updated: ${params.time}

Next steps: ${params.nextSteps}

View in portal: ${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>Project Status Updated</h2>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Project Reference:</strong> ${params.projectId}</p>
      <p><strong>Project Name:</strong> ${params.projectName}</p>
      <p><strong>Previous Status:</strong> ${params.oldStatus}</p>
      <p><strong>New Status:</strong> <span style="background-color: #28a745; color: white; padding: 3px 8px; border-radius: 3px;">${params.newStatus}</span></p>
      <p><strong>Updated by:</strong> ${params.changedBy}</p>
      <p><strong>Updated:</strong> ${params.time}</p>
    </div>
    <p><strong>Next steps:</strong> ${params.nextSteps}</p>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View Project</a>
    </p>
  </div>
</div>
    `;

    return { subject: `Project Status Updated - ${params.projectId}`, text, html };
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
    const text = `
New Project Assigned - ${params.projectId}

A new project has been assigned to you.

Project Reference: ${params.projectId}
Project Name: ${params.projectName}
Client: ${params.clientName}
Client Email: ${params.clientEmail}
Deadline: ${params.deadline}
Files to review: ${params.fileCount}

Please log in to the portal to review project details and begin work.

${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #c3e6cb;">
    <h2 style="color: #155724;">New Project Assigned</h2>
    <p>A new project has been assigned to you.</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Project Reference:</strong> ${params.projectId}</p>
      <p><strong>Project Name:</strong> ${params.projectName}</p>
      <p><strong>Client:</strong> ${params.clientName}</p>
      <p><strong>Client Email:</strong> ${params.clientEmail}</p>
      <p><strong>Deadline:</strong> ${params.deadline}</p>
      <p><strong>Files to review:</strong> ${params.fileCount}</p>
    </div>
    <p style="margin-top: 20px;">Please log in to the portal to review project details and begin work.</p>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View Project</a>
    </p>
  </div>
</div>
    `;

    return { subject: `New Project Assigned - ${params.projectId}`, text, html };
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
    const text = `
Great News! Project Approved - ${params.projectId}

Your project has been approved!

Project Reference: ${params.projectId}
Project Name: ${params.projectName}
Approved by: ${params.approvedBy}
Approved: ${params.time}
Expected delivery: ${params.expectedDelivery}

Next steps: ${params.nextSteps}

View in portal: ${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #c3e6cb;">
    <h2 style="color: #155724;">Great News! Project Approved</h2>
    <p>Your project has been approved!</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Project Reference:</strong> ${params.projectId}</p>
      <p><strong>Project Name:</strong> ${params.projectName}</p>
      <p><strong>Approved by:</strong> ${params.approvedBy}</p>
      <p><strong>Approved:</strong> ${params.time}</p>
      <p><strong>Expected delivery:</strong> ${params.expectedDelivery}</p>
    </div>
    <p><strong>Next steps:</strong> ${params.nextSteps}</p>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View Project</a>
    </p>
  </div>
</div>
    `;

    return { subject: `Great News! Project Approved - ${params.projectId}`, text, html };
  }

  static projectRejected(params: {
    projectId: string;
    projectName: string;
    reason: string;
    feedback: string;
    supportEmail: string;
    portalLink: string;
  }): EmailTemplate {
    const text = `
Project Changes Required - ${params.projectId}

Your project requires modifications before approval.

Project Reference: ${params.projectId}
Project Name: ${params.projectName}
Status: CHANGES REQUIRED

Reason: ${params.reason}

Feedback:
${params.feedback}

Please resubmit your project with the requested changes.

For assistance, contact: ${params.supportEmail}
View in portal: ${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107;">
    <h2 style="color: #856404;">Project Changes Required</h2>
    <p>Your project requires modifications before approval.</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Project Reference:</strong> ${params.projectId}</p>
      <p><strong>Project Name:</strong> ${params.projectName}</p>
      <p><strong>Status:</strong> CHANGES REQUIRED</p>
      <p><strong>Reason:</strong> ${params.reason}</p>
    </div>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #ffc107;">
      <p><strong>Feedback:</strong></p>
      <p>${params.feedback}</p>
    </div>
    <p>Please resubmit your project with the requested changes.</p>
    <p style="margin-top: 20px;">For assistance, contact: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a></p>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View Project</a>
    </p>
  </div>
</div>
    `;

    return { subject: `Project Changes Required - ${params.projectId}`, text, html };
  }

  static projectCompleted(params: {
    projectId: string;
    projectName: string;
    completedOn: string;
    feedbackLink: string;
  }): EmailTemplate {
    const text = `
Project Completed! - ${params.projectId}

Your project has been successfully completed!

Project Reference: ${params.projectId}
Project Name: ${params.projectName}
Completed on: ${params.completedOn}

We would greatly appreciate your feedback on this project.

Share feedback: ${params.feedbackLink}

Thank you for using ACE Services!
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
    <h2 style="color: #155724;">Project Completed!</h2>
    <p>Your project has been successfully completed!</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Project Reference:</strong> ${params.projectId}</p>
      <p><strong>Project Name:</strong> ${params.projectName}</p>
      <p><strong>Completed on:</strong> ${params.completedOn}</p>
    </div>
    <p style="margin-top: 20px;">We would greatly appreciate your feedback on this project.</p>
    <p style="margin-top: 20px;">
      <a href="${params.feedbackLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Share Feedback</a>
    </p>
    <p style="margin-top: 30px; font-size: 12px; color: #666;">Thank you for using ACE Services!</p>
  </div>
</div>
    `;

    return { subject: `Project Completed! - ${params.projectId}`, text, html };
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
    const deadlineText = params.deadline ? `\nDeadline: ${params.deadline}` : '';
    const attachmentText = params.attachmentName 
      ? `\nAttachment: ${params.attachmentName}${params.attachmentUrl ? `\nDownload: ${params.attachmentUrl}` : ''}` 
      : '';

    const text = `
Request for Information - ${params.projectId}

We need clarification on the following:

RFI Reference: ${params.rfiId}
Title: ${params.title}
Question: ${params.question}${attachmentText}${deadlineText}

Please respond to this RFI at: ${params.responseLink}

Or reply to this email with your response.

View in portal: ${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>Request for Information</h2>
    <p>We need clarification on the following:</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0; border-left: 4px solid #007bff;">
      <p><strong>RFI Reference:</strong> ${params.rfiId}</p>
      <p><strong>Title:</strong> ${params.title}</p>
      <p><strong>Question:</strong></p>
      <p style="margin-left: 20px;">${params.question}</p>
      ${params.attachmentName ? `<p><strong>Attachment:</strong> ${params.attachmentName}${params.attachmentUrl ? `<br/><a href="${params.attachmentUrl}" style="color: #007bff; text-decoration: none;">📥 Download File</a>` : ''}</p>` : ''}
      ${params.deadline ? `<p><strong>Response deadline:</strong> ${params.deadline}</p>` : ''}
    </div>
    <p style="margin-top: 20px;">
      <a href="${params.responseLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Respond to RFI</a>
    </p>
    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      Or reply to this email with your response.
    </p>
  </div>
</div>
    `;

    return { subject: `Request for Information - ${params.projectId}`, text, html };
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
    const text = `
Your RFI Has Been Answered - ${params.projectId}

Your request for information has been answered:

RFI Reference: ${params.rfiId}
Title: ${params.title}

Original Question:
${params.question}

Answer:
${params.answer}

Answered on: ${params.answeredOn}

View in portal: ${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #c3e6cb;">
    <h2 style="color: #155724;">Your RFI Has Been Answered</h2>
    <p>Your request for information has been answered.</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>RFI Reference:</strong> ${params.rfiId}</p>
      <p><strong>Title:</strong> ${params.title}</p>
      <p><strong>Original Question:</strong></p>
      <p style="margin-left: 20px; font-style: italic;">${params.question}</p>
    </div>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Answer:</strong></p>
      <p>${params.answer}</p>
    </div>
    <p style="font-size: 12px; color: #666;">Answered on: ${params.answeredOn}</p>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View Full RFI</a>
    </p>
  </div>
</div>
    `;

    return { subject: `Your RFI Has Been Answered - ${params.projectId}`, text, html };
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
    const text = `
URGENT: RFI Response Overdue - ${params.projectId}

Your RFI response is now OVERDUE.

RFI Reference: ${params.rfiId}
Title: ${params.title}
Original deadline: ${params.originalDeadline}
Days overdue: ${params.daysOverdue}

Please provide your response urgently to avoid project delays.

Respond now: ${params.portalLink}

Or contact: ${params.contactEmail}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; border-left: 4px solid #f5c6cb;">
    <h2 style="color: #721c24;">URGENT: RFI Response Overdue</h2>
    <p>Your RFI response is now <strong>OVERDUE</strong>.</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>RFI Reference:</strong> ${params.rfiId}</p>
      <p><strong>Title:</strong> ${params.title}</p>
      <p><strong>Original deadline:</strong> ${params.originalDeadline}</p>
      <p style="color: #d9534f;"><strong>Days overdue:</strong> ${params.daysOverdue}</p>
    </div>
    <p style="margin-top: 20px; color: #d9534f;"><strong>Please provide your response urgently to avoid project delays.</strong></p>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Respond Now</a>
    </p>
    <p style="margin-top: 20px;">Or contact: <a href="mailto:${params.contactEmail}">${params.contactEmail}</a></p>
  </div>
</div>
    `;

    return { subject: `URGENT: RFI Response Overdue - ${params.projectId}`, text, html };
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
    const text = `
Request for Information - ${params.projectId}

Dear ${params.clientName},

Our engineering team is currently working on your project (${params.projectId}).

To ensure complete accuracy, we kindly request clarification on the following:

Title: ${params.title}

Question: ${params.question}

Please reply directly to this email or respond through the portal:
${params.portalLink}

Response Deadline: ${params.responseDeadline}

Thank you for your prompt attention to this matter.

Best regards,
Engineering Team
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>Request for Information</h2>
    <p>Dear ${params.clientName},</p>
    <p>Our engineering team is currently working on your project <strong>${params.projectId}</strong>.</p>
    <p>To ensure complete accuracy, we kindly request clarification on the following:</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #007bff;">
      <p><strong>Title:</strong> ${params.title}</p>
      <p><strong>Question:</strong></p>
      <p>${params.question}</p>
    </div>
    <p style="margin-top: 20px;">
      <strong>Please reply directly to this email or respond through the portal:</strong>
    </p>
    <p style="margin: 15px 0;">
      <a href="${params.portalLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Respond in Portal</a>
    </p>
    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      <strong>Response Deadline:</strong> ${params.responseDeadline}
    </p>
    <p style="margin-top: 30px; font-size: 12px; color: #999;">
      Thank you for your prompt attention to this matter.
    </p>
  </div>
</div>
    `;

    return { subject: `Request for Information - ${params.projectId}`, text, html };
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
    const text = `
File Uploaded - ${params.projectId}

New file uploaded to project:

File Name: ${params.fileName}
File Size: ${params.fileSize}
File Type: ${params.fileType}
Uploaded by: ${params.uploadedBy}
Uploaded on: ${params.uploadedOn}

View in portal: ${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>File Uploaded</h2>
    <p>New file uploaded to project:</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>File Name:</strong> ${params.fileName}</p>
      <p><strong>File Size:</strong> ${params.fileSize}</p>
      <p><strong>File Type:</strong> ${params.fileType}</p>
      <p><strong>Uploaded by:</strong> ${params.uploadedBy}</p>
      <p><strong>Uploaded on:</strong> ${params.uploadedOn}</p>
    </div>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View File</a>
    </p>
  </div>
</div>
    `;

    return { subject: `File Uploaded - ${params.projectId}`, text, html };
  }

  static clientDeliveryEmail(params: {
    projectId: string;
    projectName: string;
    fileCount: number;
    downloadLink: string;
    expiresOn: string;
    supportEmail: string;
  }): EmailTemplate {
    const text = `
Your Project Deliverables Are Ready! - ${params.projectId}

Your project deliverables have been sent and are ready for download.

Project Reference: ${params.projectId}
Project Name: ${params.projectName}
Number of files: ${params.fileCount}

Download your files: ${params.downloadLink}

Important: Downloads links expire on ${params.expiresOn}

If you have any questions, contact: ${params.supportEmail}

Thank you!
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
    <h2 style="color: #155724;">Your Project Deliverables Are Ready!</h2>
    <p>Your project deliverables have been sent and are ready for download.</p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <p><strong>Project Reference:</strong> ${params.projectId}</p>
      <p><strong>Project Name:</strong> ${params.projectName}</p>
      <p><strong>Number of files:</strong> ${params.fileCount}</p>
    </div>
    <p style="margin-top: 20px;">
      <a href="${params.downloadLink}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 3px; display: inline-block; font-weight: bold;">Download Files</a>
    </p>
    <p style="color: #d9534f; margin-top: 20px; font-weight: bold;">
      Important: Download links expire on ${params.expiresOn}
    </p>
    <p style="margin-top: 20px; font-size: 12px; color: #666;">
      If you have any questions, contact: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a>
    </p>
  </div>
</div>
    `;

    return { subject: `Your Project Deliverables Are Ready! - ${params.projectId}`, text, html };
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
    const text = `
Daily Summary Report - ${params.date}

Today's Activity:

Projects added: ${params.projectsAdded}
Projects completed: ${params.projectsCompleted}
Projects in progress: ${params.projectsInProgress}
RFIs received: ${params.rfisReceived}
RFIs answered: ${params.rfisAnswered}
Files uploaded: ${params.filesUploaded}
Issues/Alerts: ${params.issueCount}

View detailed report in portal: ${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>Daily Summary Report</h2>
    <p><strong>${params.date}</strong></p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px;"><strong>Projects added:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong>${params.projectsAdded}</strong></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 8px;"><strong>Projects completed:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong>${params.projectsCompleted}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>Projects in progress:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong>${params.projectsInProgress}</strong></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 8px;"><strong>RFIs received:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong>${params.rfisReceived}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>RFIs answered:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong>${params.rfisAnswered}</strong></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 8px;"><strong>Files uploaded:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong>${params.filesUploaded}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>Issues/Alerts:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong style="color: ${params.issueCount > 0 ? '#d9534f' : '#28a745'}">${params.issueCount}</strong></td>
        </tr>
      </table>
    </div>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View Detailed Report</a>
    </p>
  </div>
</div>
    `;

    return { subject: `Daily Summary Report - ${params.date}`, text, html };
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
    const text = `
Weekly Summary Report - ${params.weekStart} to ${params.weekEnd}

This week:

Projects started: ${params.projectsStarted}
Projects completed: ${params.projectsCompleted}
Average completion time: ${params.avgCompletionTime}
At risk (overdue): ${params.atRiskCount}
High priority: ${params.highPriorityCount}

View detailed report: ${params.portalLink}
    `;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f0f4f8; padding: 20px; border-radius: 5px;">
    <h2>Weekly Summary Report</h2>
    <p><strong>${params.weekStart} to ${params.weekEnd}</strong></p>
    <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px;">Projects started:</td>
          <td style="padding: 8px; text-align: right;"><strong>${params.projectsStarted}</strong></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 8px;">Projects completed:</td>
          <td style="padding: 8px; text-align: right;"><strong style="color: #28a745;">${params.projectsCompleted}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px;">Average completion time:</td>
          <td style="padding: 8px; text-align: right;"><strong>${params.avgCompletionTime}</strong></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 8px; color: #d9534f;">At risk (overdue):</td>
          <td style="padding: 8px; text-align: right;"><strong style="color: #d9534f;">${params.atRiskCount}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #ff9800;">High priority:</td>
          <td style="padding: 8px; text-align: right;"><strong style="color: #ff9800;">${params.highPriorityCount}</strong></td>
        </tr>
      </table>
    </div>
    <p style="margin-top: 20px;">
      <a href="${params.portalLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View Detailed Report</a>
    </p>
  </div>
</div>
    `;

    return { subject: `Weekly Summary Report - Week of ${params.weekStart}`, text, html };
  }
}
