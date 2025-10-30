import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { generateId } from '@vibecode/utils';

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Generate correlation ID if not present
  const correlationId = (req.headers['x-correlation-id'] as string) || generateId();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    correlationId
  });

  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to log response
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    const duration = Date.now() - startTime;
    
    logger.info('Outgoing response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId
    });

    // Call original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};
