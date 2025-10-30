import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  
  // Database
  databaseUrl: string;
  
  // Redis
  redisUrl: string;
  
  // NATS
  natsUrl: string;
  
  // WebSocket
  wsPort: number;
}

const config: Config = {
  port: parseInt(process.env.PORT || '8006', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vibecode_notifications',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  natsUrl: process.env.NATS_URL || 'nats://localhost:4222',
  
  wsPort: parseInt(process.env.WS_PORT || '8007', 10),
};

export default config;
