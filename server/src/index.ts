import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

registerRoutes(app);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`PersonaGrid API running on port ${env.port}`);
});

