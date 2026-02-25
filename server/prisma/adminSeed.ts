import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    console.error('Set them in your .env file before running this script.');
    process.exit(1);
  }

  if (adminPassword.length < 12) {
    console.error('ERROR: ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  console.log('Seeding admin user...');

  // Check if admin already exists
  const existing = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log(`Created admin user: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
