import {RequestHandler,Request,Response, NextFunction} from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Config } from '../config/index.js';
import {Services} from '../config/types.js';
import { Server } from 'node:http';

export class ProxyProvider {
    private config: Config;
    private proxies: Map<string, RequestHandler> = new Map();

    constructor(config: Config) {
        this.config = config;
        this.initializeProxies();
    }

    private initializeProxies(): void {
        this.config.serviceRoutes.forEach(service => {
            this.handleProxyCreation(service.serviceUrl,service);
            if(service.wsUrl){
                this.handleProxyCreation(service.wsUrl,service);
            }
        });
    }

    private handleProxyCreation(serviceUrl:string,service:Services):void{
        const proxy = createProxyMiddleware({
                target: serviceUrl,
                changeOrigin: true,
                pathRewrite: (path) => path.startsWith("/api/") ? path.replace(`/api/`, '/'): path,
                secure: false,
                preserveHeaderKeyCase: true,
                onProxyReq: (proxyReq, req) => {
                    // Handle request body
                    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
                    const bodyData = JSON.stringify(req.body);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                    }
                },
                onProxyReqWs: (_proxyReq, _req) => {
                    // Handle WebSocket request if needed
                    console.log(`Proxying WebSocket request to: ${service.serviceName}`);
                },
                onError: (err, _req, res) => {
                    console.error(`Proxy error for ${service.serviceName}:`, err.message);
                    if (!res.headersSent) {
                        (res as Response).status(502).json({ error: 'Service Unavailable' });
                    }
                },
                ws:true
            });

            this.proxies.set(service.basePath, proxy);
        }

    createServiceProxy(): RequestHandler {
        return (req: Request, res: Response, next: NextFunction): void => {
          const basePath = req.path.startsWith("/api") ? req.path.split('/')[2] : req.path.split('/')[1]; // Assuming /api/{basepath}/... or /{basepath}
            const proxy = this.proxies.get(basePath!);

            if (!proxy) {
                res.status(502).json({
                    error: 'Bad Gateway',
                    message: 'No route configured for this path'
                });
                return;
            }

            proxy(req, res, next);
        };
    }

     setupWebSocketHandling(server: Server): void {
        server.on('upgrade', (request, socket, head) => {
            // Extract the base path from the WebSocket upgrade request
            const url = new URL(request.url!, `http://${request.headers.host}`);
            const basePath = url.pathname.split('/')[2]; // Assuming /api/{basepath}/...

            const proxy = this.proxies.get(basePath!);

            if (!proxy) {
                console.error(`No WebSocket proxy found for path: ${basePath}`);
                socket.destroy();
                return;
            }

            // Cast to access the upgrade method
            const proxyMiddleware = proxy as any;
            if (proxyMiddleware.upgrade) {
                proxyMiddleware.upgrade(request, socket, head);
            } else {
                console.error('Proxy does not support WebSocket upgrades');
                socket.destroy();
            }
        });
    }
}
