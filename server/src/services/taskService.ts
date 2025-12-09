import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import type { Task } from '../types/index.js';
import { HttpError } from '../utils/httpError.js';

const taskSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'facebook']),
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
}): Task => ({
  id: task.id,
  personaId: task.personaId,
  platform: task.platform as Task['platform'],
  taskType: task.taskType as Task['taskType'],
  payload: task.payload as Record<string, unknown>,
  status: task.status as Task['status'],
  scheduledFor: task.scheduledFor?.toISOString() ?? null,
  createdAt: task.createdAt.toISOString(),
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
  async listForPersona(personaId: string): Promise<Task[]> {
    await ensurePersona(personaId);
    const tasks = await prisma.personaTask.findMany({
      where: { personaId },
      orderBy: { createdAt: 'desc' },
    });
    return tasks.map(mapTask);
  },

  async create(personaId: string, payload: unknown): Promise<Task> {
    await ensurePersona(personaId);
    const parsed = taskSchema.parse(payload);
    const task = await prisma.personaTask.create({
      data: {
        personaId,
        platform: parsed.platform as 'twitter' | 'instagram' | 'facebook',
        taskType: parsed.taskType as 'like' | 'share' | 'post' | 'comment' | 'follow',
        payload: parsed.payload as any,
        status: 'pending',
        scheduledFor: parsed.scheduledFor ? new Date(parsed.scheduledFor) : null,
      },
    });
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
