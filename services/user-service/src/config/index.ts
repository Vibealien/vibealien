import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8002', 10),
  env: process.env.NODE_ENV || 'development',
  
  get isDevelopment() { return (this.env === 'development'); },
  get isProduction() { return (this.env === 'production'); },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/user_db'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: process.env.REDIS_PREFIX || 'vibecode:'
  },
  
  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4222'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
  },
  
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001']
  },
  
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  }
};
