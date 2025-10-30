import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';

const projectService = new ProjectService();

export class ProjectController {
  // ==================== PROJECT ENDPOINTS ====================

  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, walletAddress } = req.user!;
      const project = await projectService.createProject(userId, walletAddress, req.body);

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const requesterId = req.user?.userId;

      const project = await projectService.getProjectById(id, requesterId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: { message: 'Project not found or access denied' },
        });
        return;
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;

      const project = await projectService.updateProject(id, userId, req.body);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Project not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message.includes('Forbidden')) {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
      }
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;

      await projectService.deleteProject(id, userId);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Project not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message.includes('Forbidden')) {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
      }
      next(error);
    }
  }

  async searchProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, ownerId, visibility, tags, network, limit, offset } = req.query;

      const tagsArray = tags ? (tags as string).split(',') : undefined;

      const result = await projectService.searchProjects({
        search: search as string | undefined,
        ownerId: ownerId as string | undefined,
        visibility: visibility as any,
        tags: tagsArray,
        network: network as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: {
          projects: result.projects,
          total: result.total,
          limit: limit || 20,
          offset: offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.user!;
      const { visibility, limit, offset } = req.query;

      const result = await projectService.searchProjects({
        ownerId: userId,
        visibility: visibility as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: {
          projects: result.projects,
          total: result.total,
          limit: limit || 20,
          offset: offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== FILE ENDPOINTS ====================

  async createFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const { userId } = req.user!;

      const file = await projectService.createFile(projectId, userId, req.body);

      res.status(201).json({
        success: true,
        data: file,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Project not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message.includes('Forbidden') || error.message.includes('Maximum files')) {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message.includes('File size exceeds')) {
          res.status(413).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
      }
      next(error);
    }
  }

  async getFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId, fileId } = req.params;
      const requesterId = req.user?.userId;

      const file = await projectService.getFile(projectId, fileId, requesterId);

      if (!file) {
        res.status(404).json({
          success: false,
          error: { message: 'File not found or access denied' },
        });
        return;
      }

      res.json({
        success: true,
        data: file,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const requesterId = req.user?.userId;
      const { limit, offset } = req.query;

      const result = await projectService.getProjectFiles(
        projectId,
        requesterId,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );

      res.json({
        success: true,
        data: {
          files: result.files,
          total: result.total,
          limit: limit || 100,
          offset: offset || 0,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        res.status(403).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }
      next(error);
    }
  }

  async updateFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId, fileId } = req.params;
      const { userId } = req.user!;
      const { content } = req.body;

      const file = await projectService.updateFile(projectId, fileId, userId, content);

      res.json({
        success: true,
        data: file,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'File not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message.includes('Forbidden')) {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message.includes('File size exceeds')) {
          res.status(413).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
      }
      next(error);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId, fileId } = req.params;
      const { userId } = req.user!;

      await projectService.deleteFile(projectId, fileId, userId);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'File not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message.includes('Forbidden')) {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
      }
      next(error);
    }
  }

  // ==================== BUILD ENDPOINTS ====================

  async triggerBuild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const { userId } = req.user!;
      const { trigger } = req.body;

      const build = await projectService.triggerBuild(projectId, userId, trigger);

      res.status(201).json({
        success: true,
        data: build,
        message: 'Build triggered successfully. The compiler service will process this build.',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Project not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message.includes('Forbidden')) {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
      }
      next(error);
    }
  }

  async getBuild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId, buildId } = req.params;
      const requesterId = req.user?.userId;

      const build = await projectService.getBuild(projectId, buildId, requesterId);

      if (!build) {
        res.status(404).json({
          success: false,
          error: { message: 'Build not found or access denied' },
        });
        return;
      }

      res.json({
        success: true,
        data: build,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectBuilds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const requesterId = req.user?.userId;
      const { status, limit, offset } = req.query;

      const result = await projectService.getProjectBuilds(
        projectId,
        requesterId,
        status as any,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );

      res.json({
        success: true,
        data: {
          builds: result.builds,
          total: result.total,
          limit: limit || 20,
          offset: offset || 0,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        res.status(403).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }
      next(error);
    }
  }

  // ==================== STARRING ENDPOINTS ====================

  async starProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const { userId } = req.user!;

      const star = await projectService.starProject(userId, projectId);

      res.json({
        success: true,
        data: star,
        message: 'Project starred successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Project already starred') {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }
      next(error);
    }
  }

  async unstarProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const { userId } = req.user!;

      await projectService.unstarProject(userId, projectId);

      res.json({
        success: true,
        message: 'Project unstarred successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Project not starred') {
        res.status(404).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }
      next(error);
    }
  }

  // ==================== FORKING ENDPOINT ====================

  async forkProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const { userId, walletAddress } = req.user!;

      const forkedProject = await projectService.forkProject(userId, walletAddress, projectId);

      res.status(201).json({
        success: true,
        data: forkedProject,
        message: 'Project forked successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Project not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
        if (error.message === 'Cannot fork private projects') {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
          return;
        }
      }
      next(error);
    }
  }
}
