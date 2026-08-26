import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n========== USERS ==========\n');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, isActive: true }
    });
    
    if (users.length === 0) {
      console.log('No users found');
    } else {
      console.log(`Total Users: ${users.length}\n`);
      users.forEach(u => {
        console.log(`Email: ${u.email}`);
        console.log(`Name: ${u.fullName}`);
        console.log(`Role: ${u.role}`);
        console.log(`Active: ${u.isActive}`);
        console.log('---');
      });
    }

    console.log('\n========== PROJECTS ==========\n');
    const projects = await prisma.project.findMany({
      select: { id: true, clientCompanyName: true, clientContactPerson: true, status: true, submittedAt: true }
    });
    
    if (projects.length === 0) {
      console.log('No projects found');
    } else {
      console.log(`Total Projects: ${projects.length}\n`);
      projects.forEach(p => {
        console.log(`Company: ${p.clientCompanyName}`);
        console.log(`Contact: ${p.clientContactPerson}`);
        console.log(`Status: ${p.status}`);
        console.log(`Submitted: ${p.submittedAt}`);
        console.log('---');
      });
    }

  } finally {
    await prisma.$disconnect();
  }
}

main();
