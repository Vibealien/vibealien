import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

interface AuthPayload {
  userId: string;
  wallet: string;
}

const connections = new Map<string, Set<WebSocket>>();

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    return {
      userId: decoded.userId,
      wallet: decoded.wallet,
    };
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
}

export function setupWebSocketServer(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `ws://localhost`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Missing token');
      return;
    }

    const auth = verifyToken(token);
    if (!auth) {
      ws.close(1008, 'Invalid token');
      return;
    }

    // Add connection to user's set
    if (!connections.has(auth.userId)) {
      connections.set(auth.userId, new Set());
    }
    connections.get(auth.userId)!.add(ws);

    logger.info(`User ${auth.userId} connected to notifications`);

    // Handle disconnect
    ws.on('close', () => {
      const userConnections = connections.get(auth.userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          connections.delete(auth.userId);
        }
      }
      logger.info(`User ${auth.userId} disconnected from notifications`);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', userId: auth.userId }));
  });

  logger.info('WebSocket server setup complete');
}

export function sendNotificationToUser(userId: string, notification: any): void {
  const userConnections = connections.get(userId);
  if (!userConnections) {
    return;
  }

  const message = JSON.stringify({
    type: 'notification',
    data: notification,
  });

  userConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function getConnectionCount(): number {
  let count = 0;
  connections.forEach((set) => {
    count += set.size;
  });
  return count;
}
