import { Router } from 'express';
import { z } from 'zod';
import { TaskService } from '../services/taskService.js';
import { HttpError } from '../utils/httpError.js';

const statusSchema = z.object({
  status: z.enum(['pending', 'scheduled', 'running', 'completed', 'failed']),
});

import { authenticate } from '../middleware/auth.js';

export const tasksRouter = Router();

tasksRouter.patch('/:taskId/status', authenticate, async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID required' });
    }
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid status payload', parsed.error.issues);
    }

    const task = await TaskService.updateStatus(
      taskId,
      parsed.data.status
    );

    if (!task) {
      throw new HttpError(404, 'Task not found');
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

