import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

export class RateLimitMiddleware {
    private redisClient: ReturnType<typeof createClient>;
    public wsLimiter: ReturnType<typeof rateLimit>;
    public apiLimiter: ReturnType<typeof rateLimit>;
    public communicationLimiter: ReturnType<typeof rateLimit>;

    constructor() {
        this.redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        this.redisClient.connect().catch((err) => {
            console.error('Redis connection error for rate limiting:', err);
        });

        // Create rate limiters once during initialization
        this.wsLimiter = this.createWebSocketRateLimiter();
        this.apiLimiter = this.createApiRateLimiter();
        this.communicationLimiter = this.createCommunicationRateLimiter();
    }

    // WebSocket connection rate limiter (per IP)
    private createWebSocketRateLimiter() {
        return rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 10, // 10 connections per minute per IP
            message: { success: false, message: 'Too many WebSocket connection attempts, please try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
            store: new RedisStore({
                sendCommand: (...args: string[]) => this.redisClient.sendCommand(args),
                prefix: 'rate_limit:ws:',
            }),
        });
    }

    // General API rate limiter (IP-based, runs before auth middleware)
    private createApiRateLimiter() {
        return rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 100, // 100 requests per minute per IP
            message: { success: false, message: 'Too many requests, please try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
            store: new RedisStore({
                sendCommand: (...args: string[]) => this.redisClient.sendCommand(args),
                prefix: 'rate_limit:api:',
            }),
        });
    }

    // Communication service specific rate limiter (stricter, IP-based, runs before auth)
    private createCommunicationRateLimiter() {
        return rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 30, // 30 requests per minute per IP for communication routes
            message: { success: false, message: 'Too many communication requests, please slow down.' },
            standardHeaders: true,
            legacyHeaders: false,
            store: new RedisStore({
                sendCommand: (...args: string[]) => this.redisClient.sendCommand(args),
                prefix: 'rate_limit:comm:',
            }),
        });
    }    public async close() {
        await this.redisClient.quit();
    }
}
