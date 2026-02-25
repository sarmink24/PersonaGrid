import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { OrganizationService } from '../services/organizationService.js';
import { parsePaginationParams, paginatedResponse } from '../utils/pagination.js';

export const organizationsRouter = Router();

// Get current organization (requires auth)
organizationsRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ organization: req.organization });
  } catch (error) {
    next(error);
  }
});

// Get personas for current organization (requires auth)
organizationsRouter.get('/personas', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { data, total } = await OrganizationService.listPersonas(req.organization.id, skip, limit);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
});

// Create persona for current organization (requires auth)
organizationsRouter.post('/personas', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const persona = await OrganizationService.createPersona(
      req.organization.id,
      req.body
    );
    res.status(201).json({ persona });
  } catch (error) {
    next(error);
  }
});

// Update persona for current organization (requires auth)
organizationsRouter.patch('/personas/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const personaId = req.params.id;
    if (!personaId) {
      return res.status(400).json({ error: 'Persona ID required' });
    }
    const persona = await OrganizationService.updatePersona(
      req.organization.id,
      personaId,
      req.body
    );
    res.json({ persona });
  } catch (error) {
    next(error);
  }
});

// Toggle persona status for current organization (requires auth)
organizationsRouter.patch('/personas/:id/toggle-status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const personaId = req.params.id;
    if (!personaId) {
      return res.status(400).json({ error: 'Persona ID required' });
    }
    const persona = await OrganizationService.togglePersonaStatus(
      req.organization.id,
      personaId
    );
    res.json({ persona });
  } catch (error) {
    next(error);
  }
});

// Delete persona for current organization (requires auth)
organizationsRouter.delete('/personas/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const personaId = req.params.id;
    if (!personaId) {
      return res.status(400).json({ error: 'Persona ID required' });
    }
    await OrganizationService.deletePersona(
      req.organization.id,
      personaId
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

