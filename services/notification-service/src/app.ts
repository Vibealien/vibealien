import express, { Request, Response, Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import notificationService from './services/notification.service';
import { getConnectionCount } from './services/websocket.service';
import logger from './utils/logger';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' });
});

app.get('/health/ready', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ready', service: 'notification-service' });
});

// Get user notifications
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const result = await notificationService.getUserNotifications(userId, limit, offset);
    res.json(result);
  } catch (error) {
    logger.error('Failed to get notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    await notificationService.markAsRead(id, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
app.post('/api/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Get user preferences
app.get('/api/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationService.getUserPreferences(userId);
    res.json({ preferences });
  } catch (error) {
    logger.error('Failed to get preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
app.put('/api/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    await notificationService.updatePreferences(userId, preferences);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get connection stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const connectionCount = getConnectionCount();
    res.json({ connections: connectionCount });
  } catch (error) {
    logger.error('Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
