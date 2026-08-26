/**
 * EMAIL SYSTEM TESTING GUIDE
 * 
 * This guide documents how to trigger and verify all email types in the system.
 * In DEMO mode (default), all emails are logged to the console.
 * 
 * Email Output Format:
 * ================== 📧 EMAIL DISPATCH (DEMO MODE) ==================
 * To:          user@example.com
 * From:        noreply@yourdomain.com
 * Subject:     Email Subject
 * Attachments: None
 * --- Body ---
 * [Email body content]
 * ==================================================================
 */

/**
 * EMAIL TYPE 1: ACCOUNT LOCKED EMAIL
 * ===================================
 * Trigger: 5 failed login attempts from same email
 * 
 * Steps to Test:
 * 1. Run POST /api/auth/login with correct email but wrong password 5 times
 * 2. Watch backend console for email output
 * 3. Verify email contains:
 *    - Account locked message
 *    - Lockout duration (15 minutes)
 *    - Number of failed attempts (5)
 * 
 * API Call:
 * POST /api/auth/login
 * Body: {
 *   "email": "test@example.com",
 *   "password": "wrongpassword"
 * }
 * 
 * Expected: After 5th attempt, 403 Forbidden with account locked message
 * Email Check: Backend console shows account locked email
 */

/**
 * EMAIL TYPE 2: PASSWORD RESET EMAIL
 * ===================================
 * Trigger: User submits forgot password form
 * 
 * Steps to Test:
 * 1. Run POST /api/auth/forgot-password
 * 2. Watch backend console for email
 * 3. Verify email contains:
 *    - Reset password link with token
 *    - Link expiration time (60 minutes)
 *    - Security message
 * 
 * API Call:
 * POST /api/auth/forgot-password
 * Body: {
 *   "email": "user@example.com"
 * }
 * 
 * Expected: 200 OK
 * Email Check: Backend console shows password reset email
 *              Email contains reset link: /reset-password?token=...
 */

/**
 * EMAIL TYPE 3: PROJECT STATUS CHANGE EMAIL
 * ==========================================
 * Trigger: Project status is updated to approved/declined/sent_to_client
 * 
 * Steps to Test:
 * 1. Get a project ID using GET /api/projects
 * 2. Update project status using PATCH /api/projects/{id}
 * 3. Watch backend console for email
 * 4. Verify email contains:
 *    - Project reference number
 *    - New status
 *    - Status changed by (user name)
 *    - Timestamp
 * 
 * API Call:
 * PATCH /api/projects/{projectId}
 * Body: {
 *   "status": "approved"
 * }
 * 
 * Expected: 200 OK
 * Email Check: Backend console shows status change email
 *              Email sent to project client
 */

/**
 * EMAIL TYPE 4: RFI CREATED EMAIL
 * ===============================
 * Trigger: New RFI (Request for Information) is created
 * 
 * Steps to Test:
 * 1. Create RFI using POST /api/projects/{projectId}/rfis
 * 2. Watch backend console for email
 * 3. Verify email contains:
 *    - RFI title
 *    - Question/request text
 *    - Project reference
 *    - Link to respond
 *    - Attachments (if included)
 * 
 * API Call:
 * POST /api/projects/{projectId}/rfis
 * Body: {
 *   "title": "Clarification needed on scope",
 *   "question": "Can you clarify the requirements for section 2?",
 *   "attachmentName": "scope-document.pdf" (optional)
 * }
 * 
 * Expected: 201 Created
 * Email Check: Backend console shows RFI created email
 *              Email sent to client for response
 */

/**
 * EMAIL TYPE 5: RFI ANSWERED EMAIL
 * ================================
 * Trigger: Admin answers an RFI
 * 
 * Steps to Test:
 * 1. Create RFI first (see EMAIL TYPE 4)
 * 2. Answer RFI using PATCH /api/projects/{projectId}/rfis/{rfiId}
 * 3. Watch backend console for email
 * 4. Verify email contains:
 *    - Original RFI question
 *    - Admin's answer
 *    - Project reference
 *    - Timestamp
 * 
 * API Call:
 * PATCH /api/projects/{projectId}/rfis/{rfiId}
 * Body: {
 *   "adminAnswer": "The requirements for section 2 include..."
 * }
 * 
 * Expected: 200 OK
 * Email Check: Backend console shows RFI answered email
 *              Email sent to client with answer
 */

/**
 * EMAIL TYPE 6: RFI FORWARDED TO CLIENT EMAIL
 * ===========================================
 * Trigger: RFI is forwarded to client for response
 * 
 * Steps to Test:
 * 1. Create RFI (see EMAIL TYPE 4)
 * 2. Forward to client using POST /api/projects/{projectId}/rfis/{rfiId}/forward
 * 3. Watch backend console for email
 * 4. Verify email contains:
 *    - Full RFI details
 *    - Request for client response
 *    - Project reference
 *    - Deadline (if any)
 * 
 * API Call:
 * POST /api/projects/{projectId}/rfis/{rfiId}/forward
 * Body: {
 *   "deadline": "2026-09-15" (optional)
 * }
 * 
 * Expected: 200 OK
 * Email Check: Backend console shows RFI forwarded email
 *              Email sent to client to request information
 */

/**
 * EMAIL TYPE 7: CLIENT DELIVERY EMAIL
 * ===================================
 * Trigger: Deliverables are sent to client
 * 
 * Steps to Test:
 * 1. Upload deliverable files as engineer
 * 2. Send to client using POST /api/projects/{projectId}/send-to-client
 * 3. Watch backend console for email
 * 4. Verify email contains:
 *    - List of deliverable files
 *    - Download links (appear as /api/files/download?key=...)
 *    - Project reference and details
 *    - Link expiration time (72 hours)
 *    - Support contact information
 * 
 * API Call:
 * POST /api/projects/{projectId}/send-to-client
 * Body: {
 *   "recipientEmail": "client@example.com",
 *   "subject": "Your Project Deliverables"
 * }
 * 
 * Expected: 201 Created
 * Email Check: Backend console shows client delivery email
 *              Email contains file download links
 *              ClientDeliveryLog entry created in database
 */

/**
 * TESTING WORKFLOW
 * ================
 * 
 * 1. Start Both Servers:
 *    Terminal 1: cd apps/api && npm run dev
 *    Terminal 2: cd apps/web && npm run dev
 * 
 * 2. Monitor Email Output:
 *    Keep backend console visible to see emails as they're sent
 * 
 * 3. Trigger Each Email Type:
 *    Use curl, Postman, or the frontend to trigger each email
 * 
 * 4. Verify Email Content:
 *    Copy email from console and verify all required fields are present
 * 
 * 5. Check Database:
 *    Run: npm run prisma:studio
 *    Verify audit logs and delivery logs are created
 */

/**
 * EMAIL TESTING CHECKLIST
 * =======================
 */

const emailTestingChecklist = {
  'Account Locked Email': {
    trigger: 'POST /api/auth/login (5 failed attempts)',
    verifyFields: [
      'Account locked message',
      'Lockout duration (15 minutes)',
      'Failed attempt count',
    ],
    databaseCheck: 'users.lockoutUntil should be set',
  },
  'Password Reset Email': {
    trigger: 'POST /api/auth/forgot-password',
    verifyFields: [
      'Reset link with token',
      'Expiration time (60 minutes)',
      'Security note',
    ],
    databaseCheck: 'password_reset_tokens table entry created',
  },
  'Project Status Change Email': {
    trigger: 'PATCH /api/projects/{id} with new status',
    verifyFields: [
      'Project reference number',
      'New status',
      'Changed by user name',
      'Timestamp',
    ],
    databaseCheck: 'project_status_history entry created',
  },
  'RFI Created Email': {
    trigger: 'POST /api/projects/{id}/rfis',
    verifyFields: [
      'RFI title',
      'Question text',
      'Project reference',
      'Response link/instructions',
    ],
    databaseCheck: 'project_rfis entry created',
  },
  'RFI Answered Email': {
    trigger: 'PATCH /api/projects/{id}/rfis/{id}',
    verifyFields: [
      'Original question',
      "Admin's answer",
      'Project reference',
      'Timestamp',
    ],
    databaseCheck: 'project_rfis.adminAnswer field updated',
  },
  'RFI Forwarded Email': {
    trigger: 'POST /api/projects/{id}/rfis/{id}/forward',
    verifyFields: [
      'Full RFI details',
      'Client action needed',
      'Project reference',
      'Deadline info',
    ],
    databaseCheck: 'project_rfis.forwardedToClient set to true',
  },
  'Client Delivery Email': {
    trigger: 'POST /api/projects/{id}/send-to-client',
    verifyFields: [
      'Deliverable file list',
      'Download links',
      'Project details',
      'Link expiration (72 hours)',
    ],
    databaseCheck: 'client_delivery_log entry created',
  },
};

/**
 * CURL COMMANDS FOR EMAIL TESTING
 * ==============================
 */

const curlExamples = {
  'Account Locked': `
    # Run 5 times with wrong password:
    curl -X POST http://localhost:4000/api/auth/login \\
      -H "Content-Type: application/json" \\
      -d '{"email":"test@example.com","password":"wrongpass"}'
  `,

  'Password Reset': `
    curl -X POST http://localhost:4000/api/auth/forgot-password \\
      -H "Content-Type: application/json" \\
      -d '{"email":"test@example.com"}'
  `,

  'Create RFI': `
    curl -X POST http://localhost:4000/api/projects/{projectId}/rfis \\
      -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{
        "title":"Clarification needed",
        "question":"Can you clarify the requirements?",
        "attachmentName":"spec.pdf"
      }'
  `,

  'Send to Client': `
    curl -X POST http://localhost:4000/api/projects/{projectId}/send-to-client \\
      -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{
        "recipientEmail":"client@example.com",
        "subject":"Your Project Deliverables"
      }'
  `,
};

/**
 * EMAIL CONTENT VERIFICATION TEMPLATE
 * ===================================
 */

const emailVerificationTemplate = {
  emailType: 'Account Locked Email',
  triggerTime: '2026-08-26T10:30:00Z',
  emailFrom: 'noreply@yourdomain.com',
  emailTo: 'test@example.com',
  subject: 'Account Locked',
  requiredFields: {
    accountLocked: true,
    lockoutDuration: '15 minutes',
    failedAttempts: 5,
    reason: 'Multiple failed login attempts',
  },
  databaseVerification: {
    table: 'users',
    checkField: 'lockoutUntil',
    expectedValue: 'Timestamp 15 minutes in future',
  },
  passed: true,
  notes: 'Email verified at backend console',
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║              EMAIL SYSTEM TESTING GUIDE v1.1                    ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📧 EMAIL TYPES IN ACE SERVICES PORTAL:\n');
Object.entries(emailTestingChecklist).forEach(([emailType, details], index) => {
  console.log(`${index + 1}. ${emailType}`);
  console.log(`   Trigger: ${details.trigger}`);
  console.log(`   Verify: ${details.verifyFields.join(', ')}`);
  console.log(`   Database: ${details.databaseCheck}\n`);
});

console.log('📧 DEMO MODE EMAIL OUTPUT:\n');
console.log('Watch the backend console for email output like:\n');
console.log('================== 📧 EMAIL DISPATCH (DEMO MODE) ==================');
console.log('To:          user@example.com');
console.log('From:        noreply@yourdomain.com');
console.log('Subject:     Account Locked');
console.log('Attachments: None');
console.log('--- Body ---');
console.log('Your account has been locked for 15 minutes after 5 failed login attempts.');
console.log('==================================================================\n');

console.log('✅ For detailed testing procedures, see this file comments above!\n');
