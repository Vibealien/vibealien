import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from '../config';
import { VerifySignatureDto } from '../validators/auth.validator';
import { generateId } from '@vibecode/utils';
import { logger } from '../utils/logger';

// Initialize Prisma Client with proper error handling
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'minimal',
});

// Initialize Redis
const redis = new Redis(config.redis.url);

// Test database connection on startup
prisma.$connect()
  .then(() => logger.info('Database connected successfully'))
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

export class AuthService {
  /**
   * Generate a random challenge for wallet signature
   */
  async requestChallenge(walletAddress: string) {
    // Validate wallet address format
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      throw new Error('Invalid Solana wallet address');
    }

    // Generate random challenge
    const challenge = this.generateChallenge();
    const expiresAt = new Date(Date.now() + config.challenge.expiryMinutes * 60 * 1000);

    // Store challenge in database
    await prisma.challenge.create({
      data: {
        walletAddress,
        challenge,
        expiresAt
      }
    });

    logger.info('Challenge generated', { walletAddress, expiresAt });

    return {
      challenge,
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Verify Solana wallet signature and issue JWT tokens
   */
  async verifySignature(dto: VerifySignatureDto) {
    const { walletAddress, signature, challenge } = dto;

    // Find challenge in database
    const challengeRecord = await prisma.challenge.findFirst({
      where: {
        walletAddress,
        challenge,
        used: false,
        expiresAt: {
          gte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!challengeRecord) {
      throw new Error('Invalid or expired challenge');
    }

    // Verify signature
    const isValid = this.verifySolanaSignature(
      challenge,
      signature,
      walletAddress
    );

    if (!isValid) {
      logger.warn('Invalid signature', { walletAddress });
      throw new Error('Invalid signature');
    }

    // Mark challenge as used
    await prisma.challenge.update({
      where: { id: challengeRecord.id },
      data: { used: true }
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          walletAddress,
          username: null
        }
      });
      logger.info('New user created', { userId: user.id, walletAddress });
    }

    // Generate JWT tokens with userId
    const tokens = await this.generateTokens(walletAddress, user.id);

    logger.info('User authenticated', { userId: user.id, walletAddress });

    return {
      user: {
        id: user.id,
        wallet: user.walletAddress,
        username: user.username,
        createdAt: user.createdAt.toISOString()
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Verify Solana Ed25519 signature
   */
  private verifySolanaSignature(
    message: string,
    signature: string,
    walletAddress: string
  ): boolean {
    try {
      // Convert wallet address to public key
      const publicKey = new PublicKey(walletAddress);
      
      // Encode message as bytes
      const messageBytes = new TextEncoder().encode(message);
      
      // Decode base58 signature
      const signatureBytes = bs58.decode(signature);
      
      // Verify signature using tweetnacl
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      return isValid;
    } catch (error) {
      logger.error('Signature verification error', error);
      return false;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(walletAddress: string, userId: string) {
    const jti = generateId();
    const refreshJti = generateId();

    // Access token
    const accessToken = jwt.sign(
      {
        userId,
        walletAddress,
        jti
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.accessTokenExpiry
      } as jwt.SignOptions
    );

    // Refresh token
    const refreshToken = jwt.sign(
      {
        userId,
        walletAddress,
        jti: refreshJti,
        type: 'refresh'
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.refreshTokenExpiry
      } as jwt.SignOptions
    );

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.refreshToken.create({
      data: {
        walletAddress,
        token: refreshToken,
        jti: refreshJti,
        expiresAt
      }
    });

    // Store session in Redis
    await redis.setex(
      `${config.redis.prefix}session:${jti}`,
      15 * 60, // 15 minutes
      JSON.stringify({ walletAddress })
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists and is not revoked
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });

      if (!tokenRecord || tokenRecord.revoked) {
        throw new Error('Refresh token revoked or not found');
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new Error('Refresh token expired');
      }

      // Generate new access token
      const jti = generateId();
      const accessToken = jwt.sign(
        {
          userId: decoded.userId,
          walletAddress: decoded.walletAddress,
          jti
        },
        config.jwt.secret,
        {
          expiresIn: config.jwt.accessTokenExpiry
        } as jwt.SignOptions
      );

      // Store new session in Redis
      await redis.setex(
        `${config.redis.prefix}session:${jti}`,
        15 * 60,
        JSON.stringify({ walletAddress: decoded.walletAddress })
      );

      logger.info('Token refreshed', { walletAddress: decoded.walletAddress });

      return {
        accessToken,
        expiresIn: 900
      };
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user by revoking tokens
   */
  async logout(jti?: string, refreshToken?: string) {
    // Revoke access token session
    if (jti) {
      await redis.del(`${config.redis.prefix}session:${jti}`);
      
      // Add to blacklist
      await redis.setex(
        `${config.redis.prefix}blacklist:${jti}`,
        15 * 60,
        '1'
      );
    }

    // Revoke refresh token
    if (refreshToken) {
      try {
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: {
            revoked: true,
            revokedAt: new Date()
          }
        });
      } catch (error) {
        logger.error('Failed to revoke refresh token', error);
      }
    }

    logger.info('User logged out', { jti });
  }

  /**
   * Get user information by userId
   */
  async getUserInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      wallet: user.walletAddress,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  /**
   * Generate random challenge string
   */
  private generateChallenge(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    // Single-line message for better wallet compatibility
    const challenge = `VibeCode Authentication - Timestamp: ${timestamp} - Nonce: ${random}`;
    return challenge;
  }

  /**
   * Cleanup expired challenges (run periodically)
   */
  async cleanupExpiredChallenges() {
    const result = await prisma.challenge.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true }
        ]
      }
    });

    logger.info('Cleaned up expired challenges', { count: result.count });
  }

  /**
   * Cleanup expired refresh tokens (run periodically)
   */
  async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    logger.info('Cleaned up expired refresh tokens', { count: result.count });
  }
}
