import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { eventPublisher } from './utils/events';
import { redisClient } from './utils/redis';

const server = app.listen(config.port, async () => {
  logger.info(`Project Service started on port ${config.port}`, {
    environment: config.nodeEnv,
    port: config.port,
  });

  // Connect to NATS
  try {
    await eventPublisher.connect();
    logger.info('Connected to NATS');
  } catch (error) {
    logger.error('Failed to connect to NATS', { error });
    process.exit(1);
  }

  // Test Redis connection
  try {
    await redisClient.ping();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    process.exit(1);
  }

  logger.info('Project Service is ready to accept requests');
  logger.info(`API Documentation available at http://localhost:${config.port}/api-docs`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  server.close(async () => {
    logger.info('HTTP server closed');

    // Close NATS connection
    await eventPublisher.close();

    // Close Redis connection
    await redisClient.quit();

    logger.info('All connections closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  shutdown();
});
