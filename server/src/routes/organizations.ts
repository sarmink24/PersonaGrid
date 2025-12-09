import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { OrganizationService } from '../services/organizationService.js';

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
    const personas = await OrganizationService.listPersonas(req.organization.id);
    res.json({ personas });
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
    const persona = await OrganizationService.updatePersona(
      req.organization.id,
      req.params.id,
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
    const persona = await OrganizationService.togglePersonaStatus(
      req.organization.id,
      req.params.id
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
    await OrganizationService.deletePersona(
      req.organization.id,
      req.params.id
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

