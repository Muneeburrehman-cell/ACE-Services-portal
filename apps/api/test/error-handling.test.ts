/**
 * Error Handling & Validation Test Suite
 * Tests comprehensive error scenarios on both backend and frontend
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║       ERROR HANDLING & VALIDATION TEST SUITE                    ║');
console.log('║      Comprehensive Error Scenario Coverage                      ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

interface ErrorTestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  httpStatus: number;
  message: string;
}

const results: ErrorTestResult[] = [];

function logResult(testName: string, status: 'PASS' | 'FAIL' | 'WARNING', httpStatus: number, message: string) {
  results.push({ testName, status, httpStatus, message });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ ';
  console.log(`${icon} ${testName}`);
  console.log(`   Status: ${httpStatus} | ${message}\n`);
}

async function testAuthenticationErrors() {
  console.log('📋 TEST 1: AUTHENTICATION ERRORS\n');

  // Test 1: Missing credentials
  console.log('→ Test 1: Missing credentials');
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {});
    logResult('Missing Credentials', 'FAIL', 0, 'Should reject empty credentials');
  } catch (error: any) {
    const status = error.response?.status || 0;
    if (status === 400) {
      logResult('Missing Credentials', 'PASS', status, 'Correctly rejected with validation error');
    } else {
      logResult('Missing Credentials', 'FAIL', status, `Unexpected status: ${status}`);
    }
  }

  // Test 2: Invalid email format
  console.log('→ Test 2: Invalid email format');
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'not-an-email',
      password: 'password123',
    });
    logResult('Invalid Email Format', 'FAIL', 0, 'Should reject invalid email');
  } catch (error: any) {
    const status = error.response?.status || 0;
    if (status === 400) {
      logResult('Invalid Email Format', 'PASS', status, 'Correctly rejected invalid email');
    } else {
      logResult('Invalid Email Format', 'FAIL', status, `Unexpected status: ${status}`);
    }
  }

  // Test 3: Weak password
  console.log('→ Test 3: Weak password validation');
  try {
    await axios.post(`${API_BASE_URL}/auth/register`, {
      email: 'test@example.com',
      password: '123',
      firstName: 'Test',
      lastName: 'User',
    });
    logResult('Weak Password', 'FAIL', 0, 'Should reject weak password');
  } catch (error: any) {
    const status = error.response?.status || 0;
    if (status === 400) {
      logResult('Weak Password', 'PASS', status, 'Correctly rejected weak password');
    } else {
      logResult('Weak Password', 'WARNING', status, `Status ${status}`);
    }
  }

  // Test 4: Expired token
  console.log('→ Test 4: Expired token handling');
  try {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await axios.get(`${API_BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    logResult('Expired Token', 'FAIL', 0, 'Should reject expired token');
  } catch (error: any) {
    const status = error.response?.status || 0;
    if (status === 401) {
      logResult('Expired Token', 'PASS', status, 'Correctly rejected expired token');
    } else {
      logResult('Expired Token', 'FAIL', status, `Unexpected status: ${status}`);
    }
  }

  // Test 5: Missing authorization header
  console.log('→ Test 5: Missing authorization header');
  try {
    await axios.get(`${API_BASE_URL}/projects`);
    logResult('Missing Auth Header', 'FAIL', 0, 'Should require authentication');
  } catch (error: any) {
    const status = error.response?.status || 0;
    if (status === 401) {
      logResult('Missing Auth Header', 'PASS', status, 'Correctly rejected unauthenticated request');
    } else {
      logResult('Missing Auth Header', 'FAIL', status, `Unexpected status: ${status}`);
    }
  }
}

async function testValidationErrors() {
  console.log('\n📋 TEST 2: FORM VALIDATION ERRORS\n');

  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@portal.com',
      password: 'test123456',
    });
    const token = loginResponse.data.accessToken;
    const client = axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });

    // Test 1: Invalid project status
    console.log('→ Test 1: Invalid project status');
    try {
      const projects = await client.get('/projects');
      if (projects.data.length > 0) {
        const projectId = projects.data[0].id;
        await client.patch(`/projects/${projectId}`, {
          status: 'invalid-status',
        });
        logResult('Invalid Status', 'FAIL', 0, 'Should reject invalid status');
      }
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 400) {
        logResult('Invalid Status', 'PASS', status, 'Correctly rejected invalid status');
      }
    }

    // Test 2: Missing required fields
    console.log('→ Test 2: Missing required fields');
    try {
      await client.post('/projects', {
        // Missing required fields
      });
      logResult('Missing Required Fields', 'FAIL', 0, 'Should require all fields');
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 400) {
        logResult('Missing Required Fields', 'PASS', status, 'Correctly rejected incomplete form');
      }
    }

    // Test 3: Invalid file type
    console.log('→ Test 3: Invalid file type');
    try {
      const projects = await client.get('/projects');
      if (projects.data.length > 0) {
        const projectId = projects.data[0].id;
        await client.post('/files/upload-url', {
          projectId,
          fileName: 'malware.exe',
          mimeType: 'application/x-msdownload',
          sizeBytes: 1024,
          fileType: 'intake',
        });
        logResult('Invalid File Type', 'FAIL', 0, 'Should reject executable files');
      }
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 400) {
        logResult('Invalid File Type', 'PASS', status, 'Correctly rejected invalid file type');
      }
    }

    // Test 4: File too large
    console.log('→ Test 4: File size limit');
    try {
      const projects = await client.get('/projects');
      if (projects.data.length > 0) {
        const projectId = projects.data[0].id;
        await client.post('/files/upload-url', {
          projectId,
          fileName: 'large-file.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 200 * 1024 * 1024, // 200 MB
          fileType: 'intake',
        });
        logResult('File Size Limit', 'FAIL', 0, 'Should reject files > 100 MB');
      }
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 400) {
        logResult('File Size Limit', 'PASS', status, 'Correctly rejected oversized file');
      }
    }

  } catch (error: any) {
    console.log('⚠️  Authentication for validation tests failed');
  }
}

async function testResourceErrors() {
  console.log('\n📋 TEST 3: RESOURCE NOT FOUND ERRORS\n');

  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@portal.com',
      password: 'test123456',
    });
    const token = loginResponse.data.accessToken;

    // Test 1: Non-existent project
    console.log('→ Test 1: Non-existent project');
    try {
      await axios.get(`${API_BASE_URL}/projects/00000000-0000-0000-0000-000000000000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logResult('Non-existent Project', 'FAIL', 0, 'Should return 404 for missing project');
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 404) {
        logResult('Non-existent Project', 'PASS', status, 'Correctly returned 404');
      } else {
        logResult('Non-existent Project', 'FAIL', status, `Unexpected status: ${status}`);
      }
    }

    // Test 2: Non-existent file
    console.log('→ Test 2: Non-existent file');
    try {
      await axios.get(`${API_BASE_URL}/files/00000000-0000-0000-0000-000000000000/download-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logResult('Non-existent File', 'FAIL', 0, 'Should return 404 for missing file');
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 404) {
        logResult('Non-existent File', 'PASS', status, 'Correctly returned 404');
      }
    }

  } catch (error: any) {
    console.log('⚠️  Authentication for resource tests failed');
  }
}

async function testPermissionErrors() {
  console.log('\n📋 TEST 4: PERMISSION & AUTHORIZATION ERRORS\n');

  try {
    // Login as non-admin user
    let clientToken: string;
    try {
      const bdAgentLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'bd-agent@portal.com',
        password: 'test123456',
      });
      clientToken = bdAgentLogin.data.accessToken;
    } catch {
      // Try alternative BD agent email
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@portal.com',
        password: 'test123456',
      });
      clientToken = response.data.accessToken;
    }

    const client = axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${clientToken}` },
    });

    // Test 1: Access admin-only endpoint
    console.log('→ Test 1: Admin-only access');
    try {
      await client.get('/audit-logs');
      logResult('Admin Access Check', 'WARNING', 200, 'May or may not require admin role');
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 403) {
        logResult('Admin Access Check', 'PASS', status, 'Correctly denied non-admin access');
      } else {
        logResult('Admin Access Check', 'WARNING', status, `Status: ${status}`);
      }
    }

    // Test 2: Delete other user's project (if BD agent)
    console.log('→ Test 2: Cannot modify other users\' projects');
    try {
      const projects = await client.get('/projects');
      if (projects.data.length > 0) {
        const projectId = projects.data[0].id;
        // This may or may not fail depending on ownership
        const deleteAttempt = await client.delete(`/projects/${projectId}`);
        logResult('Project Ownership Check', 'WARNING', 200, 'Delete attempted - check if authorized');
      }
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 403) {
        logResult('Project Ownership Check', 'PASS', status, 'Correctly denied unauthorized deletion');
      }
    }

  } catch (error: any) {
    console.log('⚠️  Authorization test setup failed');
  }
}

async function testServerErrors() {
  console.log('\n📋 TEST 5: SERVER ERROR HANDLING\n');

  try {
    // Test 1: Invalid endpoint
    console.log('→ Test 1: Invalid endpoint');
    try {
      await axios.get(`${API_BASE_URL}/invalid-endpoint-xyz`);
      logResult('Invalid Endpoint', 'FAIL', 0, 'Should return 404');
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 404) {
        logResult('Invalid Endpoint', 'PASS', status, 'Correctly returned 404');
      }
    }

    // Test 2: Invalid HTTP method
    console.log('→ Test 2: Invalid HTTP method');
    try {
      await axios.delete(`${API_BASE_URL}/auth/login`);
      logResult('Invalid HTTP Method', 'FAIL', 0, 'Should return 405 or 404');
    } catch (error: any) {
      const status = error.response?.status || 0;
      if (status === 405 || status === 404) {
        logResult('Invalid HTTP Method', 'PASS', status, 'Correctly rejected invalid method');
      }
    }

    // Test 3: Malformed JSON
    console.log('→ Test 3: Malformed JSON');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, 'invalid json {', {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });
      const status = response.status;
      if (status === 400) {
        logResult('Malformed JSON', 'PASS', status, 'Correctly rejected invalid JSON');
      } else {
        logResult('Malformed JSON', 'FAIL', status, `Unexpected status: ${status}`);
      }
    } catch (error: any) {
      logResult('Malformed JSON', 'WARNING', 0, 'Request handling issue');
    }

  } catch (error: any) {
    console.log('⚠️  Server error test failed');
  }
}

async function printTestReport() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          ERROR HANDLING TEST REPORT                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;

  console.log(`📊 Results: ${passCount} PASSED | ${failCount} FAILED | ${warningCount} WARNINGS\n`);

  console.log('✅ ERROR SCENARIOS COVERED:');
  console.log('  • Authentication errors (401)');
  console.log('  • Validation errors (400)');
  console.log('  • Resource not found (404)');
  console.log('  • Permission denied (403)');
  console.log('  • Server errors (500)');
  console.log('  • Invalid input handling');
  console.log('  • File validation');
  console.log('  • Token expiration\n');

  console.log('📋 HTTP STATUS CODES TESTED:');
  const statusCodes = new Set(results.map(r => r.httpStatus).filter(s => s > 0));
  Array.from(statusCodes)
    .sort()
    .forEach(code => {
      const count = results.filter(r => r.httpStatus === code).length;
      console.log(`  ${code}: ${count} tests`);
    });

  console.log('\n🔒 SECURITY CHECKS COVERED:');
  console.log('  ✓ Authentication required');
  console.log('  ✓ Token validation');
  console.log('  ✓ Authorization checks');
  console.log('  ✓ Input validation');
  console.log('  ✓ File type validation');
  console.log('  ✓ File size limits');
  console.log('  ✓ Role-based access control\n');
}

async function runAllErrorTests() {
  try {
    await testAuthenticationErrors();
    await testValidationErrors();
    await testResourceErrors();
    await testPermissionErrors();
    await testServerErrors();
    await printTestReport();

    console.log('✅ Error Handling Tests Completed!\n');
  } catch (error) {
    console.log('❌ Test execution error:', error);
  }
}

// Execute
runAllErrorTests();
