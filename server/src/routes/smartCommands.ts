import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { SmartCommandService } from '../services/smartCommandService.js';
import { HttpError } from '../utils/httpError.js';

export const smartCommandsRouter = Router();

smartCommandsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { organization } = req as AuthRequest;
    if (!organization) throw new HttpError(401, 'Unauthorized');

    const result = await SmartCommandService.createSmartCommand(
      organization.id,
      req.body
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

smartCommandsRouter.post('/preview', authenticate, async (req, res, next) => {
  try {
    const { organization } = req as AuthRequest;
    if (!organization) throw new HttpError(401, 'Unauthorized');

    const result = await SmartCommandService.previewSmartCommand(
      organization.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

smartCommandsRouter.post('/confirm', authenticate, async (req, res, next) => {
  try {
    const { organization } = req as AuthRequest;
    if (!organization) throw new HttpError(401, 'Unauthorized');

    const result = await SmartCommandService.confirmSmartCommand(
      organization.id,
      req.body
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
