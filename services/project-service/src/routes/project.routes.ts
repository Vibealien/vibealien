import { Router, Request, Response, NextFunction } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import {
  validateBody,
  validateQuery,
  createProjectSchema,
  updateProjectSchema,
  searchProjectsSchema,
  createFileSchema,
  updateFileSchema,
  getFilesSchema,
  triggerBuildSchema,
  getBuildsSchema,
} from '../validators/project.validator';

const router: Router = Router();
const controller = new ProjectController();

// ==================== PROJECT ROUTES ====================

// Create a new project
router.post('/', authMiddleware, validateBody(createProjectSchema), (req: Request, res: Response, next: NextFunction) => controller.createProject(req, res, next));

// Get current user's projects
router.get('/me', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.getUserProjects(req, res, next));

// Search projects
router.get('/', validateQuery(searchProjectsSchema), (req: Request, res: Response, next: NextFunction) => controller.searchProjects(req, res, next));

// Get project by ID
router.get('/:id', optionalAuth, (req: Request, res: Response, next: NextFunction) => controller.getProject(req, res, next));

// Update project
router.patch('/:id', authMiddleware, validateBody(updateProjectSchema), (req: Request, res: Response, next: NextFunction) => controller.updateProject(req, res, next));

// Delete project
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.deleteProject(req, res, next));

// ==================== FILE ROUTES ====================

// Create a file
router.post('/:id/files', authMiddleware, validateBody(createFileSchema), (req: Request, res: Response, next: NextFunction) => controller.createFile(req, res, next));

// Get project files
router.get('/:id/files', optionalAuth, validateQuery(getFilesSchema), (req: Request, res: Response, next: NextFunction) => controller.getProjectFiles(req, res, next));

// Get file by ID
router.get('/:id/files/:fileId', optionalAuth, (req: Request, res: Response, next: NextFunction) => controller.getFile(req, res, next));

// Update file content
router.patch('/:id/files/:fileId', authMiddleware, validateBody(updateFileSchema), (req: Request, res: Response, next: NextFunction) => controller.updateFile(req, res, next));

// Delete file
router.delete('/:id/files/:fileId', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.deleteFile(req, res, next));

// ==================== BUILD ROUTES ====================

// Trigger build
router.post('/:id/builds', authMiddleware, validateBody(triggerBuildSchema), (req: Request, res: Response, next: NextFunction) => controller.triggerBuild(req, res, next));

// Get project builds
router.get('/:id/builds', optionalAuth, validateQuery(getBuildsSchema), (req: Request, res: Response, next: NextFunction) => controller.getProjectBuilds(req, res, next));

// Get build by ID
router.get('/:id/builds/:buildId', optionalAuth, (req: Request, res: Response, next: NextFunction) => controller.getBuild(req, res, next));

// ==================== STARRING ROUTES ====================

// Star project
router.post('/:id/star', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.starProject(req, res, next));

// Unstar project
router.delete('/:id/star', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.unstarProject(req, res, next));

// ==================== FORKING ROUTE ====================

// Fork project
router.post('/:id/fork', authMiddleware, (req: Request, res: Response, next: NextFunction) => controller.forkProject(req, res, next));

export default router;
