import { PgBoss } from 'pg-boss';
import type { Job, SendOptions } from 'pg-boss/dist/types.js';
import { prisma } from '../db/prisma.js';
import { getProvider } from '../providers/registry.js';

const QUEUE_NAME = 'persona-task';

let boss: PgBoss | null = null;

interface TaskJobData {
  taskId: string;
}

async function handleJob(jobs: Job<TaskJobData>[]): Promise<void> {
  for (const job of jobs) {
    await processJob(job);
  }
}

async function processJob(job: Job<TaskJobData>): Promise<void> {
  const { taskId } = job.data;

  const task = await prisma.personaTask.findUnique({
    where: { id: taskId },
    include: {
      persona: {
        include: {
          socialProfiles: true,
        },
      },
    },
  });

  if (!task) {
    console.warn(`[TaskWorker] Task ${taskId} not found, skipping`);
    return;
  }

  // Mark as in_progress
  await prisma.personaTask.update({
    where: { id: taskId },
    data: { status: 'running' },
  });

  try {
    const provider = getProvider(task.platform);
    const profile = task.persona.socialProfiles.find(
      (sp) => sp.network === task.platform
    );
    const accessToken = profile?.accessToken ?? '';
    const payload = task.payload as Record<string, unknown>;
    const content = (payload.content as string) ?? '';
    const targetId = (payload.targetId as string) ?? '';

    let result;
    switch (task.taskType) {
      case 'post':
        result = await provider.post(content, { accessToken });
        break;
      case 'like':
        result = await provider.like(targetId, { accessToken });
        break;
      case 'comment':
        result = await provider.comment(targetId, content, { accessToken });
        break;
      case 'share':
        result = await provider.share(targetId, { accessToken });
        break;
      case 'follow':
        result = await provider.follow(targetId, { accessToken });
        break;
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }

    if (result.success) {
      await prisma.personaTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });
      console.log(`[TaskWorker] Task ${taskId} completed (externalId: ${result.externalId})`);
    } else {
      throw new Error(result.error ?? 'Provider returned failure');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.personaTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        failureReason: message,
      },
    });
    console.error(`[TaskWorker] Task ${taskId} failed: ${message}`);
  }
}

export async function startWorker(databaseUrl: string): Promise<void> {
  boss = new PgBoss(databaseUrl);

  boss.on('error', (error: Error) => {
    console.error('[pg-boss] Error:', error);
  });

  await boss.start();
  await boss.work<TaskJobData>(QUEUE_NAME, handleJob);
  console.log(`[TaskWorker] Listening on queue "${QUEUE_NAME}"`);
}

export async function stopWorker(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true });
    console.log('[TaskWorker] Stopped');
    boss = null;
  }
}

export async function enqueueTask(taskId: string, startAfter?: Date): Promise<void> {
  if (!boss) {
    throw new Error('pg-boss not started — call startWorker first');
  }

  const options: SendOptions = {};
  if (startAfter) {
    options.startAfter = startAfter;
  }

  await boss.send(QUEUE_NAME, { taskId }, options);
  console.log(`[TaskWorker] Enqueued task ${taskId}${startAfter ? ` (startAfter: ${startAfter.toISOString()})` : ''}`);
}
