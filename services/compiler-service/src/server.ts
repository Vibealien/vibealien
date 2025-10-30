import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectNats, subscribeToBuildStarted, BuildStartedPayload } from './utils/events';
import compilerService from './services/compiler.service';
import { JsMsg } from 'nats';

async function startServer() {
  try {
    // Connect to NATS
    await connectNats();
    logger.info('Connected to NATS');

    // Subscribe to build started events
    await subscribeToBuildStarted(async (msg: JsMsg) => {
      try {
        const payload: BuildStartedPayload = JSON.parse(msg.data.toString());
        await compilerService.processBuildStarted(payload);
      } catch (error) {
        logger.error('Error processing build started event:', error);
        throw error;
      }
    });

    logger.info('Subscribed to build started events');

    // Start HTTP server (for health checks and queue status)
    app.listen(config.port, () => {
      logger.info(`Compiler service listening on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Max concurrent builds: ${config.maxConcurrentBuilds}`);
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
