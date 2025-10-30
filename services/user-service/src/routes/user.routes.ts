import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  validateBody,
  validateQuery,
  createUserSchema,
  updateUserSchema,
  searchUsersSchema,
  getUserListSchema,
} from '../validators/user.validator';

const router: Router = Router();
const controller = new UserController();

// Create user profile
router.post('/', validateBody(createUserSchema), (req: Request, res: Response, next: NextFunction) => controller.createUser(req, res, next));

// Get current user (authenticated)
router.get('/me', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.getCurrentUser(req, res, next));

// Search users
router.get('/', validateQuery(searchUsersSchema), (req: Request, res: Response, next: NextFunction) => controller.searchUsers(req, res, next));

// Get user by ID
router.get('/:id', (req: Request, res: Response, next: NextFunction) => controller.getUserById(req, res, next));

// Update user profile (authenticated)
router.patch('/:id', authMiddleware, validateBody(updateUserSchema), (req: Request, res: Response, next: NextFunction) => controller.updateUser(req, res, next));

// Follow user (authenticated)
router.post('/:id/follow', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.followUser(req, res, next));

// Unfollow user (authenticated)
router.post('/:id/unfollow', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.unfollowUser(req, res, next));

// Get user followers
router.get('/:id/followers', validateQuery(getUserListSchema), (req: Request, res: Response, next: NextFunction) => controller.getFollowers(req, res, next));

// Get user following
router.get('/:id/following', validateQuery(getUserListSchema), (req: Request, res: Response, next: NextFunction) => controller.getFollowing(req, res, next));

export default router;
