import { Router } from 'express';
import { authenticateAdmin, type AdminRequest } from '../middleware/adminAuth.js';
import { AdminService } from '../services/adminService.js';
import { AdminCommandService } from '../services/adminCommandService.js';

export const adminRouter = Router();

adminRouter.post('/login', async (req, res, next) => {
  try {
    const result = await AdminService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/me', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ admin: req.admin });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/organizations', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const organizations = await AdminService.listOrganizations();
    res.json({ organizations });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch(
  '/organizations/:organizationId/toggle',
  authenticateAdmin,
  async (req: AdminRequest, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const organizationId = req.params.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      const organization = await AdminService.toggleOrganizationStatus(organizationId);
      res.json({ organization });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get('/personas', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    const personas = await AdminService.listGlobalPersonas();
    res.json({ personas });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/personas', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    const persona = await AdminService.createGlobalPersona(req.body);
    res.status(201).json({ persona });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/personas/:id', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID required' });
    await AdminService.deleteGlobalPersona(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/personas/:id', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const persona = await AdminService.updateGlobalPersona(id, req.body);
    res.json({ persona });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/personas/:id/toggle-status', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const persona = await AdminService.togglePersonaStatus(id);
    res.json({ persona });
  } catch (error) {
    next(error);
  }
});

// Admin AI Command Routes
adminRouter.post('/commands/preview', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    const result = await AdminCommandService.previewAdminCommand(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/commands/confirm', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    const result = await AdminCommandService.confirmAdminCommand(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
