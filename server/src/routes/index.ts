import type { Express } from 'express';
import { authRouter } from './auth.js';
import { adminRouter } from './admin.js';
import { organizationsRouter } from './organizations.js';
import { personasRouter } from './personas.js';
import { tasksRouter } from './tasks.js';
import { smartCommandsRouter } from './smartCommands.js';

export const registerRoutes = (app: Express) => {
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/personas', personasRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/smart-commands', smartCommandsRouter);
};

