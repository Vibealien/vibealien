import { Router, IRouter } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody, requestChallengeSchema, verifySignatureSchema, refreshTokenSchema, logoutSchema } from '../validators/auth.validator';
import { authMiddleware } from '../middleware/auth.middleware';

const router: IRouter = Router();
const controller = new AuthController();

// POST /challenge - Request authentication challenge
router.post('/challenge', validateBody(requestChallengeSchema), (req, res, next) => controller.requestChallenge(req, res, next));

// POST /verify - Verify wallet signature and authenticate
router.post('/verify', validateBody(verifySignatureSchema), (req, res, next) => controller.verifySignature(req, res, next));

// POST /refresh - Refresh access token
router.post('/refresh', validateBody(refreshTokenSchema), (req, res, next) => controller.refreshToken(req, res, next));

// POST /logout - Logout user
router.post('/logout', validateBody(logoutSchema), (req, res, next) => controller.logout(req, res, next));

// GET /me - Get current user info (requires authentication)
router.get('/me', authMiddleware, (req, res, next) => controller.me(req, res, next));

export default router;
