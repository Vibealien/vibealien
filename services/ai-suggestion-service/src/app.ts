import express, { Request, Response, Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth.middleware';
import aiService from './services/ai.service';
import config from './config';
import logger from './utils/logger';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoints
app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'ai-suggestion-service' });
});

app.get('/health/ready', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ready', service: 'ai-suggestion-service' });
});

// Code completion
app.post('/api/suggestions/complete', authMiddleware, limiter, async (req: Request, res: Response) => {
  try {
    const { code, language, cursorPosition, context } = req.body;

    if (!code || !language || !cursorPosition) {
      res.status(400).json({ error: 'Missing required fields: code, language, cursorPosition' });
      return;
    }

    const suggestions = await aiService.getCompletion(
      { code, language, cursorPosition, context },
      req.user!.userId
    );

    res.json({ suggestions });
  } catch (error) {
    logger.error('Failed to get completion:', error);
    res.status(500).json({ error: 'Failed to get completion' });
  }
});

// Code analysis
app.post('/api/suggestions/analyze', authMiddleware, limiter, async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      res.status(400).json({ error: 'Missing required fields: code, language' });
      return;
    }

    const analysis = await aiService.analyzeCode(
      { code, language },
      req.user!.userId
    );

    res.json(analysis);
  } catch (error) {
    logger.error('Failed to analyze code:', error);
    res.status(500).json({ error: 'Failed to analyze code' });
  }
});

// Optimization suggestions
app.post('/api/suggestions/optimize', authMiddleware, limiter, async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      res.status(400).json({ error: 'Missing required fields: code, language' });
      return;
    }

    const optimizations = await aiService.getOptimizations(
      { code, language },
      req.user!.userId
    );

    res.json(optimizations);
  } catch (error) {
    logger.error('Failed to get optimizations:', error);
    res.status(500).json({ error: 'Failed to get optimizations' });
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
