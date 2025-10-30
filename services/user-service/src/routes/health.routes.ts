import { Router, Request, Response, IRouter } from 'express';

const router: IRouter = Router();

/**
 * @openapi
 * /health/live:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness check
 *     description: Check if the service is alive
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-10-19T12:30:00.000Z
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness check
 *     description: Check if the service is ready to accept traffic
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-10-19T12:30:00.000Z
 */
router.get('/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

export default router;
