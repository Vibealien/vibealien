import { connect, NatsConnection, JsMsg } from 'nats';
import config from '../config';
import logger from './logger';

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

export async function subscribeToAllEvents(
  handler: (msg: JsMsg) => Promise<void>
): Promise<void> {
  if (!natsConnection) {
    throw new Error('NATS connection not established');
  }

  try {
    const jsm = await natsConnection.jetstreamManager();
    
    // Subscribe to all streams
    const streams = ['USERS', 'PROJECTS', 'BUILDS', 'COLLAB'];
    
    for (const streamName of streams) {
      try {
        await jsm.streams.info(streamName);
      } catch {
        // Stream might not exist yet, skip
        logger.warn(`Stream ${streamName} not found, skipping subscription`);
        continue;
      }

      const js = natsConnection.jetstream();
      
      try {
        const consumer = await js.consumers.get(streamName, 'notification-service');
        
        const messages = await consumer.consume({
          max_messages: 100,
        });

        logger.info(`Subscribed to ${streamName} events`);

        // Process messages
        (async () => {
          for await (const msg of messages) {
            try {
              await handler(msg);
              msg.ack();
            } catch (error) {
              logger.error(`Error processing ${streamName} event:`, error);
              msg.nak();
            }
          }
        })();
      } catch (error) {
        logger.warn(`Failed to subscribe to ${streamName}:`, error);
      }
    }
  } catch (error) {
    logger.error('Failed to subscribe to events:', error);
    throw error;
  }
}

export function getNatsConnection(): NatsConnection | null {
  return natsConnection;
}
