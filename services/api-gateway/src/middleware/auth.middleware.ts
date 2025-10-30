import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {AuthConfig} from "../config/types";
import {Config} from "../config";
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

export class AuthMiddleWare{
    public authConfig: AuthConfig;
  public loadbalacerConfig: Config

  public generalPublicRoutes = ["/", "health","live"];
  constructor(authConfig: AuthConfig, lbConfig: Config) {
    this.authConfig = authConfig;
    this.loadbalacerConfig = lbConfig;
  }

  private matchRoute(requestPath: string, routePattern: string, basePath: string): boolean {
    const normalizedRequestPath = requestPath.startsWith('/api') ? requestPath : `/api${requestPath}`;
    const fullPattern = `/api/${basePath}${routePattern.startsWith('/') ? routePattern : '/' + routePattern}`;
    const requestSegments = normalizedRequestPath.split('/').filter(s => s);
    const patternSegments = fullPattern.split('/').filter(s => s);
    // console.log({requestPath, normalizedRequestPath, routePattern, basePath, fullPattern, requestSegments, patternSegments});
    const doubleWildcardIndex = patternSegments.indexOf('**');
    if (doubleWildcardIndex !== -1) {
      for (let i = 0; i < doubleWildcardIndex; i++) {
        if (i >= requestSegments.length) {
          return false;
        }
        
        const patternSegment = patternSegments[i];
        const requestSegment = requestSegments[i];
        if (patternSegment.startsWith(':')) {
          continue;
        }
        if (patternSegment !== requestSegment) {
          return false;
        }
      }
      
      if (doubleWildcardIndex < patternSegments.length - 1) {
        const segmentsAfterWildcard = patternSegments.slice(doubleWildcardIndex + 1);
        const requestEndSegments = requestSegments.slice(-segmentsAfterWildcard.length);
        
        if (requestEndSegments.length < segmentsAfterWildcard.length) {
          return false;
        }
        
        for (let i = 0; i < segmentsAfterWildcard.length; i++) {
          const patternSegment = segmentsAfterWildcard[i];
          const requestSegment = requestEndSegments[i];
          
          if (patternSegment.startsWith(':') || patternSegment === '*') {
            continue;
          }
          
          if (patternSegment !== requestSegment) {
            return false;
          }
        }
      }
      
      return true;
    }
    
    const singleWildcardIndex = patternSegments.indexOf('*');
    if (singleWildcardIndex !== -1) {
      for (let i = 0; i < singleWildcardIndex; i++) {
        if (i >= requestSegments.length) {
          return false;
        }
        
        const patternSegment = patternSegments[i];
        const requestSegment = requestSegments[i];
        if (patternSegment.startsWith(':')) {
          continue;
        }
        if (patternSegment !== requestSegment) {
          return false;
        }
      }
      const segmentsAfterWildcard = patternSegments.slice(singleWildcardIndex + 1);
      if (segmentsAfterWildcard.length > 0) {
        const wildcardSegmentCount = requestSegments.length - singleWildcardIndex - segmentsAfterWildcard.length;
        
        if (wildcardSegmentCount < 1) {
          return false;
        }
        const requestEndSegments = requestSegments.slice(singleWildcardIndex + wildcardSegmentCount);
        
        for (let i = 0; i < segmentsAfterWildcard.length; i++) {
          const patternSegment = segmentsAfterWildcard[i];
          const requestSegment = requestEndSegments[i];
          
          if (patternSegment.startsWith(':') || patternSegment === '*') {
            continue;
          }
          
          if (patternSegment !== requestSegment) {
            return false;
          }
        }
      } else {
        if (requestSegments.length !== patternSegments.length) {
          return false;
        }
      }
      return true;
    }
    
    if (requestSegments.length !== patternSegments.length) {
      return false;
    }
    for (let i = 0; i < patternSegments.length; i++) {
      const patternSegment = patternSegments[i];
      const requestSegment = requestSegments[i];
      if (patternSegment.startsWith(':')) {
        continue;
      }
      if (patternSegment !== requestSegment) {
        return false;
      }
    }
    return true;
  }


  authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
     const basepath = req.path.startsWith("/api") ? req.path.split('/')[2] : req.path.split('/')[1];
        console.log({path:req.path})
        if (this.generalPublicRoutes.includes(req.path.split('/').pop() || '')) {
          return next();
        }
        const serviceRoute = this.loadbalacerConfig.serviceRoutes.find(r => r.basePath === basepath);
        const serviceExist = !!serviceRoute;
        if (!serviceExist) return res.status(502).json({success: false, message: 'Service Unavailable'})
        const routeRequiringAuth = serviceRoute?.routesRequiringAuth?.find(
          route => {
            const routeMatches = this.matchRoute(req.path, route.route, basepath);
            const methodMatches = route.methods
              ? route.methods.includes(req.method.toUpperCase().trim())
              : true;
              console.log({routeMatches,methodMatches})
            return routeMatches && methodMatches;
          }
        );

        const requiresAuth = !!routeRequiringAuth;

        if (!requiresAuth) {
          return next();
        }
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, Config.JWT_SECRET!) as any;

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

  optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, Config.JWT_SECRET!) as any;

      req.user = {
        userId: decoded.userId,
        wallet: decoded.wallet,
        username: decoded.username,
      };
    }
    next();
  } catch (error) {
    // Invalid token, but continue as anonymous
    next();
  }
}
}