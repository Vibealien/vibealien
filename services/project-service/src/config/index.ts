import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '8003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vibingalien_projects',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // NATS
  natsUrl: process.env.NATS_URL || 'nats://localhost:4222',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  
  // CORS
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // File Storage
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  maxFilesPerProject: parseInt(process.env.MAX_FILES_PER_PROJECT || '100', 10),
  
  // Pagination
  defaultLimit: 20,
  maxLimit: 100,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};
