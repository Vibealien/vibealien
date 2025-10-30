import dotenv from 'dotenv';
import { AuthConfig, Services } from './types';
dotenv.config();
export class Config {
    public PORT = process.env.PORT;
    public HEALTH_CHECK_INTERVAL = process.env.HEALTH_CHECK_INTERVAL || '30000';
    public static JWT_SECRET = process.env.JWT_SECRET;
    public serviceRoutes: Services[] = [
        {
            serviceName: 'auth',
            serviceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
            healthRoute: '/health/live',
            basePath: 'auth'
        },
        {
            serviceName: 'user',
            serviceUrl: process.env.USER_SERVICE_URL || 'http://localhost:8002',
            basePath: 'users',
            healthRoute: '/user/health/live',
            routesRequiringAuth: [
                { route: '/**', methods: ['GET', 'PUT', 'PATCH', 'DELETE'] }
            ]
        },
        {
            serviceName: 'projects',
            serviceUrl: process.env.PROJECT_SERVICE_URL || 'http://localhost:8003',
            basePath: 'projects',
            healthRoute: '/projects/health/live',
            routesRequiringAuth: [
                { route: '/**' }
            ]
        },
        {
            serviceName: 'compiler',
            serviceUrl: process.env.COMPILER_SERVICE_URL || 'http://localhost:8004',
            basePath: 'compiler',
            healthRoute: '/compiler/health/live',
            routesRequiringAuth: [
                { route: '/**' }
            ]
        },
        {
            serviceName: 'collaboration',
            serviceUrl: process.env.COLLABORATION_SERVICE_URL || 'http://localhost:8005',
            wsUrl: process.env.COLLABORATION_WS_URL || 'ws://localhost:8005',
            basePath: 'collaboration',
            healthRoute: '/collaboration/health/live',
            routesRequiringAuth: [
                { route: '/**' }
            ]
        },
        {
            serviceName: 'notification',
            serviceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8006',
            basePath: 'notifications',
            healthRoute: '/notifications/health/live',
            routesRequiringAuth: [
                { route: '/**' }
            ]
        },
        {
            serviceName: 'ai-suggestions',
            serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8007',
            basePath: 'suggestions',
            healthRoute: '/suggestions/health/live',
            routesRequiringAuth: [
                { route: '/**' }
            ]
        }
    ];

    public authConfig: AuthConfig = {
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
        validationPath: '/auth/validate',
        timeout: 5000
    }

    public redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
}
