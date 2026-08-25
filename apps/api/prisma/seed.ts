/**
 * Production seed — wipes all data and creates ONE admin account only.
 * Usage: npm run prisma:seed (or pnpm --filter api prisma:seed)
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('=== PRODUCTION RESET & SEED ===\n');

  // Delete in correct FK dependency order
  console.log('Clearing database...');
  await prisma.projectRfi.deleteMany();
  await prisma.projectStatusHistory.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.clientDeliveryLog.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.project.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('All data cleared.\n');

  // Create production admin
  const adminEmail = process.env.ADMIN_EMAIL || 'georgeadam2492@gmail.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123456';

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      fullName: 'George Adam',
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      pendingSetup: false,
    },
  });

  console.log('Admin account created:');
  console.log('  Email:   ', admin.email);
  console.log('  Password:', adminPassword);
  console.log('  ID:      ', admin.id);
  console.log('\nWARNING: Change this password immediately after first login!');
  console.log('Database is ready for production.\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
