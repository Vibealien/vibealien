import http from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectNats } from './utils/events';
import { setupWebSocketServer } from './services/websocket.service';

async function startServer() {
  try {
    // Connect to NATS
    await connectNats();
    logger.info('Connected to NATS');

    // Create HTTP server
    const server = http.createServer(app);

    // Create WebSocket server
    const wss = new WebSocketServer({ 
      server,
      path: '/ws',
    });

    // Setup WebSocket handlers
    setupWebSocketServer(wss);
    const PORT = 5000;
    // Start server
    server.listen(PORT, () => {
      logger.info(`Collaboration service listening on port ${PORT}`);
      logger.info(`WebSocket server available at ws://localhost:${PORT}/ws`);
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
