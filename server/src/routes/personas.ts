import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { TaskService } from '../services/taskService.js';

export const personasRouter = Router({ mergeParams: true });

personasRouter.get('/:personaId/tasks', authenticate, async (req, res, next) => {
  try {
    const personaId = req.params.personaId;
    if (!personaId) {
      return res.status(400).json({ error: 'Persona ID required' });
    }
    const tasks = await TaskService.listForPersona(personaId);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

personasRouter.post('/:personaId/tasks', authenticate, async (req, res, next) => {
  try {
    const personaId = req.params.personaId;
    if (!personaId) {
      return res.status(400).json({ error: 'Persona ID required' });
    }
    const task = await TaskService.create(personaId, req.body);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

