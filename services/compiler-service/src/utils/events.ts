import { connect, NatsConnection, JsMsg } from 'nats';
import config from '../config';
import logger from './logger';

export enum BuildEventSubject {
  BUILD_STARTED = 'project.build.started',
  BUILD_COMPLETED = 'project.build.completed',
  BUILD_FAILED = 'project.build.failed',
}

export interface BuildStartedPayload {
  buildId: string;
  projectId: string;
  ownerId: string;
  buildNumber: number;
  triggeredBy: 'MANUAL' | 'WEBHOOK';
}

export interface BuildCompletedPayload {
  buildId: string;
  projectId: string;
  buildNumber: number;
  artifacts: string[];
  logs: string;
}

export interface BuildFailedPayload {
  buildId: string;
  projectId: string;
  buildNumber: number;
  error: string;
  logs: string;
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

export async function publishBuildCompleted(payload: BuildCompletedPayload): Promise<void> {
  if (!natsConnection) {
    throw new Error('NATS connection not established');
  }

  try {
    await natsConnection.publish(
      BuildEventSubject.BUILD_COMPLETED,
      JSON.stringify(payload)
    );
    logger.info(`Published ${BuildEventSubject.BUILD_COMPLETED}`, { buildId: payload.buildId });
  } catch (error) {
    logger.error('Failed to publish build completed event:', error);
    throw error;
  }
}

export async function publishBuildFailed(payload: BuildFailedPayload): Promise<void> {
  if (!natsConnection) {
    throw new Error('NATS connection not established');
  }

  try {
    await natsConnection.publish(
      BuildEventSubject.BUILD_FAILED,
      JSON.stringify(payload)
    );
    logger.info(`Published ${BuildEventSubject.BUILD_FAILED}`, { buildId: payload.buildId });
  } catch (error) {
    logger.error('Failed to publish build failed event:', error);
    throw error;
  }
}

export async function subscribeToBuildStarted(
  handler: (msg: JsMsg) => Promise<void>
): Promise<void> {
  if (!natsConnection) {
    throw new Error('NATS connection not established');
  }

  try {
    const jsm = await natsConnection.jetstreamManager();
    
    // Ensure stream exists
    try {
      await jsm.streams.info('BUILDS');
    } catch {
      await jsm.streams.add({
        name: 'BUILDS',
        subjects: ['project.build.*'],
      });
    }

    const js = natsConnection.jetstream();
    
    // Create or update consumer
    const consumer = await js.consumers.get('BUILDS', 'compiler-service');
    
    const messages = await consumer.consume({
      max_messages: 100,
    });

    logger.info('Subscribed to build.started events');

    // Process messages
    (async () => {
      for await (const msg of messages) {
        if (msg.subject === BuildEventSubject.BUILD_STARTED) {
          try {
            await handler(msg);
            msg.ack();
          } catch (error) {
            logger.error('Error processing build started event:', error);
            msg.nak();
          }
        } else {
          msg.ack(); // Ack other events
        }
      }
    })();
  } catch (error) {
    logger.error('Failed to subscribe to build started events:', error);
    throw error;
  }
}

export function getNatsConnection(): NatsConnection | null {
  return natsConnection;
}
