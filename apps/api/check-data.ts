/**
 * Quick script to check what users and projects exist in database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          DATABASE CONTENT - USERS & PROJECTS               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('👥 USERS (' + users.length + ' total)\n');
  if (users.length === 0) {
    console.log('  No users found. Database is empty.\n');
  } else {
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.fullName}`);
      console.log(`     Email:  ${user.email}`);
      console.log(`     Role:   ${user.role}`);
      console.log(`     Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log(`     Created: ${user.createdAt.toISOString()}`);
      console.log(`     ID:     ${user.id}\n`);
    });
  }

  // Get projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      referenceNumber: true,
      clientCompanyName: true,
      clientName: true,
      clientEmail: true,
      status: true,
      bdAgent: { select: { fullName: true, email: true } },
      assignedEngineer: { select: { fullName: true, email: true } },
      submittedAt: true,
      requestedDeadline: true,
      scopeDescription: true,
    },
    orderBy: { submittedAt: 'desc' },
  });

  console.log('📦 PROJECTS (' + projects.length + ' total)\n');
  if (projects.length === 0) {
    console.log('  No projects found. Database is empty.\n');
  } else {
    projects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.referenceNumber} - ${project.clientCompanyName}`);
      console.log(`     Client:    ${project.clientName} (${project.clientEmail})`);
      console.log(`     Status:    ${project.status}`);
      console.log(`     Submitted: ${project.submittedAt.toISOString()}`);
      console.log(`     Deadline:  ${project.requestedDeadline.toISOString().split('T')[0]}`);
      console.log(`     BD Agent:  ${project.bdAgent.fullName} (${project.bdAgent.email})`);
      if (project.assignedEngineer) {
        console.log(`     Engineer:  ${project.assignedEngineer.fullName} (${project.assignedEngineer.email})`);
      } else {
        console.log(`     Engineer:  Not assigned yet`);
      }
      console.log(`     Scope:     ${project.scopeDescription.substring(0, 50)}...`);
      console.log(`     ID:        ${project.id}\n`);
    });
  }

  // Get summary stats
  const projectsByStatus = await prisma.project.groupBy({
    by: ['status'],
    _count: true,
  });

  if (projectsByStatus.length > 0) {
    console.log('📊 PROJECT STATUS BREAKDOWN\n');
    projectsByStatus.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count} projects`);
    });
    console.log();
  }

  // Get files count
  const filesCount = await prisma.projectFile.count();
  const deliverableCount = await prisma.deliverable.count();
  const rfiCount = await prisma.projectRfi.count();

  console.log('📁 OTHER STATISTICS\n');
  console.log(`  Project Files:  ${filesCount}`);
  console.log(`  Deliverables:   ${deliverableCount}`);
  console.log(`  RFIs:           ${rfiCount}\n`);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      END OF REPORT                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
