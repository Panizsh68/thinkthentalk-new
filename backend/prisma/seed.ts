import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PoolConfig } from 'mariadb';
import * as bcryptjs from 'bcryptjs';

// Load environment variables similar to application bootstrap
const nodeEnv = process.env.NODE_ENV ?? 'development';
const envPaths = [`.env.${nodeEnv}`, '.env'];
for (const path of envPaths) {
  config({ path });
}

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 1,
};

const adapter = new PrismaMariaDb(poolConfig);
const prisma = new PrismaClient({ adapter });

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
        role: 'ADMIN',
        password: passwordHash,
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
