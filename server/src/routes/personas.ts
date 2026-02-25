import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { TaskService } from '../services/taskService.js';
import { prisma } from '../db/prisma.js';
import { parsePaginationParams, paginatedResponse } from '../utils/pagination.js';

export const personasRouter = Router({ mergeParams: true });

/** Verify the persona belongs to the authenticated org or is a global persona. */
async function verifyPersonaAccess(personaId: string, organizationId: string) {
  const persona = await prisma.persona.findFirst({
    where: {
      id: personaId,
      OR: [
        { organizationId },
        { organization: { is: null } }
      ]
    },
    select: { id: true },
  });
  return persona !== null;
}

personasRouter.get('/:personaId/tasks', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const personaId = req.params.personaId;
    if (!personaId) {
      return res.status(400).json({ error: 'Persona ID required' });
    }
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!(await verifyPersonaAccess(personaId, req.organization.id))) {
      return res.status(403).json({ error: 'Access denied to this persona' });
    }
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { data, total } = await TaskService.listForPersona(personaId, skip, limit);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
});

personasRouter.post('/:personaId/tasks', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const personaId = req.params.personaId;
    if (!personaId) {
      return res.status(400).json({ error: 'Persona ID required' });
    }
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!(await verifyPersonaAccess(personaId, req.organization.id))) {
      return res.status(403).json({ error: 'Access denied to this persona' });
    }
    const task = await TaskService.create(personaId, req.body);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});
