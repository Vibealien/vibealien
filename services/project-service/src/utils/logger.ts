import winston from 'winston';
import { config } from '../config';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }: any) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logLevel || (config.nodeEnv === 'development' ? 'debug' : 'info'),
  format: logFormat,
  defaultMeta: { service: 'project-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.nodeEnv === 'development' ? consoleFormat : logFormat
    }),
    
    // File transports for production
    ...(config.nodeEnv === 'production' ? [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      })
    ] : [])
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Create stream for Morgan HTTP logger
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};
