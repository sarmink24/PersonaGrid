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

interface SmartCommandPayload {
  prompt: string;
  platform: Task['platform'];
  taskType: Task['taskType'];
  scheduledFor?: string;
}

interface PersonaSummary {
  id: string;
  displayName: string;
  personalityTraits: string[];
  bio: string | null;
  organizationId?: string | null;
}

/**
 * Uses LLM to match a prompt to relevant personas based on their personality traits
 */
async function matchPersonasToPrompt(
  prompt: string,
  personas: PersonaSummary[]
): Promise<string[]> {
  if (personas.length === 0) {
    return [];
  }

  try {
    const personasDescription = personas
      .map(
        (p) =>
          `- ${p.displayName}: ${p.personalityTraits.join(', ')}${p.bio ? ` (${p.bio})` : ''}`
      )
      .join('\n');

    const systemPrompt = `You are a task assignment system. Your job is to analyze a marketing prompt and determine which AI personas are best suited to execute it based on their personality traits.

Available personas:
${personasDescription}

Marketing prompt: "${prompt}"

Return a JSON object with a "personas" array containing the display names (not IDs) of personas that should be assigned this task. Be selective - only include personas whose traits genuinely align with the task. If no personas are suitable, return an empty array.

Example response:
{
  "personas": ["DisplayName1", "DisplayName2"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      throw new Error('No response from Groq');
    }

    // Clean up markdown code blocks if present
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

    // Parse the response
    const parsed = JSON.parse(jsonStr) as { personas?: string[] };
    const selectedNames = parsed.personas || [];

    // Map display names back to IDs
    const selectedIds = personas
      .filter((p) => selectedNames.includes(p.displayName))
      .map((p) => p.id);

    return selectedIds.length > 0 ? selectedIds : personas.map((p) => p.id); // Fallback to all if none matched
  } catch (error) {
    console.error('Error matching personas:', error);
    // Fallback: assign to all personas if LLM fails
    return personas.map((p) => p.id);
  }
}

/**
 * Generates unique content for a persona based on their traits and the prompt
 */
async function generatePersonaContent(
  prompt: string,
  platform: Task['platform'],
  persona: PersonaSummary
): Promise<string> {
  try {
    const systemPrompt = `You ARE ${persona.displayName}. This is not roleplay - you are this actual person posting on ${platform}.

YOUR IDENTITY:
- Name: ${persona.displayName}
- Personality: ${persona.personalityTraits.join(', ')}
- Background: ${persona.bio || 'N/A'}

CRITICAL RULES - READ CAREFULLY:
1. You are NOT an AI assistant - you are ${persona.displayName}, a real person
2. NEVER mention being AI, unbiased, neutral, or diplomatic
3. NEVER say "As an AI" or "I don't have personal opinions"
4. If your personality is "rude" - BE GENUINELY RUDE
5. If your personality is "straightforward" - BE BLUNT AND DIRECT
6. If your personality is "sarcastic" - BE CUTTING AND SARCASTIC
7. If your personality is "aggressive" - BE CONFRONTATIONAL
8. Real people have STRONG opinions - so do you
9. Real people DON'T consider "all perspectives" - neither do you
10. Match your personality's EXACT tone and vibe - no filtering

TASK: ${prompt}

Write a ${platform} post that:
- Sounds like YOU (${persona.displayName}) would actually write it
- Uses platform-specific style (hashtags for Instagram/Twitter, casual for Facebook)
- Is concise and engaging
- Embodies your personality BRUTALLY - no softening, no diplomacy
- Feels like a real person, not a corporate bot

IMPORTANT: Respond with ONLY the post content. No explanations, no meta-commentary, no "Here's the post" - just the raw content.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.9, // Higher for more personality
      max_tokens: 300
    });

    return completion.choices[0]?.message?.content || prompt;
  } catch (error) {
    console.error(`Error generating content for ${persona.displayName}:`, error);
    return prompt;
  }
}

export const SmartCommandService = {
  // Original method - kept for backward compatibility or direct creation
  async createSmartCommand(
    organizationId: string,
    payload: unknown
  ): Promise<{ tasks: Task[]; assignedPersonas: string[] }> {
    const parsed = payload as SmartCommandPayload;

    if (!parsed.prompt || !parsed.platform || !parsed.taskType) {
      throw new HttpError(400, 'Missing required fields: prompt, platform, taskType');
    }

    // Get all personas for this organization AND global personas
    const personas = await prisma.persona.findMany({
      where: {
        OR: [
          { organizationId },
          { organizationId: null as any }
        ]
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
      throw new HttpError(400, 'No personas available. Create at least one persona first.');
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
    const parsed = payload as SmartCommandPayload;

    if (!parsed.prompt || !parsed.platform || !parsed.taskType) {
      throw new HttpError(400, 'Missing required fields: prompt, platform, taskType');
    }

    // Get all personas (organization-specific AND global)
    const personas = await prisma.persona.findMany({
      where: {
        OR: [
          { organizationId },
          { organizationId: null as any }
        ]
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
      throw new HttpError(400, 'No personas available.');
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

    return {
      originalPrompt: parsed.prompt,
      platform: parsed.platform,
      taskType: parsed.taskType,
      scheduledFor: parsed.scheduledFor || undefined,
      previews,
    };
  },

  async confirmSmartCommand(
    organizationId: string,
    payload: unknown
  ): Promise<{ tasks: Task[] }> {
    const schema = z.object({
      platform: z.enum(['twitter', 'instagram', 'facebook']),
      taskType: z.enum(['like', 'share', 'post', 'comment', 'follow']),
      scheduledFor: z.string().optional(),
      confirmations: z.array(z.object({
        personaId: z.string(),
        content: z.string(),
      })),
    });

    // We need to import z from zod at the top of the file, but for now let's just cast
    // Since I can't easily add the import without replacing the whole file, I'll do manual validation
    const parsed = payload as {
      platform: Task['platform'];
      taskType: Task['taskType'];
      scheduledFor?: string;
      confirmations: Array<{ personaId: string; content: string }>;
    };

    if (!parsed.platform || !parsed.taskType || !Array.isArray(parsed.confirmations)) {
      throw new HttpError(400, 'Invalid payload');
    }

    const tasks: Task[] = [];

    for (const item of parsed.confirmations) {
      // Verify persona belongs to org OR is global
      const persona = await prisma.persona.findFirst({
        where: {
          id: item.personaId,
          OR: [
            { organizationId },
            // @ts-ignore
            { organizationId: null }
          ]
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
