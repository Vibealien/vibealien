import express, { Request, Response, Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import collaborationService from './services/collaboration.service';
import { getRoomStats } from './services/websocket.service';
import logger from './utils/logger';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'collaboration-service' });
});

app.get('/health/ready', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ready', service: 'collaboration-service' });
});

// Get file sessions
app.get('/api/files/:fileId/sessions', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const sessions = await collaborationService.getFileSessions(fileId);
    res.json({ sessions });
  } catch (error) {
    logger.error('Failed to get file sessions:', error);
    res.status(500).json({ error: 'Failed to get file sessions' });
  }
});

// Get file presence
app.get('/api/files/:fileId/presence', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const presence = await collaborationService.getFilePresence(fileId);
    res.json({ presence });
  } catch (error) {
    logger.error('Failed to get file presence:', error);
    res.status(500).json({ error: 'Failed to get file presence' });
  }
});

// Get room statistics
app.get('/api/rooms/stats', (_req: Request, res: Response) => {
  try {
    const stats = getRoomStats();
    res.json({ rooms: stats });
  } catch (error) {
    logger.error('Failed to get room stats:', error);
    res.status(500).json({ error: 'Failed to get room stats' });
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
