import { PrismaClient, User, Follow } from '@prisma/client';
import { redis } from '../utils/redis';
import { eventPublisher, Events } from '../utils/events';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CreateUserDto, UpdateUserDto } from '../validators/user.validator';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Create a new user
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    // Check if wallet address already exists
    const existing = await prisma.user.findUnique({
      where: { walletAddress: dto.walletAddress }
    });

    if (existing) {
      throw new Error('User with this wallet address already exists');
    }

    // Check if username is taken
    if (dto.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: dto.username }
      });

      if (existingUsername) {
        throw new Error('Username is already taken');
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: dto
    });

    // Cache user
    await this.cacheUser(user);

    // Publish event
    await eventPublisher.publish(Events.USER_CREATED, {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      timestamp: new Date().toISOString()
    });

    logger.info('User created', { userId: user.id, walletAddress: user.walletAddress });

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    // Try cache first
    const cached = await this.getCachedUser(id);
    if (cached) {
      return cached;
    }

    // Get from database
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (user) {
      await this.cacheUser(user);
    }

    return user;
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (user) {
      await this.cacheUser(user);
    }

    return user;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (user) {
      await this.cacheUser(user);
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    // Check if username is being changed and if it's taken
    if (dto.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id }
        }
      });

      if (existingUsername) {
        throw new Error('Username is already taken');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: dto
    });

    // Update cache
    await this.cacheUser(user);

    // Publish event
    await eventPublisher.publish(Events.USER_UPDATED, {
      userId: user.id,
      walletAddress: user.walletAddress,
      changes: dto,
      timestamp: new Date().toISOString()
    });

    logger.info('User updated', { userId: user.id });

    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const user = await prisma.user.delete({
      where: { id }
    });

    // Remove from cache
    await this.removeCachedUser(id);

    // Publish event
    await eventPublisher.publish(Events.USER_DELETED, {
      userId: user.id,
      walletAddress: user.walletAddress,
      timestamp: new Date().toISOString()
    });

    logger.info('User deleted', { userId: id });
  }

  /**
   * Search users
   */
  async searchUsers(search?: string, limit: number = 20, offset: number = 0) {
    const where = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' as const } },
        { displayName: { contains: search, mode: 'insensitive' as const } },
        { walletAddress: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: Math.min(limit, config.pagination.maxLimit),
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      total,
      limit,
      offset,
      hasMore: offset + users.length < total
    };
  }

  /**
   * Follow user
   */
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existing) {
      throw new Error('Already following this user');
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      }
    });

    // Update counts
    await Promise.all([
      prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } }
      }),
      prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { increment: 1 } }
      })
    ]);

    // Invalidate caches
    await Promise.all([
      this.removeCachedUser(followerId),
      this.removeCachedUser(followingId)
    ]);

    // Publish event
    await eventPublisher.publish(Events.USER_FOLLOWED, {
      followerId,
      followingId,
      timestamp: new Date().toISOString()
    });

    logger.info('User followed', { followerId, followingId });

    return follow;
  }

  /**
   * Unfollow user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    // Update counts
    await Promise.all([
      prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } }
      }),
      prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { decrement: 1 } }
      })
    ]);

    // Invalidate caches
    await Promise.all([
      this.removeCachedUser(followerId),
      this.removeCachedUser(followingId)
    ]);

    // Publish event
    await eventPublisher.publish(Events.USER_UNFOLLOWED, {
      followerId,
      followingId,
      timestamp: new Date().toISOString()
    });

    logger.info('User unfollowed', { followerId, followingId });
  }

  /**
   * Get user followers
   */
  async getFollowers(userId: string, limit: number = 20, offset: number = 0) {
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        take: Math.min(limit, config.pagination.maxLimit),
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { follower: true }
      }),
      prisma.follow.count({ where: { followingId: userId } })
    ]);

    const users = follows.map(f => f.follower);

    return {
      users,
      total,
      limit,
      offset,
      hasMore: offset + users.length < total
    };
  }

  /**
   * Get user following
   */
  async getFollowing(userId: string, limit: number = 20, offset: number = 0) {
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        take: Math.min(limit, config.pagination.maxLimit),
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { following: true }
      }),
      prisma.follow.count({ where: { followerId: userId } })
    ]);

    const users = follows.map(f => f.following);

    return {
      users,
      total,
      limit,
      offset,
      hasMore: offset + users.length < total
    };
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    return !!follow;
  }

  /**
   * Cache user in Redis
   */
  private async cacheUser(user: User): Promise<void> {
    const key = `${config.redis.prefix}user:${user.id}`;
    await redis.setex(key, 3600, JSON.stringify(user)); // 1 hour TTL
  }

  /**
   * Get cached user from Redis
   */
  private async getCachedUser(id: string): Promise<User | null> {
    const key = `${config.redis.prefix}user:${id}`;
    const cached = await redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  /**
   * Remove cached user from Redis
   */
  private async removeCachedUser(id: string): Promise<void> {
    const key = `${config.redis.prefix}user:${id}`;
    await redis.del(key);
  }
}
