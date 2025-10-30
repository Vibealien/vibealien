import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VibeCode User Service API',
      version: '1.0.0',
      description: 'User profile management service for VibeCode platform',
      contact: {
        name: 'VibeCode Team',
        url: 'https://vibecode.io'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.vibecode.io',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Users',
        description: 'User profile management endpoints'
      },
      {
        name: 'Health',
        description: 'Service health check endpoints'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from auth service'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
