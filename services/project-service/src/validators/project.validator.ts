import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  network: z.enum(['devnet', 'testnet', 'mainnet-beta']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  language: z.enum(['rust', 'python', 'c']).optional(),
  framework: z.string().max(50).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  network: z.enum(['devnet', 'testnet', 'mainnet-beta']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  programId: z.string().optional().nullable(),
  framework: z.string().max(50).optional().nullable(),
});

export const searchProjectsSchema = z.object({
  search: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  tags: z.string().optional(), // Comma-separated
  network: z.enum(['devnet', 'testnet', 'mainnet-beta']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// File schemas
export const createFileSchema = z.object({
  path: z.string().min(1).max(255).regex(/^[a-zA-Z0-9_\-./]+$/),
  content: z.string(),
  language: z.enum(['rust', 'python', 'c', 'toml', 'json', 'md']).optional(),
});

export const updateFileSchema = z.object({
  content: z.string(),
});

export const getFilesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// Build schemas
export const triggerBuildSchema = z.object({
  trigger: z.enum(['manual', 'commit', 'schedule']).optional(),
});

export const getBuildsSchema = z.object({
  status: z.enum(['PENDING', 'BUILDING', 'SUCCESS', 'FAILED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// Validation middleware factory
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.errors,
          },
        });
        return;
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.errors,
          },
        });
        return;
      }
      next(error);
    }
  };
};
