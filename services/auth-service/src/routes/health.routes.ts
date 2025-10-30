import { Router, Request, Response, IRouter } from 'express';

const router: IRouter = Router();

// GET /live - Liveness check
router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /ready - Readiness check
router.get('/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

export default router;
