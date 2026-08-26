/**
 * Script to create an admin user with full access
 * Run: npx ts-node scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'georgeadam2492@gmail.com';
  const password = '225580@aceservices';
  const fullName = 'George Adam';

  try {
    console.log('🔐 Creating admin user...\n');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ User already exists with this email!');
      console.log(`   Email: ${email}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Role: ${existingUser.role}`);
      process.exit(1);
    }

    // Hash password
    console.log('   Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        pendingSetup: false,
        failedLogins: 0,
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📊 User Details:');
    console.log(`   Name:  ${admin.fullName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`   ID:    ${admin.id}`);
    console.log(`   Status: ${admin.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Created: ${admin.createdAt.toISOString()}\n`);

    console.log('🔑 Login Credentials:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}\n`);

    console.log('✨ This admin has FULL ACCESS to the system:\n');
    console.log('   ✓ Can create/manage projects');
    console.log('   ✓ Can manage users and roles');
    console.log('   ✓ Can view audit logs');
    console.log('   ✓ Can manage RFIs');
    console.log('   ✓ Can send deliverables to clients');
    console.log('   ✓ Can access all project data');
    console.log('   ✓ Owner of the system\n');

    console.log('🔗 Login at: http://localhost:3000/login\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
