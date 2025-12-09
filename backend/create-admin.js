const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'devpassword',
    database: process.env.DB_NAME || 'think_then_talk_dev',
  });

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('⚠️  ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set.');
      process.exit(1);
    }

    // Check if admin already exists
    const [rows] = await connection.execute('SELECT * FROM `AdminUser` WHERE email = ?', [adminEmail]);

    if (rows.length > 0) {
      console.log(`✓ Admin user already exists: ${adminEmail}`);
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(adminPassword, 10);
    const id = uuidv4();

    // Create admin user
    await connection.execute(
      'INSERT INTO `AdminUser` (id, email, name, role, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [id, adminEmail, 'System Administrator', 'ADMIN', passwordHash]
    );

    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${adminEmail}`);
    console.log('💡 You can now login with your credentials');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createAdmin();
