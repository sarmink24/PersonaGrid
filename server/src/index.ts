import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startWorker, stopWorker } from './workers/taskWorker.js';

const app = express();

app.use(helmet());

const allowedOrigins = env.nodeEnv === 'production'
  ? [env.clientOrigin]
  : [env.clientOrigin, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(
  cors({
    origin: allowedOrigins,
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

const server = app.listen(env.port, () => {
  console.log(`PersonaGrid API running on port ${env.port}`);
});

// Start pg-boss task worker
startWorker(env.databaseUrl).catch((err) => {
  console.error('Failed to start task worker:', err);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await stopWorker();
  server.close();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

