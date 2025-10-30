import { PrismaClient } from '@prisma/client';
import { sendNotificationToUser } from './websocket.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  /**
   * Create and send notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<void> {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(dto.userId);
      if (preferences && preferences.types) {
        const typePrefs = preferences.types as any;
        if (typePrefs[dto.type] === false) {
          logger.debug(`User ${dto.userId} has disabled ${dto.type} notifications`);
          return;
        }
      }

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          data: dto.data || {},
        },
      });

      // Send via WebSocket
      sendNotificationToUser(dto.userId, notification);

      logger.info(`Created notification ${notification.id} for user ${dto.userId}`);
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ notifications: any[]; total: number; unread: number }> {
    try {
      const [notifications, total, unread] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, read: false } }),
      ]);

      return { notifications, total, unread };
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      logger.info(`Marked notification ${notificationId} as read`);
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      logger.info(`Marked all notifications as read for user ${userId}`);
    } catch (error) {
      logger.error('Failed to mark all as read:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    try {
      return await prisma.notificationPreference.findUnique({
        where: { userId },
      });
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: any): Promise<void> {
    try {
      await prisma.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...preferences,
        },
        update: preferences,
      });

      logger.info(`Updated preferences for user ${userId}`);
    } catch (error) {
      logger.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Process event and create notification
   */
  async processEvent(subject: string, data: any): Promise<void> {
    try {
      // Parse event and create appropriate notification
      if (subject.includes('user.followed')) {
        await this.createNotification({
          userId: data.followedId,
          type: 'FOLLOW',
          title: 'New Follower',
          message: `${data.followerUsername} started following you`,
          data,
        });
      } else if (subject.includes('project.starred')) {
        await this.createNotification({
          userId: data.ownerId,
          type: 'STAR',
          title: 'Project Starred',
          message: `${data.username} starred your project "${data.projectName}"`,
          data,
        });
      } else if (subject.includes('project.forked')) {
        await this.createNotification({
          userId: data.originalOwnerId,
          type: 'FORK',
          title: 'Project Forked',
          message: `${data.forkerUsername} forked your project "${data.projectName}"`,
          data,
        });
      } else if (subject.includes('build.completed')) {
        await this.createNotification({
          userId: data.ownerId,
          type: 'BUILD_COMPLETED',
          title: 'Build Completed',
          message: `Build #${data.buildNumber} completed successfully`,
          data,
        });
      } else if (subject.includes('build.failed')) {
        await this.createNotification({
          userId: data.ownerId,
          type: 'BUILD_FAILED',
          title: 'Build Failed',
          message: `Build #${data.buildNumber} failed`,
          data,
        });
      } else if (subject.includes('collab.user.joined')) {
        // Notification for the project owner or other collaborators
        // Note: We don't have access to collaboration session here,
        // so we just notify based on the event data
        if (data.ownerId && data.ownerId !== data.userId) {
          await this.createNotification({
            userId: data.ownerId,
            type: 'USER_JOINED',
            title: 'User Joined',
            message: `${data.username} joined file in your project`,
            data,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process event:', error);
    }
  }
}

export default new NotificationService();
