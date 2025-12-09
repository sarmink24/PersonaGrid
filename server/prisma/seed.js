import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();
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
                        network: 'twitter',
                        handle: 'neonsage_ai',
                    },
                    {
                        network: 'instagram',
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
            socialProfiles: {
                create: [
                    {
                        network: 'twitter',
                        handle: 'quantumpulse',
                    },
                    {
                        network: 'facebook',
                        handle: 'quantumpulse',
                    },
                ],
            },
        },
    });
    console.log('✅ Created persona:', persona2.displayName);
    // Create sample tasks
    await prisma.personaTask.create({
        data: {
            personaId: persona1.id,
            platform: 'twitter',
            taskType: 'post',
            payload: {
                content: 'Exploring how AI can enhance human creativity rather than replace it. The future is collaborative. 🤖✨',
            },
            status: 'pending',
        },
    });
    await prisma.personaTask.create({
        data: {
            personaId: persona2.id,
            platform: 'twitter',
            taskType: 'post',
            payload: {
                content: 'Just discovered an amazing new tool that combines AI with design. Game changer! 🚀',
            },
            status: 'scheduled',
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
});
//# sourceMappingURL=seed.js.map