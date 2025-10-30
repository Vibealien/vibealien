import { connect, NatsConnection, StringCodec } from 'nats';
import { config } from '../config';
import { logger } from './logger';

class EventPublisher {
  private static instance: EventPublisher;
  private connection: NatsConnection | null = null;
  private sc = StringCodec();

  private constructor() {}

  static getInstance(): EventPublisher {
    if (!EventPublisher.instance) {
      EventPublisher.instance = new EventPublisher();
    }
    return EventPublisher.instance;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await connect({
        servers: config.nats.url,
        name: 'user-service',
        reconnect: true,
        maxReconnectAttempts: -1, // Infinite reconnects
        reconnectTimeWait: 1000, // 1 second
      });

      logger.info('Connected to NATS', { url: config.nats.url });

      // Handle connection events
      (async () => {
        if (this.connection) {
          for await (const status of this.connection.status()) {
            logger.info('NATS status', { 
              type: status.type, 
              data: status.data 
            });
          }
        }
      })();
    } catch (error) {
      logger.error('Failed to connect to NATS', error);
      throw error;
    }
  }

  async publish(subject: string, data: any): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not established');
    }

    try {
      const payload = this.sc.encode(JSON.stringify(data));
      this.connection.publish(subject, payload);
      
      logger.info('Published event', { subject, data });
    } catch (error) {
      logger.error('Failed to publish event', { subject, error });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();
      this.connection = null;
      logger.info('NATS connection closed');
    }
  }
}

export const eventPublisher = EventPublisher.getInstance();

// Event subjects
export const Events = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_FOLLOWED: 'user.followed',
  USER_UNFOLLOWED: 'user.unfollowed',
  PROJECT_STARRED: 'project.starred',
  PROJECT_UNSTARRED: 'project.unstarred',
} as const;
