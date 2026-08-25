const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });
  console.log('Current users in database:');
  console.log(JSON.stringify(users, null, 2));

  // Reset passwords for all demo accounts to Admin@123456
  const hash = await bcrypt.hash('Admin@123456', 10);
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hash, isActive: true },
    });
    console.log(`Reset password for ${u.email} (${u.role}) to Admin@123456`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
