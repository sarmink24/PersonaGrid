import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateAdmin, type AdminRequest } from '../middleware/adminAuth.js';
import { AdminService } from '../services/adminService.js';
import { AdminCommandService } from '../services/adminCommandService.js';
import { parsePaginationParams, paginatedResponse } from '../utils/pagination.js';

const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // stricter than org auth — admin is a high-value target
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminRouter = Router();

adminRouter.post('/login', adminAuthLimiter, async (req, res, next) => {
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
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { data, total } = await AdminService.listOrganizations(skip, limit);
    res.json(paginatedResponse(data, total, page, limit));
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

adminRouter.put('/organizations/:id', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Organization ID required' });
    }
    const organization = await AdminService.updateOrganization(id, req.body);
    res.json({ organization });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/organizations/:id', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Organization ID required' });
    }
    await AdminService.deleteOrganization(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/personas', authenticateAdmin, async (req: AdminRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { data, total } = await AdminService.listGlobalPersonas(skip, limit);
    res.json(paginatedResponse(data, total, page, limit));
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
