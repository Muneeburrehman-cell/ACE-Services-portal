/**
 * Database Cleanup Script
 * Deletes all projects and users from the database
 * 
 * WARNING: This is destructive and cannot be undone!
 * Only run this with explicit user permission.
 * 
 * Usage: npx ts-node cleanup-database.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('⚠️  WARNING: This will DELETE all projects and users from the database!');
  console.log('⏳ Starting cleanup in 3 seconds... Press Ctrl+C to cancel.\n');

  // Give user time to cancel
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    console.log('🗑️  Deleting all data...\n');

    // Delete in order of dependencies
    console.log('  → Deleting ClientDeliveryLog...');
    const deletedDeliveryLogs = await prisma.clientDeliveryLog.deleteMany({});
    console.log(`     ✓ Deleted ${deletedDeliveryLogs.count} delivery logs`);

    console.log('  → Deleting AuditLog...');
    const deletedAuditLogs = await prisma.auditLog.deleteMany({});
    console.log(`     ✓ Deleted ${deletedAuditLogs.count} audit logs`);

    console.log('  → Deleting Notification...');
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`     ✓ Deleted ${deletedNotifications.count} notifications`);

    console.log('  → Deleting ProjectStatusHistory...');
    const deletedStatusHistory = await prisma.projectStatusHistory.deleteMany({});
    console.log(`     ✓ Deleted ${deletedStatusHistory.count} status history records`);

    console.log('  → Deleting ProjectRfi...');
    const deletedRfis = await prisma.projectRfi.deleteMany({});
    console.log(`     ✓ Deleted ${deletedRfis.count} RFIs`);

    console.log('  → Deleting ProjectFile...');
    const deletedFiles = await prisma.projectFile.deleteMany({});
    console.log(`     ✓ Deleted ${deletedFiles.count} project files`);

    console.log('  → Deleting Deliverable...');
    const deletedDeliverables = await prisma.deliverable.deleteMany({});
    console.log(`     ✓ Deleted ${deletedDeliverables.count} deliverables`);

    console.log('  → Deleting Project...');
    const deletedProjects = await prisma.project.deleteMany({});
    console.log(`     ✓ Deleted ${deletedProjects.count} projects`);

    console.log('  → Deleting RefreshToken...');
    const deletedRefreshTokens = await prisma.refreshToken.deleteMany({});
    console.log(`     ✓ Deleted ${deletedRefreshTokens.count} refresh tokens`);

    console.log('  → Deleting PasswordResetToken...');
    const deletedPasswordTokens = await prisma.passwordResetToken.deleteMany({});
    console.log(`     ✓ Deleted ${deletedPasswordTokens.count} password reset tokens`);

    console.log('  → Deleting User...');
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`     ✓ Deleted ${deletedUsers.count} users`);

    console.log('\n✅ Database cleanup complete!\n');
    console.log('Summary:');
    console.log(`  • Projects deleted: ${deletedProjects.count}`);
    console.log(`  • Users deleted: ${deletedUsers.count}`);
    console.log(`  • Project files deleted: ${deletedFiles.count}`);
    console.log(`  • Deliverables deleted: ${deletedDeliverables.count}`);
    console.log(`  • RFIs deleted: ${deletedRfis.count}`);
    console.log(`  • Status history deleted: ${deletedStatusHistory.count}`);
    console.log(`  • Notifications deleted: ${deletedNotifications.count}`);
    console.log(`  • Audit logs deleted: ${deletedAuditLogs.count}`);
    console.log(`  • Delivery logs deleted: ${deletedDeliveryLogs.count}`);
    console.log(`  • Refresh tokens deleted: ${deletedRefreshTokens.count}`);
    console.log(`  • Password reset tokens deleted: ${deletedPasswordTokens.count}\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
