import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  
  // Redis
  redisUrl: string;
  
  // NATS
  natsUrl: string;
  
  // Docker
  dockerSocketPath: string;
  solanaImageTag: string;
  buildTimeout: number; // milliseconds
  maxConcurrentBuilds: number;
  
  // Storage
  artifactsDir: string;
  
  // Project Service
  projectServiceUrl: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '8004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  natsUrl: process.env.NATS_URL || 'nats://localhost:4222',
  
  dockerSocketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
  solanaImageTag: process.env.SOLANA_IMAGE_TAG || 'solanalabs/solana:v1.18',
  buildTimeout: parseInt(process.env.BUILD_TIMEOUT || '600000', 10), // 10 minutes
  maxConcurrentBuilds: parseInt(process.env.MAX_CONCURRENT_BUILDS || '3', 10),
  
  artifactsDir: process.env.ARTIFACTS_DIR || '/tmp/vibecode-artifacts',
  
  projectServiceUrl: process.env.PROJECT_SERVICE_URL || 'http://localhost:8003',
};

export default config;
