import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RequestChallengeDto, VerifySignatureDto } from '../validators/auth.validator';
import { logger } from '../utils/logger';

const authService = new AuthService();

export class AuthController {
  async requestChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletAddress } = req.body as RequestChallengeDto;
      
      logger.info('Challenge requested', { walletAddress });
      
      const result = await authService.requestChallenge(walletAddress);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async verifySignature(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as VerifySignatureDto;
      
      logger.info('Signature verification requested', { 
        walletAddress: dto.walletAddress 
      });
      
      const result = await authService.verifySignature(dto);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required'
          }
        });
        return;
      }
      
      logger.info('Token refresh requested');
      
      const result = await authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { refreshToken } = req.body;
      
      logger.info('Logout requested', { walletAddress: user?.walletAddress });
      
      await authService.logout(user?.jti, refreshToken);
      
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }
      
      logger.info('User info requested', { userId: user.userId });
      
      const userInfo = await authService.getUserInfo(user.userId);
      
      res.json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      next(error);
    }
  }
}
