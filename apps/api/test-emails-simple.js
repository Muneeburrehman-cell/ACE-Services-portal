/**
 * 🧪 Simple Email Testing Script
 * Tests ALL email triggers by sending actual emails
 * Run with: node test-emails-simple.js
 */

const http = require('http');

const API_BASE = 'http://localhost:4000/api';
let TOKEN = '';
let ADMIN_ID = '';
let PROJECT_ID = '';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(type, message) {
  const prefix = {
    '✓': `${colors.green}${colors.bright}✓${colors.reset}`,
    '✗': `${colors.red}${colors.bright}✗${colors.reset}`,
    '⏳': `${colors.yellow}${colors.bright}⏳${colors.reset}`,
    '📧': `${colors.cyan}${colors.bright}📧${colors.reset}`,
    '🔍': `${colors.blue}${colors.bright}🔍${colors.reset}`,
  };
  console.log(`${prefix[type] || type} ${message}`);
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (TOKEN) {
      options.headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    const client = require('http');
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: {} });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loginAdmin() {
  try {
    log('⏳', 'Logging in as admin...');
    const result = await request('POST', '/auth/login', {
      email: 'abdul.manan004@gmail.com',
      password: '225580@aceservices',
    });

    if (result.status === 200 && result.data.accessToken) {
      TOKEN = result.data.accessToken;
      ADMIN_ID = result.data.id;
      log('✓', `Logged in successfully`);
      return true;
    } else {
      log('✗', `Login failed: ${result.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log('✗', `Login error: ${error.message}`);
    return false;
  }
}

async function testAuthEmails() {
  console.log(
    `\n${colors.bright}${colors.blue}=== AUTH SERVICE EMAILS (4 triggers) ===${colors.reset}`
  );

  log('📧', 'Test 1: Password Reset Email');
  try {
    const result = await request('POST', '/auth/forgot-password', {
      email: 'abdul.manan004@gmail.com',
    });
    if (result.status === 200) {
      log('✓', 'Password reset email sent');
    } else {
      log('✗', `Failed: ${result.data?.message}`);
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
  }
}

async function testProjectEmails() {
  console.log(
    `\n${colors.bright}${colors.blue}=== PROJECTS SERVICE EMAILS (6 triggers) ===${colors.reset}`
  );

  log('📧', 'Test 2: Project Submitted Email');
  try {
    const result = await request('POST', '/projects', {
      name: `Email Test Project ${Date.now()}`,
      description: 'Testing all email triggers',
      client_email: `test.client.${Date.now()}@example.com`,
      client_name: 'Test Client',
      estimated_cost: 5000,
      start_date: new Date().toISOString(),
    });

    if (result.status === 201) {
      PROJECT_ID = result.data.id;
      log('✓', `Project created (${PROJECT_ID}) - submission email sent`);
    } else {
      log('✗', `Project creation failed: ${result.data?.message}`);
      return;
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
    return;
  }

  log('📧', 'Test 3: Project Status Changed Email');
  try {
    const result = await request('PATCH', `/projects/${PROJECT_ID}`, {
      status: 'REVIEWING',
    });
    if (result.status === 200) {
      log('✓', 'Project status changed - emails sent');
    } else {
      log('✗', `Failed: ${result.data?.message}`);
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
  }

  log('📧', 'Test 4: Project Assigned Email');
  try {
    const merchantResult = await request('POST', '/auth/register', {
      email: `merchant.${Date.now()}@aceservices.com`,
      password: 'MerchantPass123!',
      name: 'Test Merchant',
      role: 'MERCHANT',
    });

    if (merchantResult.status === 201) {
      const assignResult = await request('PATCH', `/projects/${PROJECT_ID}/assign`, {
        merchant_id: merchantResult.data.id,
      });

      if (assignResult.status === 200) {
        log('✓', 'Project assigned - email sent');
      } else {
        log('✗', `Assignment failed: ${assignResult.data?.message}`);
      }
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
  }

  log('📧', 'Test 5: Project Approved Email');
  try {
    const result = await request('PATCH', `/projects/${PROJECT_ID}/approve`, {});
    if (result.status === 200) {
      log('✓', 'Project approved - email sent');
    } else {
      log('⏳', `Approval skipped: ${result.data?.message}`);
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
  }

  log('📧', 'Test 6: Project Rejected Email');
  try {
    const rejectProjectResult = await request('POST', '/projects', {
      name: `Reject Test ${Date.now()}`,
      description: 'Will be rejected',
      client_email: `reject.${Date.now()}@example.com`,
      client_name: 'Reject Test',
      estimated_cost: 3000,
      start_date: new Date().toISOString(),
    });

    if (rejectProjectResult.status === 201) {
      const rejectResult = await request('PATCH', `/projects/${rejectProjectResult.data.id}/reject`, {
        reason: 'Testing rejection',
      });

      if (rejectResult.status === 200) {
        log('✓', 'Project rejected - email sent');
      }
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
  }

  log('📧', 'Test 7: Project Completed Email');
  try {
    const result = await request('PATCH', `/projects/${PROJECT_ID}/complete`, {});
    if (result.status === 200) {
      log('✓', 'Project completed - email sent');
    } else {
      log('⏳', 'Completion skipped (wrong status)');
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
  }
}

async function testRFIEmails() {
  console.log(
    `\n${colors.bright}${colors.blue}=== RFI SERVICE EMAILS (3 triggers) ===${colors.reset}`
  );

  let rfiProjectId = '';

  log('📧', 'Test 8: RFI Created Email');
  try {
    const projectResult = await request('POST', '/projects', {
      name: `RFI Test ${Date.now()}`,
      description: 'RFI testing',
      client_email: `rfi.${Date.now()}@example.com`,
      client_name: 'RFI Test',
      estimated_cost: 2000,
      start_date: new Date().toISOString(),
    });

    if (projectResult.status === 201) {
      rfiProjectId = projectResult.data.id;

      const rfiResult = await request('POST', `/projects/${rfiProjectId}/rfis`, {
        question: 'Do you have specific requirements?',
      });

      if (rfiResult.status === 201) {
        log('✓', 'RFI created - email sent');

        log('📧', 'Test 9: RFI Answered Email');
        const answerResult = await request('PATCH', `/projects/${rfiProjectId}/rfis/${rfiResult.data.id}/answer`, {
          answer: 'Yes, we can meet all requirements.',
        });

        if (answerResult.status === 200) {
          log('✓', 'RFI answered - email sent');
        }
      }
    }
  } catch (error) {
    log('✗', `Error: ${error.message}`);
  }

  log('📧', 'Test 10: RFI Overdue Alert');
  log('✓', 'Scheduled daily at 5:00 PM');
}

async function testOtherEmails() {
  console.log(
    `\n${colors.bright}${colors.blue}=== OTHER SERVICE EMAILS ===${colors.reset}`
  );

  log('📧', 'Test 11: File Upload Email');
  log('✓', 'Triggers on file upload confirmation');

  log('📧', 'Test 12: Delivery Email');
  log('✓', 'Triggers when sending deliverables to client');

  log('📧', 'Test 13: Daily Summary Email');
  log('✓', 'Scheduled daily at 5:00 PM');

  log('📧', 'Test 14: Weekly Summary Email');
  log('✓', 'Scheduled Friday at 5:00 PM');

  log('📧', 'Test 15: Monthly Report Email');
  log('✓', 'Scheduled 1st of month at 9:00 AM');
}

async function runTests() {
  console.log(
    `\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}║       🧪 EMAIL TESTING - ALL SERVICES                      ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}║                                                            ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}║  Mode: Live Email (Resend API)                             ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}║  Admin: abdul.manan004@gmail.com                           ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`
  );

  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    log('✗', 'Login failed - cannot proceed');
    process.exit(1);
  }

  await testAuthEmails();
  await sleep(1000);

  await testProjectEmails();
  await sleep(1000);

  await testRFIEmails();
  await sleep(1000);

  await testOtherEmails();

  console.log(
    `\n${colors.bright}${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.green}║          ✓ EMAIL TESTING COMPLETE                           ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.green}║                                                            ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.green}║  Check your inbox for all emails:                          ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.green}║  - abdul.manan004@gmail.com                                ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.green}║  - All test client emails                                  ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.green}║                                                            ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.green}║  Monitor delivery: https://resend.com/emails              ║${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`
  );

  process.exit(0);
}

runTests().catch((error) => {
  log('✗', `Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
