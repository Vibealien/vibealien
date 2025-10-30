import dotenv from 'dotenv';
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Config } from "./config";
import { ProxyProvider } from "./services/proxy";
import { AuthMiddleWare } from "./middleware/auth.middleware";
import { RateLimitMiddleware } from "./middleware/rateLimiter";

const app = express();
const server = http.createServer(app);
const config = new Config();
const proxy = new ProxyProvider(config);
const authMiddleWare = new AuthMiddleWare(config.authConfig, config);
const rateLimiter = new RateLimitMiddleware();

// Trust proxy - important for rate limiting by IP when behind reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Gateway info endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'VibeCode API Gateway',
    version: '1.0.0',
    status: 'running',
    services: config.serviceRoutes.map(s => ({
      name: s.serviceName,
      basePath: `/api/${s.basePath}`,
      health: s.healthRoute
    }))
  });
});

// IP-based rate limiter (applied before auth for DDoS protection)
const ipRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/communication')) {
    return rateLimiter.communicationLimiter(req, res, next);
  }
  return rateLimiter.apiLimiter(req, res, next);
};

// Apply middleware pipeline: rate limit → auth → proxy
app.use(ipRateLimiter, authMiddleWare.authMiddleware.bind(authMiddleWare), proxy.createServiceProxy());



proxy.setupWebSocketHandling(server);


const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`New Load Balancer running on port ${PORT}`);
  console.log('Rate limiting enabled with Redis');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await rateLimiter.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
