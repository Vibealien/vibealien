import WebSocket, { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import { encoding, decoding } from 'lib0';
import { verifyToken } from '../utils/auth';
import collaborationService from '../services/collaboration.service';
import logger from '../utils/logger';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  username: string;
  userWallet: string;
  fileId: string;
  projectId: string;
  sessionId?: string;
}

// Store Yjs documents per file
const documents = new Map<string, Y.Doc>();
const awareness = new Map<string, awarenessProtocol.Awareness>();
const rooms = new Map<string, Set<ClientConnection>>();

/**
 * Get or create Yjs document for a file
 */
function getDocument(fileId: string): Y.Doc {
  let doc = documents.get(fileId);
  if (!doc) {
    doc = new Y.Doc();
    documents.set(fileId, doc);
    
    // Setup awareness
    const fileAwareness = new awarenessProtocol.Awareness(doc);
    awareness.set(fileId, fileAwareness);
    
    logger.info(`Created Yjs document for file ${fileId}`);
  }
  return doc;
}

/**
 * Get awareness for a file
 */
function getAwareness(fileId: string): awarenessProtocol.Awareness {
  let fileAwareness = awareness.get(fileId);
  if (!fileAwareness) {
    const doc = getDocument(fileId);
    fileAwareness = new awarenessProtocol.Awareness(doc);
    awareness.set(fileId, fileAwareness);
  }
  return fileAwareness;
}

/**
 * Get or create room for a file
 */
function getRoom(fileId: string): Set<ClientConnection> {
  let room = rooms.get(fileId);
  if (!room) {
    room = new Set();
    rooms.set(fileId, room);
  }
  return room;
}

/**
 * Broadcast message to all clients in a room except sender
 */
function broadcastToRoom(fileId: string, message: Uint8Array, sender?: ClientConnection): void {
  const room = getRoom(fileId);
  room.forEach((client) => {
    if (client !== sender && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

/**
 * Handle sync message
 */
function handleSyncMessage(
  client: ClientConnection,
  decoder: decoding.Decoder,
  encoder: encoding.Encoder
): void {
  const doc = getDocument(client.fileId);
  
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, doc, client);
  
  if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
    // Send sync step 2
    const response = encoding.toUint8Array(encoder);
    client.ws.send(response);
  }
}

/**
 * Handle awareness message
 */
function handleAwarenessMessage(
  client: ClientConnection,
  decoder: decoding.Decoder
): void {
  const fileAwareness = getAwareness(client.fileId);
  awarenessProtocol.applyAwarenessUpdate(fileAwareness, decoding.readVarUint8Array(decoder), client);
  
  // Broadcast to other clients
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
  encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(fileAwareness, [fileAwareness.clientID]));
  const message = encoding.toUint8Array(encoder);
  
  broadcastToRoom(client.fileId, message, client);
}

/**
 * Handle client connection
 */
export async function handleConnection(
  ws: WebSocket,
  token: string,
  projectId: string,
  fileId: string
): Promise<void> {
  // Verify token
  const auth = verifyToken(token);
  if (!auth) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  // Create client connection
  const client: ClientConnection = {
    ws,
    userId: auth.userId,
    username: auth.username || 'Anonymous',
    userWallet: auth.wallet,
    fileId,
    projectId,
  };

  // Create session
  try {
    const session = await collaborationService.createSession(
      projectId,
      fileId,
      auth.userId,
      auth.wallet,
      client.username
    );
    client.sessionId = session.id;
  } catch (error) {
    logger.error('Failed to create session:', error);
    ws.close(1011, 'Internal error');
    return;
  }

  // Add to room
  const room = getRoom(fileId);
  room.add(client);

  // Setup document and awareness
  const doc = getDocument(fileId);
  const fileAwareness = getAwareness(fileId);

  // Send initial sync
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(encoder, doc);
  ws.send(encoding.toUint8Array(encoder));

  // Send awareness states
  const awarenessEncoder = encoding.createEncoder();
  encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
  encoding.writeVarUint8Array(
    awarenessEncoder,
    awarenessProtocol.encodeAwarenessUpdate(fileAwareness, Array.from(fileAwareness.getStates().keys()))
  );
  ws.send(encoding.toUint8Array(awarenessEncoder));

  logger.info(`Client ${auth.userId} connected to file ${fileId}`);

  // Handle messages
  ws.on('message', (data: Buffer) => {
    try {
      const message = new Uint8Array(data);
      const decoder = decoding.createDecoder(message);
      const encoder = encoding.createEncoder();
      const messageType = decoding.readVarUint(decoder);

      if (messageType === MESSAGE_SYNC) {
        handleSyncMessage(client, decoder, encoder);
        
        // Broadcast updates to other clients
        const response = encoding.toUint8Array(encoder);
        if (response.length > 1) {
          broadcastToRoom(fileId, response, client);
        }
      } else if (messageType === MESSAGE_AWARENESS) {
        handleAwarenessMessage(client, decoder);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  });

  // Handle disconnect
  ws.on('close', async () => {
    room.delete(client);
    
    // Remove from awareness
    fileAwareness.setLocalState(null);
    
    // End session
    if (client.sessionId) {
      try {
        await collaborationService.endSession(client.sessionId);
      } catch (error) {
        logger.error('Failed to end session:', error);
      }
    }

    // Cleanup empty room
    if (room.size === 0) {
      rooms.delete(fileId);
      documents.delete(fileId);
      awareness.delete(fileId);
      logger.info(`Cleaned up empty room for file ${fileId}`);
    }

    logger.info(`Client ${auth.userId} disconnected from file ${fileId}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
}

/**
 * Setup WebSocket server
 */
export function setupWebSocketServer(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `ws://localhost`);
    const token = url.searchParams.get('token');
    const projectId = url.searchParams.get('projectId');
    const fileId = url.searchParams.get('fileId');

    if (!token || !projectId || !fileId) {
      ws.close(1008, 'Missing required parameters');
      return;
    }

    handleConnection(ws, token, projectId, fileId);
  });

  // Cleanup stale sessions periodically
  setInterval(() => {
    collaborationService.cleanupStaleSessions().catch((err) => {
      logger.error('Failed to cleanup stale sessions:', err);
    });
  }, 60000); // Every minute

  logger.info('WebSocket server setup complete');
}

/**
 * Get room statistics
 */
export function getRoomStats(): { fileId: string; clients: number }[] {
  const stats: { fileId: string; clients: number }[] = [];
  rooms.forEach((room, fileId) => {
    stats.push({ fileId, clients: room.size });
  });
  return stats;
}
