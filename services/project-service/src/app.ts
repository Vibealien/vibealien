import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import projectRoutes from './routes/project.routes';
import healthRoutes from './routes/health.routes';
import docsRoutes from './routes/docs.routes';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.corsAllowedOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' })); // Large limit for file content
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(requestLogger);

// API Documentation
app.use('/api-docs', docsRoutes);

// Health checks
app.use('/projects/health', healthRoutes);
app.get('/projects/ready', (_req, res) => res.json({ status: 'ready' }));

// API routes
app.use('/projects', projectRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl,
    },
  });
});

// Error handling
app.use(errorHandler);

export { app };
