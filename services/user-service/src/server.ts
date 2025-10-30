import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { eventPublisher } from './utils/events';

async function startServer() {
  try {
    // Connect to NATS
    await eventPublisher.connect();
    
    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`User service listening on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Close NATS connection
      await eventPublisher.close();
      
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
