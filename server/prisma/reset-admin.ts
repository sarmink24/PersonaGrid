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
    const newPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !newPassword) {
        console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
        console.error('Set them in your .env file before running this script.');
        process.exit(1);
    }

    if (newPassword.length < 12) {
        console.error('ERROR: ADMIN_PASSWORD must be at least 12 characters.');
        process.exit(1);
    }

    console.log(`Resetting password for ${adminEmail}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.admin.upsert({
        where: { email: adminEmail },
        update: { password: hashedPassword },
        create: {
            email: adminEmail,
            password: hashedPassword,
        },
    });

    console.log('Admin password reset successfully.');
}

main()
    .catch((e) => {
        console.error('Reset failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
