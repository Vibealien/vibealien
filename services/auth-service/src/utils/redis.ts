import { Redis } from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

// Create Redis client singleton
class RedisClient {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      // Event handlers
      RedisClient.instance.on('connect', () => {
        logger.info('Redis client connected');
      });

      RedisClient.instance.on('ready', () => {
        logger.info('Redis client ready');
      });

      RedisClient.instance.on('error', (error) => {
        logger.error('Redis client error', error);
      });

      RedisClient.instance.on('close', () => {
        logger.warn('Redis connection closed');
      });

      RedisClient.instance.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });
    }

    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      logger.info('Redis client disconnected');
    }
  }
}

export const redis = RedisClient.getInstance();

/**
 * Graceful shutdown helper
 */
export const shutdownRedis = async () => {
  await RedisClient.disconnect();
};
