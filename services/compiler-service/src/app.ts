import express, { Request, Response, Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compilerService from './services/compiler.service';
import logger from './utils/logger';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'compiler-service' });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Check if we can get queue status
    const queueStatus = await compilerService.getQueueStatus();
    res.status(200).json({
      status: 'ready',
      service: 'compiler-service',
      queue: queueStatus,
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({ status: 'not ready', error: 'Service unavailable' });
  }
});

// Queue status endpoint
app.get('/api/queue', async (_req: Request, res: Response) => {
  try {
    const queueStatus = await compilerService.getQueueStatus();
    res.json(queueStatus);
  } catch (error) {
    logger.error('Failed to get queue status:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
