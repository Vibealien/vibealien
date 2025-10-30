import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
import logger from '../utils/logger';

export interface AuthUser {
  userId: string;
  wallet: string;
  username?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    req.user = {
      userId: decoded.userId,
      wallet: decoded.wallet,
      username: decoded.username,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
