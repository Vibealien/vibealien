import http from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectNats, subscribeToAllEvents } from './utils/events';
import { setupWebSocketServer } from './services/websocket.service';
import notificationService from './services/notification.service';
import { JsMsg } from 'nats';

async function startServer() {
  try {
    // Connect to NATS
    await connectNats();
    logger.info('Connected to NATS');

    // Subscribe to all events
    await subscribeToAllEvents(async (msg: JsMsg) => {
      try {
        const data = JSON.parse(msg.data.toString());
        await notificationService.processEvent(msg.subject, data);
      } catch (error) {
        logger.error('Error processing event:', error);
        throw error;
      }
    });

    logger.info('Subscribed to all events');

    // Create HTTP server
    const server = http.createServer(app);

    // Create WebSocket server
    const wss = new WebSocketServer({ 
      server,
      path: '/ws',
    });

    // Setup WebSocket handlers
    setupWebSocketServer(wss);

    // Start server
    server.listen(config.port, () => {
      logger.info(`Notification service listening on port ${config.port}`);
      logger.info(`WebSocket server available at ws://localhost:${config.port}/ws`);
      logger.info(`Environment: ${config.nodeEnv}`);
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
