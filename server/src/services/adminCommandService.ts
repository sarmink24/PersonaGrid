import Groq from 'groq-sdk';
import { prisma } from '../db/prisma.js';
import type { Task } from '../types/index.js';
import { HttpError } from '../utils/httpError.js';
import { z } from 'zod';
import { enqueueTask } from '../workers/taskWorker.js';

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

const AdminCommandPayload = z.object({
    command: z.string().min(10),
    platform: z.enum(['twitter', 'instagram', 'facebook', 'linkedin']).optional(),
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

const PLATFORM_RULES: Record<string, string> = {
    twitter: 'Twitter/X rules: Max 280 characters. Punchy, sharp, viral-worthy. Hashtags optional (0-2 max). No fluff.',
    instagram: 'Instagram rules: Caption style, emotive, story-driven. 2-4 hashtags at the END only. Can use line breaks for emphasis.',
    facebook: 'Facebook rules: Conversational, personal, like talking to friends. Can be 1-3 sentences. No hashtags needed.',
    linkedin: 'LinkedIn rules: Professional but personality-infused. Thought-leadership angle. Insight over hype. 1-3 concise sentences.',
};

// Analyze natural language command using AI
async function analyzeCommand(command: string): Promise<CommandAnalysis> {
    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You analyze social media marketing commands. Extract intent, platform (twitter/instagram/facebook/linkedin, default twitter), taskType (post/like/share/comment/follow, default post), and targetAllPersonas (boolean). Return ONLY valid JSON.`,
                },
                {
                    role: 'user',
                    content: `Command: "${command}"`,
                },
            ],
            temperature: 0.2,
            max_tokens: 300,
            response_format: { type: 'json_object' },
        });

        const text = completion.choices[0]?.message?.content;
        if (!text) throw new HttpError(500, 'Failed to analyze command');

        return JSON.parse(text) as CommandAnalysis;
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
                    content: `Write a ${platform} post about: ${intent}

${PLATFORM_RULES[platform] || ''}

Output ONLY the post text. No quotes. No "Here's my post". No meta-commentary. Just the raw post.`,
                },
            ],
            temperature: 0.85,
            max_tokens: 200,
        });

        const content = completion.choices[0]?.message?.content?.trim();
        if (content && content.startsWith('"') && content.endsWith('"')) {
            return content.slice(1, -1);
        }
        return content || '';
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
            platform: z.enum(['twitter', 'instagram', 'facebook', 'linkedin']),
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

                const scheduledDate = parsed.scheduledFor ? new Date(parsed.scheduledFor) : null;

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
                        status: scheduledDate ? 'scheduled' : 'pending',
                        ...(scheduledDate ? { scheduledFor: scheduledDate } : {}),
                    },
                });

                // Enqueue for execution
                try {
                    await enqueueTask(task.id, scheduledDate ?? undefined);
                } catch (err) {
                    console.error(`Failed to enqueue task ${task.id}:`, err);
                }

                return {
                    id: task.id,
                    personaId: task.personaId,
                    platform: task.platform,
                    taskType: task.taskType,
                    payload: task.payload as Record<string, unknown>,
                    status: task.status,
                    scheduledFor: task.scheduledFor?.toISOString() || null,
                    createdAt: task.createdAt.toISOString(),
                    updatedAt: task.updatedAt.toISOString(),
                    completedAt: task.completedAt?.toISOString() || null,
                    failureReason: task.failureReason,
                };
            })
        );

        return { tasks };
    },
};
