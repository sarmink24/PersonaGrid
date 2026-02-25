import Groq from 'groq-sdk';
import { prisma } from '../db/prisma.js';
import { TaskService } from './taskService.js';
import type { Task } from '../types/index.js';
import { HttpError } from '../utils/httpError.js';
import { z } from 'zod';

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

const smartCommandSchema = z.object({
  prompt: z.string().min(1),
  platform: z.enum(['twitter', 'instagram', 'facebook', 'linkedin']),
  taskType: z.enum(['like', 'share', 'post', 'comment', 'follow']),
  scheduledFor: z.string().optional(),
});

const confirmSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'facebook', 'linkedin']),
  taskType: z.enum(['like', 'share', 'post', 'comment', 'follow']),
  scheduledFor: z.string().optional(),
  confirmations: z.array(z.object({
    personaId: z.string(),
    content: z.string(),
  })),
});

interface PersonaSummary {
  id: string;
  displayName: string;
  personalityTraits: string[];
  bio: string | null;
  organizationId?: string | null;
}

/**
 * Prisma where clause for personas belonging to an org OR global (null org).
 */
function orgOrGlobalWhere(organizationId: string) {
  return {
    OR: [
      { organizationId },
      { organization: { is: null } }
    ]
  };
}

const PLATFORM_RULES: Record<string, string> = {
  twitter: 'Twitter/X rules: Max 280 characters. Punchy, sharp, viral-worthy. Hashtags optional (0-2 max). No fluff.',
  instagram: 'Instagram rules: Caption style, emotive, story-driven. 2-4 hashtags at the END only. Can use line breaks for emphasis.',
  facebook: 'Facebook rules: Conversational, personal, like talking to friends. Can be 1-3 sentences. No hashtags needed.',
  linkedin: 'LinkedIn rules: Professional but personality-infused. Thought-leadership angle. Insight over hype. 1-3 concise sentences.',
};

/**
 * Uses LLM to match a prompt to relevant personas.
 * Biased toward inclusion — every persona has a unique voice worth hearing.
 */
async function matchPersonasToPrompt(
  prompt: string,
  personas: PersonaSummary[]
): Promise<string[]> {
  if (personas.length === 0) {
    return [];
  }

  try {
    const personaList = personas
      .map((p) => `- ${p.displayName} [${p.personalityTraits.join(', ')}]`)
      .join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You assign social-media personas to content prompts. Be INCLUSIVE — the value is in getting wildly different takes from different personalities. A grandma, a nihilist, a crypto bro, and a goth influencer ALL have interesting angles on almost any topic. Only exclude if truly impossible. Include 60-80% minimum. Return ONLY valid JSON: {"personas":["Name1","Name2"]}`,
        },
        {
          role: 'user',
          content: `Prompt: "${prompt}"\n\nAvailable personas:\n${personaList}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error('No response from Groq');

    const parsed = JSON.parse(text) as { personas?: string[] };
    const selectedNames = parsed.personas || [];

    const selectedIds = personas
      .filter((p) => selectedNames.includes(p.displayName))
      .map((p) => p.id);

    return selectedIds.length > 0 ? selectedIds : personas.map((p) => p.id);
  } catch (error) {
    console.error('Error matching personas:', error);
    return personas.map((p) => p.id);
  }
}

/**
 * Generates unique, concise, in-character content for a persona.
 */
async function generatePersonaContent(
  prompt: string,
  platform: Task['platform'],
  persona: PersonaSummary
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are ${persona.displayName}. ${persona.bio || ''}

Personality: ${persona.personalityTraits.join(', ')}.

You are a real person posting on ${platform}. Stay 100% in character — your word choices, slang, energy, humor, and worldview must match your personality exactly. Never sound like AI. Never hedge. Never be balanced or diplomatic unless that IS your personality. Have a strong take.`,
        },
        {
          role: 'user',
          content: `Write a ${platform} post about: ${prompt}

${PLATFORM_RULES[platform] || ''}

Output ONLY the post text. No quotes. No "Here's my post". No meta-commentary. Just the raw post.`,
        },
      ],
      temperature: 0.85,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    // Strip any wrapping quotes the model might add
    if (content && content.startsWith('"') && content.endsWith('"')) {
      return content.slice(1, -1);
    }
    return content || prompt;
  } catch (error) {
    console.error(`Error generating content for ${persona.displayName}:`, error);
    return prompt;
  }
}

export const SmartCommandService = {
  async createSmartCommand(
    organizationId: string,
    payload: unknown
  ): Promise<{ tasks: Task[]; assignedPersonas: string[] }> {
    const parsed = smartCommandSchema.parse(payload);

    // Get personas that have a social profile on the target platform
    const personas = await prisma.persona.findMany({
      where: {
        ...orgOrGlobalWhere(organizationId),
        socialProfiles: {
          some: { network: parsed.platform },
        },
      },
      select: {
        id: true,
        displayName: true,
        personalityTraits: true,
        bio: true,
        organizationId: true,
      },
    });

    if (personas.length === 0) {
      throw new HttpError(400, `No personas with a ${parsed.platform} profile. Add social profiles first.`);
    }

    // Use LLM to match prompt to relevant personas
    const matchedPersonaIds = await matchPersonasToPrompt(parsed.prompt, personas);

    // Create tasks for each matched persona
    const tasks: Task[] = [];
    for (const personaId of matchedPersonaIds) {
      const persona = personas.find(p => p.id === personaId);
      let content = parsed.prompt;

      // If it's a post, generate unique content
      if (parsed.taskType === 'post' && persona) {
        content = await generatePersonaContent(parsed.prompt, parsed.platform, persona);
      }

      const task = await TaskService.create(personaId, {
        platform: parsed.platform,
        taskType: parsed.taskType,
        payload: { content },
        scheduledFor: parsed.scheduledFor,
      });
      tasks.push(task);
    }

    const assignedPersonas = personas
      .filter((p) => matchedPersonaIds.includes(p.id))
      .map((p) => p.displayName);

    return { tasks, assignedPersonas };
  },

  async previewSmartCommand(
    organizationId: string,
    payload: unknown
  ): Promise<{
    originalPrompt: string;
    platform: Task['platform'];
    taskType: Task['taskType'];
    scheduledFor?: string;
    previews: Array<{
      personaId: string;
      displayName: string;
      personalityTraits: string[];
      generatedContent: string;
    }>
  }> {
    const parsed = smartCommandSchema.parse(payload);

    // Get personas that have a social profile on the target platform
    const personas = await prisma.persona.findMany({
      where: {
        ...orgOrGlobalWhere(organizationId),
        socialProfiles: {
          some: { network: parsed.platform },
        },
      },
      select: {
        id: true,
        displayName: true,
        personalityTraits: true,
        bio: true,
        organizationId: true,
      },
    });

    if (personas.length === 0) {
      throw new HttpError(400, `No personas with a ${parsed.platform} profile.`);
    }

    // Match personas
    const matchedPersonaIds = await matchPersonasToPrompt(parsed.prompt, personas);
    const matchedPersonas = personas.filter(p => matchedPersonaIds.includes(p.id));

    // Generate content for each matched persona
    const previews = await Promise.all(
      matchedPersonas.map(async (persona) => {
        let generatedContent = parsed.prompt;

        if (parsed.taskType === 'post') {
          generatedContent = await generatePersonaContent(parsed.prompt, parsed.platform, persona);
        }

        return {
          personaId: persona.id,
          displayName: persona.displayName,
          personalityTraits: persona.personalityTraits,
          generatedContent,
        };
      })
    );

    const result: {
      originalPrompt: string;
      platform: Task['platform'];
      taskType: Task['taskType'];
      scheduledFor?: string;
      previews: typeof previews;
    } = {
      originalPrompt: parsed.prompt,
      platform: parsed.platform,
      taskType: parsed.taskType,
      previews,
    };
    if (parsed.scheduledFor) {
      result.scheduledFor = parsed.scheduledFor;
    }
    return result;
  },

  async confirmSmartCommand(
    organizationId: string,
    payload: unknown
  ): Promise<{ tasks: Task[] }> {
    const parsed = confirmSchema.parse(payload);

    const tasks: Task[] = [];

    for (const item of parsed.confirmations) {
      // Verify persona belongs to org OR is global
      const persona = await prisma.persona.findFirst({
        where: {
          id: item.personaId,
          ...orgOrGlobalWhere(organizationId),
        },
      });

      if (!persona) continue;

      const task = await TaskService.create(item.personaId, {
        platform: parsed.platform,
        taskType: parsed.taskType,
        payload: { content: item.content },
        scheduledFor: parsed.scheduledFor,
      });
      tasks.push(task);
    }

    return { tasks };
  }
};
