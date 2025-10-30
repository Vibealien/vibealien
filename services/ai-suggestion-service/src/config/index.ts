import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  
  // Redis
  redisUrl: string;
  
  // AI Model
  aiModelUrl: string;
  aiModelApiKey: string;
  
  // Rate Limiting
  rateLimitWindow: number; // milliseconds
  rateLimitMax: number; // requests per window
  
  // Cache
  cacheTtl: number; // milliseconds
}

const config: Config = {
  port: parseInt(process.env.PORT || '8007', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // OpenAI compatible API or local model
  aiModelUrl: process.env.AI_MODEL_URL || 'https://api.openai.com/v1',
  aiModelApiKey: process.env.AI_MODEL_API_KEY || '',
  
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '20', 10), // 20 requests per minute
  
  cacheTtl: parseInt(process.env.CACHE_TTL || '3600000', 10), // 1 hour
};

export default config;
