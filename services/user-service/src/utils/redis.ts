import { Redis } from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

class RedisClient {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy(times: number) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        }
      });

      RedisClient.instance.on('connect', () => {
        logger.info('Redis connected');
      });

      RedisClient.instance.on('error', (error: any) => {
        logger.error('Redis error', error);
      });

      RedisClient.instance.on('close', () => {
        logger.warn('Redis connection closed');
      });
    }

    return RedisClient.instance;
  }
}

export const redis = RedisClient.getInstance();
