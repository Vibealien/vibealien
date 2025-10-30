import app from './app';
import config from './config';
import logger from './utils/logger';

async function startServer() {
  try {
    app.listen(config.port, () => {
      logger.info(`AI Suggestion service listening on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Rate limit: ${config.rateLimitMax} requests per ${config.rateLimitWindow}ms`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
