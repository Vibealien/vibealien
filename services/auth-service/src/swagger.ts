import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VibeCode Auth Service API',
      version: '1.0.0',
      description: 'Authentication service for VibeCode platform using Solana wallet signatures',
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
        name: 'Authentication',
        description: 'Solana wallet-based authentication endpoints'
      },
      {
        name: 'Health',
        description: 'Service health check endpoints'
      }
    ],
    components: {
      schemas: {
        Challenge: {
          type: 'object',
          properties: {
            challenge: {
              type: 'string',
              description: 'Random challenge string to be signed by wallet',
              example: 'Sign this message to authenticate with VibeCode.\n\nTimestamp: 1634567890123\nNonce: abc123xyz'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Challenge expiration timestamp',
              example: '2025-10-19T12:30:00.000Z'
            }
          }
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (15min expiry)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              description: 'Refresh token (7 days expiry)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            expiresIn: {
              type: 'number',
              description: 'Access token expiry in seconds',
              example: 900
            },
            user: {
              type: 'object',
              properties: {
                walletAddress: {
                  type: 'string',
                  example: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
                },
                username: {
                  type: 'string',
                  nullable: true,
                  example: 'alice_dev'
                },
                displayName: {
                  type: 'string',
                  nullable: true,
                  example: 'Alice'
                }
              }
            }
          }
        },
        RefreshResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'New JWT access token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            expiresIn: {
              type: 'number',
              description: 'Access token expiry in seconds',
              example: 900
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Request validation failed'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        example: 'walletAddress'
                      },
                      message: {
                        type: 'string',
                        example: 'Invalid Solana wallet address'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /api/v1/auth/verify'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'] // Path to route files for JSDoc annotations
};

export const swaggerSpec = swaggerJsdoc(options);
