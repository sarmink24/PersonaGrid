import Groq from 'groq-sdk';
import { prisma } from '../db/prisma.js';
import type { Task } from '../types/index.js';
import { HttpError } from '../utils/httpError.js';
import { z } from 'zod';

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

const AdminCommandPayload = z.object({
    command: z.string().min(10),
    platform: z.enum(['twitter', 'instagram', 'facebook']).optional(),
    taskType: z.enum(['like', 'share', 'post', 'comment', 'follow']).optional(),
    scheduledFor: z.string().optional(),
});

interface PersonaSummary {
    id: string;
    displayName: string;
    personalityTraits: string[];
    bio: string | null;
}

interface CommandAnalysis {
    intent: string;
    platform: Task['platform'];
    taskType: Task['taskType'];
    targetAllPersonas: boolean;
    suggestedPersonas?: string[];
}

// Analyze natural language command using AI
async function analyzeCommand(command: string): Promise<CommandAnalysis> {
    try {
        const prompt = `You are an AI assistant that analyzes social media marketing commands.
Extract the following information from the command:
1. intent - what the user wants to accomplish
2. platform - which social network (twitter, instagram, or facebook). Default to twitter if not specified.
3. taskType - the type of action (post, like, share, comment, or follow). Default to post if not specified.
4. targetAllPersonas - whether to target all personas (true) or specific ones (false)

Command: "${command}"

Respond ONLY with valid JSON in this exact format:
{
  "intent": "description of what to do",
  "platform": "twitter" | "instagram" | "facebook",
  "taskType": "post" | "like" | "share" | "comment" | "follow",
  "targetAllPersonas": true | false
}`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 500
        });

        const text = completion.choices[0]?.message?.content;

        if (!text) {
            throw new HttpError(500, 'Failed to analyze command');
        }

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

        try {
            const analysis = JSON.parse(jsonStr) as CommandAnalysis;
            return analysis;
        } catch (error) {
            console.error('Failed to parse JSON:', jsonStr);
            throw new HttpError(500, 'Failed to parse command analysis');
        }
    } catch (error: any) {
        console.error('Groq API Error:', error);
        if (error instanceof HttpError) throw error;
        throw new HttpError(500, `AI Service Error: ${error.message || 'Unknown error'}`);
    }
}

// Generate content for a persona based on the command intent
async function generatePersonaContent(
    intent: string,
    platform: Task['platform'],
    persona: PersonaSummary
): Promise<string> {
    try {
        const prompt = `You ARE ${persona.displayName}. This is not roleplay - you are this actual person posting on ${platform}.

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

TASK: ${intent}

Write a ${platform} post that:
- Sounds like YOU (${persona.displayName}) would actually write it
- Uses platform-specific style (hashtags for Instagram/Twitter, casual for Facebook)
- Is concise and engaging
- Embodies your personality BRUTALLY - no softening, no diplomacy
- Feels like a real person, not a corporate bot

IMPORTANT: Respond with ONLY the post content. No explanations, no meta-commentary, no "Here's the post" - just the raw content.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.9, // Higher for more personality
            max_tokens: 300
        });

        return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
        console.error(`Error generating content for persona ${persona.displayName}:`, error);
        return `Failed to generate content: ${error.message}`;
    }
}

export const AdminCommandService = {
    async previewAdminCommand(payload: unknown) {
        const parsed = AdminCommandPayload.parse(payload);

        // Analyze the command
        const analysis = await analyzeCommand(parsed.command);

        // Override with explicit parameters if provided
        const platform = parsed.platform || analysis.platform;
        const taskType = parsed.taskType || analysis.taskType;

        // Fetch all global personas
        const personas = await prisma.persona.findMany({
            where: {
                organizationId: null, // Global personas only
            },
            select: {
                id: true,
                displayName: true,
                personalityTraits: true,
                bio: true,
            },
        });

        if (personas.length === 0) {
            throw new HttpError(400, 'No global personas available. Create global personas first.');
        }

        // Generate content for each persona
        const previews = await Promise.all(
            personas.map(async (persona) => {
                const generatedContent = await generatePersonaContent(
                    analysis.intent,
                    platform,
                    persona
                );

                return {
                    personaId: persona.id,
                    displayName: persona.displayName,
                    personalityTraits: persona.personalityTraits,
                    generatedContent,
                };
            })
        );

        return {
            originalCommand: parsed.command,
            analyzedIntent: analysis.intent,
            platform,
            taskType,
            scheduledFor: parsed.scheduledFor,
            previews,
        };
    },

    async confirmAdminCommand(payload: unknown) {
        const schema = z.object({
            platform: z.enum(['twitter', 'instagram', 'facebook']),
            taskType: z.enum(['like', 'share', 'post', 'comment', 'follow']),
            scheduledFor: z.string().optional(),
            confirmations: z.array(
                z.object({
                    personaId: z.string(),
                    content: z.string(),
                })
            ),
        });

        const parsed = schema.parse(payload);

        // Create tasks for each confirmation
        const tasks = await Promise.all(
            parsed.confirmations.map(async (confirmation) => {
                // Verify persona exists and is global
                const persona = await prisma.persona.findFirst({
                    where: {
                        id: confirmation.personaId,
                        organizationId: null, // Must be global
                    },
                });

                if (!persona) {
                    throw new HttpError(404, `Global persona ${confirmation.personaId} not found`);
                }

                // Create the task
                const task = await prisma.personaTask.create({
                    data: {
                        personaId: confirmation.personaId,
                        platform: parsed.platform,
                        taskType: parsed.taskType,
                        payload: {
                            content: confirmation.content,
                            source: 'admin_command',
                        },
                        status: parsed.scheduledFor ? 'scheduled' : 'pending',
                        scheduledFor: parsed.scheduledFor ? new Date(parsed.scheduledFor) : null,
                    },
                });

                return {
                    id: task.id,
                    personaId: task.personaId,
                    platform: task.platform,
                    taskType: task.taskType,
                    payload: task.payload as Record<string, unknown>,
                    status: task.status,
                    scheduledFor: task.scheduledFor?.toISOString() || null,
                    createdAt: task.createdAt.toISOString(),
                };
            })
        );

        return { tasks };
    },
};
