import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Solana wallet address validation
const solanaAddressSchema = z.string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana wallet address');

// Request Challenge DTO
export const requestChallengeSchema = z.object({
  walletAddress: solanaAddressSchema
});

export type RequestChallengeDto = z.infer<typeof requestChallengeSchema>;

// Verify Signature DTO
export const verifySignatureSchema = z.object({
  walletAddress: solanaAddressSchema,
  signature: z.string().min(1, 'Signature is required'),
  challenge: z.string().min(1, 'Challenge is required')
});

export type VerifySignatureDto = z.infer<typeof verifySignatureSchema>;

// Refresh Token DTO
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

// Logout DTO
export const logoutSchema = z.object({
  refreshToken: z.string().optional()
});

export type LogoutDto = z.infer<typeof logoutSchema>;

/**
 * Middleware factory for validating request body
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      logger.debug('Validating request body', { body: req.body });
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
