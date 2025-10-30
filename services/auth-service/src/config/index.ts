import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8001', 10),
  env: process.env.NODE_ENV || 'development',
  
  get isDevelopment() { return (this.env === 'development'); },
  get isProduction() { return (this.env === 'production'); },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: 'auth:'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  
  challenge: {
    length: 32,
    expiryMinutes: 5
  },
  
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001']
  },
  
  rateLimit: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10 // 10 requests per window
  }
};
