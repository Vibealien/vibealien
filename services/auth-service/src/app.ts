import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logger';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import docsRoutes from './routes/docs.routes';
import { logger } from './utils/logger';
import { swaggerSpec } from './swagger';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Swagger documentation
  app.use('/auth/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'VibeCode Auth API Docs'
  }));

  // Routes
  app.use('/auth', authRoutes);
  app.use('/auth/health', healthRoutes);
  app.use('/auth/ready', healthRoutes);
  app.use('/auth/_docs', docsRoutes);

  // 404 handler
  app.use((_req, res) => {
    console.log(_req.path)
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise });
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
