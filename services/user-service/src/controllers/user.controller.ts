import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../validators/user.validator';
import { logger } from '../utils/logger';

const userService = new UserService();

export class UserController {
  /**
   * Create user
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as CreateUserDto;
      
      logger.info('Creating user', { walletAddress: dto.walletAddress });
      
      const user = await userService.createUser(dto);
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user (from JWT)
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated'
          }
        });
        return;
      }
      
      const user = await userService.getUserByWallet(walletAddress);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dto = req.body as UpdateUserDto;
      const walletAddress = req.user?.walletAddress;
      
      // Get user to verify ownership
      const user = await userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }
      
      // Verify user can only update their own profile
      if (user.walletAddress !== walletAddress) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own profile'
          }
        });
        return;
      }
      
      const updatedUser = await userService.updateUser(id, dto);
      
      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users
   */
  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, limit, offset } = req.query;
      
      const result = await userService.searchUsers(
        search as string,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Follow user
   */
  async followUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const walletAddress = req.user?.walletAddress;
      
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated'
          }
        });
        return;
      }
      
      // Get follower user
      const follower = await userService.getUserByWallet(walletAddress);
      
      if (!follower) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Your user profile not found'
          }
        });
        return;
      }
      
      // Verify target user exists
      const targetUser = await userService.getUserById(id);
      
      if (!targetUser) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User to follow not found'
          }
        });
        return;
      }
      
      const follow = await userService.followUser(follower.id, id);
      
      res.json({
        success: true,
        data: { follow }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unfollow user
   */
  async unfollowUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const walletAddress = req.user?.walletAddress;
      
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated'
          }
        });
        return;
      }
      
      // Get follower user
      const follower = await userService.getUserByWallet(walletAddress);
      
      if (!follower) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Your user profile not found'
          }
        });
        return;
      }
      
      await userService.unfollowUser(follower.id, id);
      
      res.json({
        success: true,
        data: { message: 'Unfollowed successfully' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user followers
   */
  async getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      
      const result = await userService.getFollowers(
        id,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user following
   */
  async getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      
      const result = await userService.getFollowing(
        id,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
