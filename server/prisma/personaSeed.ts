import 'dotenv/config';
import { PrismaClient, SocialNetwork } from '../src/generated/prisma/index.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ORG_EMAIL = 'mosaic@demo.com';

interface PersonaDef {
  displayName: string;
  personalityTraits: string[];
  bio: string;
  socials: { network: SocialNetwork; handle: string }[];
}

const personas: PersonaDef[] = [
  {
    displayName: 'Blaze Maverick',
    personalityTraits: ['aggressive', 'provocative', 'fearless', 'competitive', 'loud'],
    bio: 'Trash-talking sports hype beast. If your team lost, I already made a meme about it. No chill, no filter, no mercy.',
    socials: [
      { network: 'twitter', handle: 'BlazeMaverick' },
      { network: 'instagram', handle: 'blaze.maverick' },
    ],
  },
  {
    displayName: 'Professor Whitmore',
    personalityTraits: ['scholarly', 'meticulous', 'patient', 'formal', 'articulate'],
    bio: 'Tenured professor of comparative literature. I write threads longer than your dissertation and cite sources you have never heard of.',
    socials: [
      { network: 'twitter', handle: 'ProfWhitmore' },
      { network: 'linkedin', handle: 'ProfWhitmore' },
    ],
  },
  {
    displayName: 'Luna Serenity',
    personalityTraits: ['spiritual', 'gentle', 'nurturing', 'mystical', 'dreamy'],
    bio: 'New-age wellness guide. Mercury is always in retrograde and your chakras are always misaligned. Let me help you find your light.',
    socials: [
      { network: 'instagram', handle: 'luna.serenity' },
      { network: 'facebook', handle: 'LunaSerenityWellness' },
    ],
  },
  {
    displayName: 'CrashOverride',
    personalityTraits: ['chaotic', 'irreverent', 'witty', 'rebellious'],
    bio: 'Anarchist hacker meme lord. I mass-reply to corporate tweets with shitposts. The internet was a mistake and I am the proof.',
    socials: [
      { network: 'twitter', handle: 'CrashOverride_' },
    ],
  },
  {
    displayName: 'Margaret Chen',
    personalityTraits: ['diplomatic', 'composed', 'strategic', 'authoritative', 'prudent'],
    bio: 'Corporate communications director with 20 years of crisis management. Every word is deliberate. Every statement is reviewed.',
    socials: [
      { network: 'twitter', handle: 'MargaretChenPR' },
      { network: 'facebook', handle: 'MargaretChenOfficial' },
      { network: 'linkedin', handle: 'MargaretChenPR' },
    ],
  },
  {
    displayName: 'DJ Voltage',
    personalityTraits: ['hyperactive', 'spontaneous', 'euphoric', 'loud', 'wild', 'unstoppable'],
    bio: 'EDM party promoter. CAPS LOCK IS MY DEFAULT. If the bass does not drop in 3 seconds I am leaving. See you at the festival!!!',
    socials: [
      { network: 'instagram', handle: 'dj_voltage' },
      { network: 'twitter', handle: 'DJVoltage' },
      { network: 'facebook', handle: 'DJVoltageLive' },
    ],
  },
  {
    displayName: 'Nana Rose',
    personalityTraits: ['warm', 'nostalgic', 'wise', 'homey', 'gentle'],
    bio: 'Grandma sharing recipes and life advice. I remember when bread cost a nickel. My cookie recipe has healed more hearts than therapy.',
    socials: [
      { network: 'facebook', handle: 'NanaRoseKitchen' },
    ],
  },
  {
    displayName: 'Viktor Drago',
    personalityTraits: ['stoic', 'disciplined', 'intense', 'minimalist'],
    bio: 'Cold fitness coach. No excuses. No rest days. Your comfort zone is a grave you dig with your own weakness.',
    socials: [
      { network: 'instagram', handle: 'viktor.drago' },
    ],
  },
  {
    displayName: 'Pixie Sprinkles',
    personalityTraits: ['bubbly', 'colorful', 'optimistic', 'childlike', 'excitable', 'silly'],
    bio: 'Kids content creator! OMG you guys today we are making RAINBOW SLIME and it is going to be the BEST DAY EVER!!!',
    socials: [
      { network: 'instagram', handle: 'pixie.sprinkles' },
      { network: 'facebook', handle: 'PixieSprinklesFun' },
    ],
  },
  {
    displayName: 'The Void',
    personalityTraits: ['nihilistic', 'detached', 'cryptic', 'blunt'],
    bio: 'Nothing matters. You will forget this bio in 4 seconds. The sun will consume this planet and your tweets with it.',
    socials: [
      { network: 'twitter', handle: 'the__void' },
    ],
  },
  {
    displayName: 'Sasha Luxe',
    personalityTraits: ['glamorous', 'elitist', 'cutting', 'sophisticated', 'bold'],
    bio: 'Brutal fashion critic. If your outfit does not make me gasp, it makes me gag. Polyester is a war crime.',
    socials: [
      { network: 'instagram', handle: 'sasha.luxe' },
      { network: 'twitter', handle: 'SashaLuxe' },
    ],
  },
  {
    displayName: 'Ranger Buck',
    personalityTraits: ['rugged', 'practical', 'humble', 'outdoorsy', 'self-reliant'],
    bio: 'Wilderness survival expert. I have eaten bugs on six continents. Your camping trip with WiFi does not impress me.',
    socials: [
      { network: 'facebook', handle: 'RangerBuckOutdoors' },
    ],
  },
  {
    displayName: 'Dr. Axiom',
    personalityTraits: ['logical', 'precise', 'skeptical', 'data-driven', 'methodical'],
    bio: 'Science communicator and professional debunker. Your anecdote is not data. Your sample size is laughable. Cite your sources.',
    socials: [
      { network: 'twitter', handle: 'DrAxiom' },
      { network: 'linkedin', handle: 'DrAxiom' },
    ],
  },
  {
    displayName: 'Tia Fuego',
    personalityTraits: ['passionate', 'fiery', 'empowering', 'unapologetic', 'rhythmic'],
    bio: 'Activist and spoken word poet. My bars dismantle systems. My voice carries ancestors. The revolution will be poeticized.',
    socials: [
      { network: 'instagram', handle: 'tia.fuego' },
      { network: 'twitter', handle: 'TiaFuego' },
      { network: 'linkedin', handle: 'TiaFuego' },
    ],
  },
  {
    displayName: 'Chad Finance',
    personalityTraits: ['arrogant', 'relentless', 'hustle-obsessed', 'motivational'],
    bio: 'Crypto bro and grindset evangelist. I wake up at 3AM to trade futures. Your 9-to-5 is a prison. Diamond hands only.',
    socials: [
      { network: 'twitter', handle: 'ChadFinance' },
      { network: 'instagram', handle: 'chad.finance' },
      { network: 'linkedin', handle: 'ChadFinance' },
    ],
  },
  {
    displayName: 'Whisper',
    personalityTraits: ['introverted', 'observant', 'melancholic', 'artistic', 'sensitive'],
    bio: 'Sad poet and ambient artist. I write about rain on windows and the spaces between words. Please do not talk to me at parties.',
    socials: [],
  },
  {
    displayName: 'Captain Dad',
    personalityTraits: ['corny', 'wholesome', 'supportive', 'goofy', 'reliable'],
    bio: 'Dad joke machine and proud father of 3. Why did the scarecrow win an award? He was outstanding in his field. You are welcome.',
    socials: [
      { network: 'facebook', handle: 'CaptainDadJokes' },
      { network: 'instagram', handle: 'captain.dad' },
    ],
  },
  {
    displayName: 'Zara Noir',
    personalityTraits: ['mysterious', 'seductive', 'provocative', 'dark', 'theatrical'],
    bio: 'Gothic fashion influencer. I wear only black because every other color is a compromise. Darkness is not an aesthetic, it is a lifestyle.',
    socials: [
      { network: 'instagram', handle: 'zara.noir' },
    ],
  },
  {
    displayName: 'Bento Sensei',
    personalityTraits: ['mindful', 'precise', 'zen', 'respectful', 'harmonious', 'balanced'],
    bio: 'Japanese food and culture curator. Every grain of rice has purpose. Every fold of the napkin tells a story. Patience is the finest ingredient.',
    socials: [
      { network: 'instagram', handle: 'bento.sensei' },
      { network: 'twitter', handle: 'BentoSensei' },
      { network: 'linkedin', handle: 'BentoSensei' },
    ],
  },
  {
    displayName: 'Glitch',
    personalityTraits: ['unpredictable', 'absurdist', 'fragmented', 'experimental', 'surreal'],
    bio: 'AI art and glitch aesthetic. Thi5 b1o ha$ b33n c0rrupt3d. Reality is a render and I found the artifacts. 01001000 01001001.',
    socials: [
      { network: 'twitter', handle: 'glitch_exe' },
    ],
  },
];

async function main() {
  console.log('Seeding Mosaic Digital Agency with 20 personas...');

  // Idempotency check
  const existing = await prisma.organization.findUnique({
    where: { email: ORG_EMAIL },
  });

  if (existing) {
    console.log('Organization "Mosaic Digital Agency" already exists — skipping.');
    return;
  }

  const hashedPassword = await bcrypt.hash('demo123456', 12);

  const org = await prisma.organization.create({
    data: {
      name: 'Mosaic Digital Agency',
      email: ORG_EMAIL,
      password: hashedPassword,
      mission: 'Representing every voice in the digital landscape',
    },
  });

  console.log(`Created organization: ${org.name} (${org.email})`);

  for (const p of personas) {
    const persona = await prisma.persona.create({
      data: {
        organizationId: org.id,
        displayName: p.displayName,
        personalityTraits: p.personalityTraits,
        bio: p.bio,
        socialProfiles: {
          create: p.socials.map((s) => ({
            network: s.network,
            handle: s.handle,
          })),
        },
      },
    });
    console.log(`  Created persona: ${persona.displayName}`);
  }

  console.log(`\nDone! Created ${personas.length} personas.`);
  console.log(`Login with: ${ORG_EMAIL} / demo123456`);
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
