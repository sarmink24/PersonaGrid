import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import type { Task } from '../types/index.js';
import { HttpError } from '../utils/httpError.js';
import { enqueueTask } from '../workers/taskWorker.js';

const taskSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'facebook', 'linkedin']),
  taskType: z.enum(['like', 'share', 'post', 'comment', 'follow']),
  payload: z.record(z.string(), z.unknown()),
  scheduledFor: z.string().datetime().optional(),
});

const mapTask = (task: {
  id: string;
  personaId: string;
  platform: string;
  taskType: string;
  payload: unknown;
  status: string;
  scheduledFor: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  failureReason: string | null;
}): Task => ({
  id: task.id,
  personaId: task.personaId,
  platform: task.platform as Task['platform'],
  taskType: task.taskType as Task['taskType'],
  payload: task.payload as Record<string, unknown>,
  status: task.status as Task['status'],
  scheduledFor: task.scheduledFor?.toISOString() ?? null,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
  completedAt: task.completedAt?.toISOString() ?? null,
  failureReason: task.failureReason,
});

const ensurePersona = async (personaId: string) => {
  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
    select: { id: true },
  });
  if (!persona) {
    throw new HttpError(404, 'Persona not found');
  }
};

export const TaskService = {
  async listForPersona(personaId: string, skip = 0, take = 20): Promise<{ data: Task[]; total: number }> {
    await ensurePersona(personaId);
    const [tasks, total] = await Promise.all([
      prisma.personaTask.findMany({
        where: { personaId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.personaTask.count({
        where: { personaId },
      }),
    ]);
    return { data: tasks.map(mapTask), total };
  },

  async create(personaId: string, payload: unknown): Promise<Task> {
    await ensurePersona(personaId);
    const parsed = taskSchema.parse(payload);
    const scheduledDate = parsed.scheduledFor ? new Date(parsed.scheduledFor) : null;
    const task = await prisma.personaTask.create({
      data: {
        personaId,
        platform: parsed.platform as 'twitter' | 'instagram' | 'facebook',
        taskType: parsed.taskType as 'like' | 'share' | 'post' | 'comment' | 'follow',
        payload: parsed.payload as any,
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

    return mapTask(task);
  },

  async updateStatus(
    taskId: string,
    status: Task['status']
  ): Promise<Task | null> {
    const task = await prisma.personaTask.update({
      where: { id: taskId },
      data: { status: status as 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' },
    }).catch(() => null);
    return task ? mapTask(task) : null;
  },
};
