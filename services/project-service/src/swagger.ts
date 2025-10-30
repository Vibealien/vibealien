import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Service API',
      version: '1.0.0',
      description: 'API for managing Solana projects, files, and builds',
      contact: {
        name: 'VibeCode Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'http://localhost:8000/projects',
        description: 'API Gateway (development)',
      },
    ],
    tags: [
      {
        name: 'Projects',
        description: 'Project management endpoints',
      },
      {
        name: 'Files',
        description: 'File management endpoints',
      },
      {
        name: 'Builds',
        description: 'Build management endpoints',
      },
      {
        name: 'Stars',
        description: 'Project starring endpoints',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from auth service',
        },
      },
      schemas: {
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            ownerId: { type: 'string', format: 'uuid' },
            ownerWallet: { type: 'string' },
            programId: { type: 'string', nullable: true },
            network: { type: 'string', enum: ['devnet', 'testnet', 'mainnet-beta'] },
            visibility: { type: 'string', enum: ['PUBLIC', 'PRIVATE', 'UNLISTED'] },
            starsCount: { type: 'integer' },
            forksCount: { type: 'integer' },
            buildsCount: { type: 'integer' },
            tags: { type: 'array', items: { type: 'string' } },
            language: { type: 'string' },
            framework: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            lastBuiltAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        ProjectFile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            path: { type: 'string' },
            content: { type: 'string' },
            language: { type: 'string' },
            size: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Build: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'BUILDING', 'SUCCESS', 'FAILED', 'CANCELLED'] },
            buildNumber: { type: 'integer' },
            logs: { type: 'string', nullable: true },
            artifacts: { type: 'string', nullable: true },
            errorMsg: { type: 'string', nullable: true },
            trigger: { type: 'string' },
            duration: { type: 'integer', nullable: true },
            startedAt: { type: 'string', format: 'date-time', nullable: true },
            finishedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
