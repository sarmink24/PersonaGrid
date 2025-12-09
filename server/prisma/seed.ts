import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample organization
  const org = await prisma.organization.create({
    data: {
      name: 'Aurora Labs',
      mission: 'Pioneering AI-driven narrative engineering for modern brands',
    },
  });
  console.log('✅ Created organization:', org.name);

  // Create sample personas
  const persona1 = await prisma.persona.create({
    data: {
      organizationId: org.id,
      displayName: 'Neon Sage',
      personalityTraits: ['empathetic', 'analytical', 'bold', 'curious'],
      bio: 'Tech philosopher exploring the intersection of AI and human creativity',
      socialProfiles: {
        create: [
          {
            network: 'twitter' as const,
            handle: 'neonsage_ai',
          },
          {
            network: 'instagram' as const,
            handle: 'neonsage',
          },
        ],
      },
    },
  });
  console.log('✅ Created persona:', persona1.displayName);

  const persona2 = await prisma.persona.create({
    data: {
      organizationId: org.id,
      displayName: 'Quantum Pulse',
      personalityTraits: ['energetic', 'innovative', 'trendsetter', 'optimistic'],
      bio: 'Digital native sharing the latest in tech and culture',
      // No social profiles - will be added later when integrating social media
    },
  });
  console.log('✅ Created persona:', persona2.displayName);

  const persona3 = await prisma.persona.create({
    data: {
      organizationId: org.id,
      displayName: 'Silent Observer',
      personalityTraits: ['thoughtful', 'reserved', 'analytical', 'patient'],
      bio: 'Quiet strategist observing trends before making moves',
      // No social profiles - demonstrating personas can be created without them
    },
  });
  console.log('✅ Created persona:', persona3.displayName);

  // Create sample tasks
  await prisma.personaTask.create({
    data: {
      personaId: persona1.id,
      platform: 'twitter' as const,
      taskType: 'post' as const,
      payload: {
        content: 'Exploring how AI can enhance human creativity rather than replace it. The future is collaborative. 🤖✨',
      },
      status: 'pending' as const,
    },
  });

  await prisma.personaTask.create({
    data: {
      personaId: persona2.id,
      platform: 'twitter' as const,
      taskType: 'post' as const,
      payload: {
        content: 'Just discovered an amazing new tool that combines AI with design. Game changer! 🚀',
      },
      status: 'scheduled' as const,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
  });

  console.log('✅ Created sample tasks');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  await pool.end();
  });

