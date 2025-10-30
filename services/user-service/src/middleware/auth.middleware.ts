import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';

export interface AuthUser {
  walletAddress: string;
  jti: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware to verify JWT access token
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`${config.redis.prefix}blacklist:${decoded.jti}`);
    
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked'
        }
      });
      return;
    }

    // Check if session exists in Redis
    const session = await redis.get(`${config.redis.prefix}session:${decoded.jti}`);
    
    if (!session) {
      res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired'
        }
      });
      return;
    }

    // Attach user to request
    req.user = {
      walletAddress: decoded.walletAddress,
      jti: decoded.jti
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
      return;
    }

    logger.error('Auth middleware error', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Use regular auth middleware
  return authMiddleware(req, res, next);
};
