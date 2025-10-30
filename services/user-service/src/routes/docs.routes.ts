import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const router: Router = Router();

/**
 * OpenAPI 3.0 Specification for User Service
 */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'VibeCode User Service API',
    version: '1.0.0',
    description: 'User profile management service for VibeCode platform',
    contact: {
      name: 'VibeCode Team',
      email: 'dev@vibecode.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:8002',
      description: 'Development server'
    },
    {
      url: 'http://localhost:8080/api/users',
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
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000'
          },
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
          },
          bio: {
            type: 'string',
            nullable: true,
            example: 'Solana developer building cool stuff'
          },
          avatarUrl: {
            type: 'string',
            format: 'uri',
            nullable: true
          },
          githubUrl: {
            type: 'string',
            format: 'uri',
            nullable: true
          },
          twitterUrl: {
            type: 'string',
            format: 'uri',
            nullable: true
          },
          websiteUrl: {
            type: 'string',
            format: 'uri',
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
      CreateUserRequest: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: {
            type: 'string',
            example: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
          },
          username: {
            type: 'string',
            example: 'alice_dev'
          },
          displayName: {
            type: 'string',
            example: 'Alice'
          },
          bio: {
            type: 'string',
            example: 'Solana developer building cool stuff'
          },
          avatarUrl: {
            type: 'string',
            format: 'uri'
          },
          githubUrl: {
            type: 'string',
            format: 'uri'
          },
          twitterUrl: {
            type: 'string',
            format: 'uri'
          },
          websiteUrl: {
            type: 'string',
            format: 'uri'
          }
        }
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            example: 'alice_dev'
          },
          displayName: {
            type: 'string',
            example: 'Alice'
          },
          bio: {
            type: 'string',
            example: 'Solana developer building cool stuff'
          },
          avatarUrl: {
            type: 'string',
            format: 'uri'
          },
          githubUrl: {
            type: 'string',
            format: 'uri'
          },
          twitterUrl: {
            type: 'string',
            format: 'uri'
          },
          websiteUrl: {
            type: 'string',
            format: 'uri'
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
                type: 'string',
                example: 'VALIDATION_ERROR'
              },
              message: {
                type: 'string',
                example: 'Invalid input data'
              },
              details: {
                type: 'object'
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/users': {
      post: {
        tags: ['Users'],
        summary: 'Create user profile',
        description: 'Create a new user profile (usually called after authentication)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/User'
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'Validation error or user already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Users'],
        summary: 'Search users',
        description: 'Search users by username, display name, or wallet address',
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: {
              type: 'string'
            },
            description: 'Search query'
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              default: 20,
              maximum: 100
            },
            description: 'Maximum number of results'
          },
          {
            in: 'query',
            name: 'offset',
            schema: {
              type: 'integer',
              default: 0
            },
            description: 'Offset for pagination'
          }
        ],
        responses: {
          '200': {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            users: {
                              type: 'array',
                              items: {
                                $ref: '#/components/schemas/User'
                              }
                            },
                            total: {
                              type: 'integer'
                            },
                            limit: {
                              type: 'integer'
                            },
                            offset: {
                              type: 'integer'
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user',
        description: 'Get the profile of the authenticated user',
        security: [
          {
            BearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'User profile retrieved',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/User'
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '401': {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '404': {
            description: 'User profile not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Retrieve a user profile by ID',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'User ID'
          }
        ],
        responses: {
          '200': {
            description: 'User profile retrieved',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/User'
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user profile',
        description: 'Update your own user profile',
        security: [
          {
            BearerAuth: []
          }
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'User ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateUserRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/User'
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '401': {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '403': {
            description: 'Cannot update other user\'s profile',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}/follow': {
      post: {
        tags: ['Users'],
        summary: 'Follow user',
        description: 'Follow another user',
        security: [
          {
            BearerAuth: []
          }
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'User ID to follow'
          }
        ],
        responses: {
          '200': {
            description: 'User followed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessResponse'
                }
              }
            }
          },
          '400': {
            description: 'Already following or cannot follow yourself',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '401': {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}/unfollow': {
      post: {
        tags: ['Users'],
        summary: 'Unfollow user',
        description: 'Unfollow a user',
        security: [
          {
            BearerAuth: []
          }
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'User ID to unfollow'
          }
        ],
        responses: {
          '200': {
            description: 'User unfollowed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessResponse'
                }
              }
            }
          },
          '401': {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '404': {
            description: 'User not found or not following',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}/followers': {
      get: {
        tags: ['Users'],
        summary: 'Get user followers',
        description: 'Get list of users following this user',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'User ID'
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              default: 20
            }
          },
          {
            in: 'query',
            name: 'offset',
            schema: {
              type: 'integer',
              default: 0
            }
          }
        ],
        responses: {
          '200': {
            description: 'Followers retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            followers: {
                              type: 'array',
                              items: {
                                $ref: '#/components/schemas/User'
                              }
                            },
                            total: {
                              type: 'integer'
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}/following': {
      get: {
        tags: ['Users'],
        summary: 'Get user following',
        description: 'Get list of users this user is following',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'User ID'
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              default: 20
            }
          },
          {
            in: 'query',
            name: 'offset',
            schema: {
              type: 'integer',
              default: 0
            }
          }
        ],
        responses: {
          '200': {
            description: 'Following list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            following: {
                              type: 'array',
                              items: {
                                $ref: '#/components/schemas/User'
                              }
                            },
                            total: {
                              type: 'integer'
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Users',
      description: 'User profile management endpoints'
    }
  ]
};

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'VibeCode User API Docs'
}));

export default router;
