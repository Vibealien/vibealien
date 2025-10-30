import { connect, NatsConnection } from 'nats';
import config from '../config';
import logger from './logger';

export enum CollabEventSubject {
  USER_JOINED = 'collab.user.joined',
  USER_LEFT = 'collab.user.left',
  FILE_LOCKED = 'collab.file.locked',
  FILE_UNLOCKED = 'collab.file.unlocked',
}

export interface UserJoinedPayload {
  sessionId: string;
  projectId: string;
  fileId: string;
  userId: string;
  username: string;
  userWallet: string;
}

export interface UserLeftPayload {
  sessionId: string;
  projectId: string;
  fileId: string;
  userId: string;
  username: string;
}

export interface FileLockPayload {
  fileId: string;
  userId: string;
  username: string;
  lockedAt: string;
}

let natsConnection: NatsConnection | null = null;

export async function connectNats(): Promise<NatsConnection> {
  if (natsConnection) {
    return natsConnection;
  }

  try {
    natsConnection = await connect({ servers: config.natsUrl });
    logger.info('NATS client connected');

    natsConnection.closed().then((err) => {
      if (err) {
        logger.error('NATS connection closed with error:', err);
      } else {
        logger.info('NATS connection closed');
      }
    });

    return natsConnection;
  } catch (error) {
    logger.error('Failed to connect to NATS:', error);
    throw error;
  }
}

export async function publishUserJoined(payload: UserJoinedPayload): Promise<void> {
  if (!natsConnection) {
    throw new Error('NATS connection not established');
  }

  try {
    await natsConnection.publish(
      CollabEventSubject.USER_JOINED,
      JSON.stringify(payload)
    );
    logger.info(`Published ${CollabEventSubject.USER_JOINED}`, { userId: payload.userId });
  } catch (error) {
    logger.error('Failed to publish user joined event:', error);
  }
}

export async function publishUserLeft(payload: UserLeftPayload): Promise<void> {
  if (!natsConnection) {
    throw new Error('NATS connection not established');
  }

  try {
    await natsConnection.publish(
      CollabEventSubject.USER_LEFT,
      JSON.stringify(payload)
    );
    logger.info(`Published ${CollabEventSubject.USER_LEFT}`, { userId: payload.userId });
  } catch (error) {
    logger.error('Failed to publish user left event:', error);
  }
}

export function getNatsConnection(): NatsConnection | null {
  return natsConnection;
}
