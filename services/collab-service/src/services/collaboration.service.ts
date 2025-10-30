import { PrismaClient } from '@prisma/client';
import { redisClient } from '../utils/redis';
import { publishUserJoined, publishUserLeft } from '../utils/events';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface SessionData {
  id: string;
  projectId: string;
  fileId: string;
  userId: string;
  userWallet: string;
  username: string;
  joinedAt: Date;
}

export interface PresenceData {
  userId: string;
  username: string;
  userWallet: string;
  cursor?: {
    line: number;
    column: number;
  };
  lastSeen: number;
}

export class CollaborationService {
  /**
   * Create a new collaboration session
   */
  async createSession(
    projectId: string,
    fileId: string,
    userId: string,
    userWallet: string,
    username: string
  ): Promise<SessionData> {
    try {
      const session = await prisma.collaborationSession.create({
        data: {
          projectId,
          fileId,
          userId,
          userWallet,
          username,
          isActive: true,
        },
      });

      // Store in Redis for fast lookup
      await this.cacheSession(session.id, session);

      // Add to room presence
      await this.addToPresence(fileId, {
        userId,
        username,
        userWallet,
        lastSeen: Date.now(),
      });

      // Publish event
      await publishUserJoined({
        sessionId: session.id,
        projectId,
        fileId,
        userId,
        username,
        userWallet,
      });

      logger.info(`User ${userId} joined file ${fileId}`);

      return {
        id: session.id,
        projectId: session.projectId,
        fileId: session.fileId,
        userId: session.userId,
        userWallet: session.userWallet,
        username: session.username,
        joinedAt: session.joinedAt,
      };
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * End a collaboration session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const session = await prisma.collaborationSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return;
      }

      await prisma.collaborationSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      // Remove from cache
      await this.removeCachedSession(sessionId);

      // Remove from presence
      await this.removeFromPresence(session.fileId, session.userId);

      // Publish event
      await publishUserLeft({
        sessionId,
        projectId: session.projectId,
        fileId: session.fileId,
        userId: session.userId,
        username: session.username,
      });

      logger.info(`User ${session.userId} left file ${session.fileId}`);
    } catch (error) {
      logger.error('Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Get active sessions for a file
   */
  async getFileSessions(fileId: string): Promise<SessionData[]> {
    try {
      const sessions = await prisma.collaborationSession.findMany({
        where: {
          fileId,
          isActive: true,
        },
        orderBy: {
          joinedAt: 'asc',
        },
      });

      return sessions.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        fileId: s.fileId,
        userId: s.userId,
        userWallet: s.userWallet,
        username: s.username,
        joinedAt: s.joinedAt,
      }));
    } catch (error) {
      logger.error('Failed to get file sessions:', error);
      throw error;
    }
  }

  /**
   * Update cursor position
   */
  async updateCursor(
    sessionId: string,
    userId: string,
    fileId: string,
    line: number,
    column: number
  ): Promise<void> {
    try {
      await prisma.cursorPosition.upsert({
        where: {
          sessionId_userId_fileId: {
            sessionId,
            userId,
            fileId,
          },
        },
        create: {
          sessionId,
          userId,
          fileId,
          line,
          column,
        },
        update: {
          line,
          column,
        },
      });

      // Update in presence cache
      const presence = await this.getPresence(fileId, userId);
      if (presence) {
        presence.cursor = { line, column };
        presence.lastSeen = Date.now();
        await this.updatePresence(fileId, userId, presence);
      }
    } catch (error) {
      logger.error('Failed to update cursor:', error);
    }
  }

  /**
   * Get file presence (who's currently viewing/editing)
   */
  async getFilePresence(fileId: string): Promise<PresenceData[]> {
    try {
      const key = `presence:file:${fileId}`;
      const data = await redisClient.hgetall(key);

      const presence: PresenceData[] = [];
      for (const userId in data) {
        try {
          presence.push(JSON.parse(data[userId]));
        } catch {
          // Skip invalid entries
        }
      }

      // Filter out stale presence (>2 minutes)
      const now = Date.now();
      const activePresence = presence.filter((p) => now - p.lastSeen < 120000);

      return activePresence;
    } catch (error) {
      logger.error('Failed to get file presence:', error);
      return [];
    }
  }

  /**
   * Add user to presence
   */
  private async addToPresence(fileId: string, presence: PresenceData): Promise<void> {
    const key = `presence:file:${fileId}`;
    await redisClient.hset(key, presence.userId, JSON.stringify(presence));
    await redisClient.expire(key, 7200); // 2 hours
  }

  /**
   * Update presence data
   */
  private async updatePresence(fileId: string, userId: string, presence: PresenceData): Promise<void> {
    const key = `presence:file:${fileId}`;
    await redisClient.hset(key, userId, JSON.stringify(presence));
  }

  /**
   * Get single user presence
   */
  private async getPresence(fileId: string, userId: string): Promise<PresenceData | null> {
    const key = `presence:file:${fileId}`;
    const data = await redisClient.hget(key, userId);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Remove user from presence
   */
  private async removeFromPresence(fileId: string, userId: string): Promise<void> {
    const key = `presence:file:${fileId}`;
    await redisClient.hdel(key, userId);
  }

  /**
   * Cache session
   */
  private async cacheSession(sessionId: string, session: any): Promise<void> {
    const key = `session:${sessionId}`;
    await redisClient.setex(key, 7200, JSON.stringify(session)); // 2 hours
  }

  /**
   * Remove cached session
   */
  private async removeCachedSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await redisClient.del(key);
  }

  /**
   * Cleanup stale sessions
   */
  async cleanupStaleSessions(): Promise<void> {
    try {
      const staleTime = new Date(Date.now() - 300000); // 5 minutes ago

      const staleSessions = await prisma.collaborationSession.findMany({
        where: {
          isActive: true,
          joinedAt: {
            lt: staleTime,
          },
        },
      });

      for (const session of staleSessions) {
        await this.endSession(session.id);
      }

      if (staleSessions.length > 0) {
        logger.info(`Cleaned up ${staleSessions.length} stale sessions`);
      }
    } catch (error) {
      logger.error('Failed to cleanup stale sessions:', error);
    }
  }
}

export default new CollaborationService();
