
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

// Load environment variables similar to application bootstrap
const nodeEnv = process.env.NODE_ENV ?? 'development';
const envPaths = [`.env.${nodeEnv}`, '.env'];
for (const path of envPaths) {
  config({ path });
}

const databaseUrl =
  process.env.DATABASE_URL ??
  `mysql://${process.env.DB_USER ?? 'root'}:${process.env.DB_PASSWORD ?? ''}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '3306'}/${process.env.DB_NAME ?? 'think_then_talk'}`;

  const prisma = new PrismaClient({
    datasource: { // Ensure this is singular
      url: process.env.DATABASE_URL,
    },
  });

async function main() {
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('⚠️  ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set.');
      console.log('   Skipping admin user creation.');
      console.log('   To create admin user, set these variables:');
      console.log('   export ADMIN_EMAIL="your-email@example.com"');
      console.log('   export ADMIN_PASSWORD="your-secure-password"');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`✓ Admin user already exists: ${adminEmail}`);
      return;
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        name: 'System Administrator',
        role: 'ADMIN',
        passwordHash,
      },
    });

    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${admin.email}`);
    console.log('⚠️  Password stored securely in database');
    console.log('💡 You can now login with your credentials');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
