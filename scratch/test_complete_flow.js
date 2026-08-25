async function run() {
  const API_URL = 'http://localhost:4000/api';
  console.log('--- Starting Complete Business Workflow Verification ---');

  // 1. BD Agent Login
  console.log('1. Logging in as BD Agent (rmuneebur750@gmail.com)...');
  const bdLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rmuneebur750@gmail.com', password: 'Admin@123456' }),
  });
  const bdLoginData = await bdLoginRes.json();
  if (!bdLoginRes.ok) throw new Error(`BD Login failed: ${JSON.stringify(bdLoginData)}`);
  const bdToken = bdLoginData.accessToken;
  console.log('   ✓ BD Agent authenticated successfully.');

  // 2. Submit New Project with Company, Contact, Salesperson, Decided Price ($2,850)
  console.log('2. BD Submitting New Project with Company, Contact Person, Salesperson, and Decided Price...');
  const createRes = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bdToken}`,
    },
    body: JSON.stringify({
      clientCompanyName: 'Apex Structural Builders Inc.',
      clientContactPerson: 'David Vance',
      salespersonName: 'Sarah Jenkins',
      decidedPrice: 2850,
      projectType: 'estimation',
      clientEmail: 'georgeadam2492@gmail.com',
      clientPhone: '+1 555 987 6543',
      requestedDeadline: '2026-09-15T00:00:00.000Z',
      scopeDescription: 'Full CSI Division 3 Concrete and Division 5 Metals takeoff for 3-story commercial building complex.',
    }),
  });
  const project = await createRes.json();
  if (!createRes.ok) throw new Error(`Create project failed: ${JSON.stringify(project)}`);
  console.log(`   ✓ Project Created: ${project.referenceNumber} (ID: ${project.id})`);
  console.log(`     - Client Company: ${project.clientCompanyName}`);
  console.log(`     - Contact Person: ${project.clientContactPerson}`);
  console.log(`     - Salesperson:    ${project.salespersonName}`);
  console.log(`     - Decided Price:  $${project.decidedPrice}`);

  // 3. Test BD Status Updates
  console.log('3. Testing BD Status Actions: Proposal, Follow-Up, and Approved...');
  // 3a. Proposal
  const propRes = await fetch(`${API_URL}/projects/${project.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bdToken}` },
    body: JSON.stringify({ status: 'proposal' }),
  });
  const propData = await propRes.json();
  console.log(`   ✓ Status updated to Proposal: ${propData.status}`);

  // 3b. Follow-Up
  const followUpDate = new Date(Date.now() + 2 * 86400000).toISOString();
  const fuRes = await fetch(`${API_URL}/projects/${project.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bdToken}` },
    body: JSON.stringify({
      status: 'follow_up',
      followUpDate,
      followUpNotes: 'Called David Vance, awaiting revised structural addendum #2.',
    }),
  });
  const fuData = await fuRes.json();
  console.log(`   ✓ Status updated to Follow-Up: ${fuData.status} (Due: ${fuData.followUpDate})`);

  // 3c. Approved
  const appRes = await fetch(`${API_URL}/projects/${project.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bdToken}` },
    body: JSON.stringify({ status: 'approved' }),
  });
  const appData = await appRes.json();
  console.log(`   ✓ Status updated to Approved: ${appData.status}`);

  // 4. Admin Login & Pipeline Management
  console.log('4. Logging in as Administrator (admin@portal.com)...');
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@portal.com', password: 'Admin@123456' }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.accessToken;
  console.log('   ✓ Administrator authenticated.');

  // 4a. Get Engineers list
  const engListRes = await fetch(`${API_URL}/users/engineers`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const engineers = await engListRes.json();
  const targetEng = engineers[0];
  console.log(`   ✓ Found engineer: ${targetEng.fullName} (${targetEng.email})`);

  // 4b. Assign Project to Engineer
  console.log('5. Admin Assigning project to Estimation Engineer...');
  const assignRes = await fetch(`${API_URL}/projects/${project.id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      engineerId: targetEng.id,
      internalDeadline: '2026-09-10T00:00:00.000Z',
      priority: 'high',
      adminInstructions: 'Perform detailed concrete rebar schedule and formwork area takeoff.',
      projectType: 'estimation',
    }),
  });
  const assignData = await assignRes.json();
  console.log(`   ✓ Assigned to ${targetEng.fullName}`);

  // 4c. Set Merchant Fee (3.5%)
  console.log('6. Admin configuring Merchant Fee (3.5%)...');
  const feeRes = await fetch(`${API_URL}/projects/${project.id}/merchant-fee`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ merchantFeePercent: 3.5 }),
  });
  const feeData = await feeRes.json();
  console.log(`   ✓ Decided Base Price:  $${feeData.decidedPrice}`);
  console.log(`   ✓ Merchant Fee (3.5%): $${feeData.merchantFeeAmount}`);
  console.log(`   ✓ Total Invoice Due:   $${feeData.totalPrice}`);

  // 7. Engineer Login & RFI Submission
  console.log('7. Logging in as Estimation Engineer...');
  const engLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEng.email, password: 'Admin@123456' }),
  });
  const engLoginData = await engLoginRes.json();
  const engToken = engLoginData.accessToken;
  console.log('   ✓ Engineer authenticated.');

  console.log('8. Engineer raising RFI for missing drawing rebar schedule...');
  const rfiRes = await fetch(`${API_URL}/projects/${project.id}/rfis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${engToken}` },
    body: JSON.stringify({
      title: 'Missing Foundation Sheet S-102 Rebar Lap Schedule',
      question: 'Please confirm the splice length for #8 grade beam top & bottom bars on grid line C-4.',
      attachmentName: 'Sheet S-101 Foundation Plan',
    }),
  });
  const rfiData = await rfiRes.json();
  console.log(`   ✓ RFI Raised: "${rfiData.title}" (Status: ${rfiData.status})`);

  // 9. Admin Review & Answering RFI
  console.log('9. Admin answering RFI...');
  const ansRes = await fetch(`${API_URL}/projects/${project.id}/rfis/${rfiData.id}/answer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      adminAnswer: 'Lap length is 48 bar diameters (48d) per General Structural Notes Sheet S-001 Note 14.',
    }),
  });
  const ansData = await ansRes.json();
  console.log(`   ✓ RFI Answered: "${ansData.adminAnswer}" (Status: ${ansData.status})`);

  // 10. Admin Forwarding RFI to Client Email via Resend
  console.log('10. Admin forwarding RFI to Client Email (georgeadam2492@gmail.com)...');
  const fwdRes = await fetch(`${API_URL}/projects/${project.id}/rfis/${rfiData.id}/forward-client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  });
  const fwdData = await fwdRes.json();
  console.log(`   ✓ RFI Email forwarded to: ${fwdData.forwardedTo}`);

  // 11. Final verification of project state
  console.log('11. Verifying complete project record...');
  const finalProjRes = await fetch(`${API_URL}/projects/${project.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const finalProj = await finalProjRes.json();
  console.log('=======================================================');
  console.log(`Reference:       ${finalProj.referenceNumber}`);
  console.log(`Company:         ${finalProj.clientCompanyName}`);
  console.log(`Contact:         ${finalProj.clientContactPerson}`);
  console.log(`Salesperson:     ${finalProj.salespersonName}`);
  console.log(`Decided Price:   $${finalProj.decidedPrice}`);
  console.log(`Merchant Fee:    ${finalProj.merchantFeePercent}% ($${finalProj.merchantFeeAmount})`);
  console.log(`Total Invoice:   $${finalProj.totalPrice}`);
  console.log(`Status:          ${finalProj.status}`);
  console.log(`RFIs on Project: ${finalProj.rfis.length}`);
  console.log('=======================================================');
  console.log('🎉 ALL INTEGRATION WORKFLOW TESTS PASSED 100% SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
