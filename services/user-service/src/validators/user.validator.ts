import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Solana wallet address validation
const solanaAddressSchema = z.string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana wallet address');

// Username validation
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must not exceed 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Create User DTO
export const createUserSchema = z.object({
  walletAddress: solanaAddressSchema,
  username: usernameSchema.optional(),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional()
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// Update User DTO
export const updateUserSchema = z.object({
  username: usernameSchema.optional(),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional()
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

// Search Users Query
export const searchUsersSchema = z.object({
  search: z.string().min(1).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional()
});

export type SearchUsersQuery = z.infer<typeof searchUsersSchema>;

// Get User Followers/Following Query
export const getUserListSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional()
});

export type GetUserListQuery = z.infer<typeof getUserListSchema>;

/**
 * Middleware factory for validating request body
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware factory for validating query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
        return;
      }
      next(error);
    }
  };
};
