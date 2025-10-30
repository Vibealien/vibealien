import { connect, NatsConnection, StringCodec } from 'nats';
import { config } from '../config';
import { logger } from './logger';

class EventPublisher {
  private nc: NatsConnection | null = null;
  private sc = StringCodec();

  async connect(): Promise<void> {
    try {
      this.nc = await connect({ servers: config.natsUrl });
      logger.info('Connected to NATS', { url: config.natsUrl });
      
      // Handle connection events
      (async () => {
        if (!this.nc) return;
        for await (const s of this.nc.status()) {
          logger.info('NATS status change', { status: s.type, data: s.data });
        }
      })();
    } catch (error) {
      logger.error('Failed to connect to NATS', { error });
      throw error;
    }
  }

  async publish(subject: string, data: any): Promise<void> {
    if (!this.nc) {
      logger.warn('NATS not connected, skipping publish', { subject });
      return;
    }

    try {
      const payload = JSON.stringify(data);
      this.nc.publish(subject, this.sc.encode(payload));
      logger.debug('Published event', { subject, data });
    } catch (error) {
      logger.error('Failed to publish event', { subject, error });
    }
  }

  async close(): Promise<void> {
    if (this.nc) {
      await this.nc.close();
      logger.info('NATS connection closed');
    }
  }
}

export const eventPublisher = new EventPublisher();

// Event subjects
export const EventSubjects = {
  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  PROJECT_STARRED: 'project.starred',
  PROJECT_UNSTARRED: 'project.unstarred',
  PROJECT_FORKED: 'project.forked',
  
  // File events
  FILE_CREATED: 'project.file.created',
  FILE_UPDATED: 'project.file.updated',
  FILE_DELETED: 'project.file.deleted',
  
  // Build events
  BUILD_STARTED: 'project.build.started',
  BUILD_COMPLETED: 'project.build.completed',
  BUILD_FAILED: 'project.build.failed',
};
