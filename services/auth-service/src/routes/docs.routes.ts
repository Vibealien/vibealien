import { Router, Request, Response, IRouter } from 'express';

const router: IRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Challenge:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Challenge message to be signed by the wallet
 *           example: Sign this message to authenticate with VibeCode
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Challenge expiration timestamp
 *           example: "2025-10-19T12:35:00.000Z"
 *     
 *     TokenResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "clm1234567890"
 *             wallet:
 *               type: string
 *               example: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
 *             username:
 *               type: string
 *               nullable: true
 *               example: "vibealien"
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2025-10-19T12:30:00.000Z"
 *         token:
 *           type: string
 *           description: JWT access token (15 minutes expiry)
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token (7 days expiry)
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     
 *     RefreshResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: New JWT access token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           description: New JWT refresh token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: "INVALID_REQUEST"
 *             message:
 *               type: string
 *               example: "Invalid request parameters"
 *             details:
 *               type: object
 *               nullable: true
 *   
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT access token obtained from /verify endpoint
 * 
 * tags:
 *   - name: Authentication
 *     description: Wallet-based authentication endpoints
 *   - name: Health
 *     description: Service health check endpoints
 */

/**
 * @openapi
 * /api/v1/auth/challenge:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request authentication challenge
 *     description: Generate a random challenge string for wallet signature authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Solana wallet address (base58)
 *                 example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
 *     responses:
 *       200:
 *         description: Challenge generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Challenge'
 *       400:
 *         description: Invalid wallet address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /api/v1/auth/verify:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify wallet signature and authenticate
 *     description: Verify the signed challenge and issue JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - signature
 *               - challenge
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Solana wallet address
 *                 example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
 *               signature:
 *                 type: string
 *                 description: Base58-encoded signature of the challenge
 *                 example: 3yZe7d7ZJxKYQCrdLKa9uYX9Le5kKJqR...
 *               challenge:
 *                 type: string
 *                 description: Challenge string that was signed
 *                 example: Sign this message to authenticate with VibeCode
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Invalid signature or expired challenge
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token obtained from /verify
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RefreshResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Revoke access and refresh tokens
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to revoke (optional)
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Logged out successfully
 */

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

// This route file only contains OpenAPI documentation comments
// No actual routes are defined here, only Swagger/OpenAPI annotations
router.get('/_docs', (_req: Request, res: Response) => {
  res.json({
    message: 'OpenAPI documentation available at /api-docs',
    swagger: '/api-docs',
    redoc: '/api-docs/redoc'
  });
});

export default router;
