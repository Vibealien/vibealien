import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const router: Router = Router();

/**
 * OpenAPI 3.0 Specification for Project Service
 */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'VibeCode Project Service API',
    version: '1.0.0',
    description: 'Project and file management service for VibeCode platform',
    contact: {
      name: 'VibeCode Team',
      email: 'dev@vibecode.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:8003',
      description: 'Development server'
    },
    {
      url: 'http://localhost:8080/api/projects',
      description: 'API Gateway'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from authentication service'
      }
    },
    schemas: {
      Project: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string'
          },
          description: {
            type: 'string',
            nullable: true
          },
          ownerId: {
            type: 'string',
            format: 'uuid'
          },
          visibility: {
            type: 'string',
            enum: ['PUBLIC', 'PRIVATE', 'UNLISTED']
          },
          network: {
            type: 'string',
            enum: ['devnet', 'testnet', 'mainnet-beta']
          },
          language: {
            type: 'string',
            enum: ['rust', 'python', 'c']
          },
          framework: {
            type: 'string',
            nullable: true
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      File: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          projectId: {
            type: 'string',
            format: 'uuid'
          },
          path: {
            type: 'string'
          },
          content: {
            type: 'string'
          },
          language: {
            type: 'string',
            nullable: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Build: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          projectId: {
            type: 'string',
            format: 'uuid'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'BUILDING', 'SUCCESS', 'FAILED']
          },
          logs: {
            type: 'string',
            nullable: true
          },
          errorMessage: {
            type: 'string',
            nullable: true
          },
          artifacts: {
            type: 'object',
            nullable: true
          },
          startedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      CreateProjectRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          description: {
            type: 'string',
            maxLength: 500
          },
          visibility: {
            type: 'string',
            enum: ['PUBLIC', 'PRIVATE', 'UNLISTED'],
            default: 'PRIVATE'
          },
          network: {
            type: 'string',
            enum: ['devnet', 'testnet', 'mainnet-beta'],
            default: 'devnet'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          language: {
            type: 'string',
            enum: ['rust', 'python', 'c'],
            default: 'rust'
          },
          framework: {
            type: 'string'
          }
        }
      },
      UpdateProjectRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          description: {
            type: 'string',
            maxLength: 500
          },
          visibility: {
            type: 'string',
            enum: ['PUBLIC', 'PRIVATE', 'UNLISTED']
          },
          network: {
            type: 'string',
            enum: ['devnet', 'testnet', 'mainnet-beta']
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      CreateFileRequest: {
        type: 'object',
        required: ['path'],
        properties: {
          path: {
            type: 'string'
          },
          content: {
            type: 'string',
            default: ''
          },
          language: {
            type: 'string'
          }
        }
      },
      UpdateFileRequest: {
        type: 'object',
        properties: {
          content: {
            type: 'string'
          },
          language: {
            type: 'string'
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object'
          }
        }
      },
      ErrorResponse: {
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
                type: 'string'
              },
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/projects': {
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        description: 'Create a new Solana project',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateProjectRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Project'
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      },
      get: {
        tags: ['Projects'],
        summary: 'Search projects',
        description: 'Search for public projects',
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' }
          },
          {
            in: 'query',
            name: 'tags',
            schema: { type: 'array', items: { type: 'string' } }
          },
          {
            in: 'query',
            name: 'language',
            schema: { type: 'string' }
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 20 }
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', default: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'Projects retrieved successfully'
          }
        }
      }
    },
    '/projects/me': {
      get: {
        tags: ['Projects'],
        summary: 'Get current user\'s projects',
        description: 'Get all projects owned by the authenticated user',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'visibility',
            schema: {
              type: 'string',
              enum: ['PUBLIC', 'PRIVATE', 'UNLISTED']
            }
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 20 }
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', default: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'Projects retrieved successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by ID',
        description: 'Retrieve a project by ID',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Project retrieved successfully'
          },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      },
      patch: {
        tags: ['Projects'],
        summary: 'Update project',
        description: 'Update a project (owner only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateProjectRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Project updated successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project',
        description: 'Delete a project (owner only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Project deleted successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/projects/{id}/files': {
      post: {
        tags: ['Files'],
        summary: 'Create file',
        description: 'Create a new file in the project',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateFileRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'File created successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      },
      get: {
        tags: ['Files'],
        summary: 'Get project files',
        description: 'Get all files in a project',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Files retrieved successfully'
          }
        }
      }
    },
    '/projects/{projectId}/files/{fileId}': {
      get: {
        tags: ['Files'],
        summary: 'Get file by ID',
        description: 'Get a specific file',
        parameters: [
          {
            in: 'path',
            name: 'projectId',
            required: true,
            schema: { type: 'string' }
          },
          {
            in: 'path',
            name: 'fileId',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'File retrieved successfully'
          },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      },
      patch: {
        tags: ['Files'],
        summary: 'Update file',
        description: 'Update file content',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'projectId',
            required: true,
            schema: { type: 'string' }
          },
          {
            in: 'path',
            name: 'fileId',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateFileRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'File updated successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      },
      delete: {
        tags: ['Files'],
        summary: 'Delete file',
        description: 'Delete a file from the project',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'projectId',
            required: true,
            schema: { type: 'string' }
          },
          {
            in: 'path',
            name: 'fileId',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'File deleted successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/projects/{id}/builds': {
      post: {
        tags: ['Builds'],
        summary: 'Trigger build',
        description: 'Start a new build for the project',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  buildType: {
                    type: 'string',
                    enum: ['debug', 'release'],
                    default: 'debug'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Build started successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      },
      get: {
        tags: ['Builds'],
        summary: 'Get project builds',
        description: 'Get all builds for a project',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          },
          {
            in: 'query',
            name: 'status',
            schema: {
              type: 'string',
              enum: ['PENDING', 'BUILDING', 'SUCCESS', 'FAILED']
            }
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 20 }
          }
        ],
        responses: {
          '200': {
            description: 'Builds retrieved successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/projects/{projectId}/builds/{buildId}': {
      get: {
        tags: ['Builds'],
        summary: 'Get build by ID',
        description: 'Get a specific build',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'projectId',
            required: true,
            schema: { type: 'string' }
          },
          {
            in: 'path',
            name: 'buildId',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Build retrieved successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/projects/{id}/fork': {
      post: {
        tags: ['Projects'],
        summary: 'Fork project',
        description: 'Create a copy of a project',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '201': {
            description: 'Project forked successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/projects/{id}/star': {
      post: {
        tags: ['Projects'],
        summary: 'Star project',
        description: 'Star a project',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Project starred successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      },
      delete: {
        tags: ['Projects'],
        summary: 'Unstar project',
        description: 'Remove star from a project',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Project unstarred successfully'
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    }
  },
  responses: {
    BadRequest: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ErrorResponse'
          }
        }
      }
    },
    Unauthorized: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ErrorResponse'
          }
        }
      }
    },
    Forbidden: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ErrorResponse'
          }
        }
      }
    },
    NotFound: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ErrorResponse'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Projects',
      description: 'Project management endpoints'
    },
    {
      name: 'Files',
      description: 'File management endpoints'
    },
    {
      name: 'Builds',
      description: 'Build management endpoints'
    }
  ]
};

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Project Service API Documentation'
}));

export default router;
