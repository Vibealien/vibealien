import jwt from 'jsonwebtoken';
import config from '../config';
import logger from './logger';

export interface AuthPayload {
  userId: string;
  wallet: string;
  username?: string;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    return {
      userId: decoded.userId,
      wallet: decoded.wallet,
      username: decoded.username,
    };
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
}
