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
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@personagrid.com';
    const newPassword = 'admin123';

    console.log(`🔄 Resetting password for ${adminEmail}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const admin = await prisma.admin.upsert({
        where: { email: adminEmail },
        update: { password: hashedPassword },
        create: {
            email: adminEmail,
            password: hashedPassword,
        },
    });

    console.log('✅ Admin password reset successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${newPassword}`);
}

main()
    .catch((e) => {
        console.error('❌ Reset failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
