import { PrismaClient, Project, ProjectFile, Build, Star } from '@prisma/client';
import { redisClient } from '../utils/redis';
import { eventPublisher, EventSubjects } from '../utils/events';
import { logger } from '../utils/logger';
import { config } from '../config';

const prisma = new PrismaClient();

type Visibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
type BuildStatus = 'PENDING' | 'BUILDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

interface CreateProjectDto {
  name: string;
  description?: string;
  visibility?: Visibility;
  network?: string;
  tags?: string[];
  language?: string;
  framework?: string;
}

interface UpdateProjectDto {
  name?: string;
  description?: string | null;
  visibility?: Visibility;
  network?: string;
  tags?: string[];
  programId?: string | null;
  framework?: string | null;
}

interface CreateFileDto {
  path: string;
  content: string;
  language?: string;
}

interface SearchProjectsParams {
  search?: string;
  ownerId?: string;
  visibility?: Visibility;
  tags?: string[];
  network?: string;
  limit?: number;
  offset?: number;
}

export class ProjectService {
  // ==================== PROJECT CRUD ====================
  
  async createProject(ownerId: string, ownerWallet: string, dto: CreateProjectDto): Promise<Project> {
    try {
      const project = await prisma.project.create({
        data: {
          name: dto.name,
          description: dto.description,
          ownerId,
          ownerWallet,
          visibility: dto.visibility || 'PUBLIC',
          network: dto.network || 'devnet',
          tags: dto.tags || [],
          language: dto.language || 'rust',
          framework: dto.framework,
        },
      });

      // Publish event
      await eventPublisher.publish(EventSubjects.PROJECT_CREATED, {
        projectId: project.id,
        ownerId: project.ownerId,
        name: project.name,
        visibility: project.visibility,
        timestamp: new Date().toISOString(),
      });

      logger.info('Project created', { projectId: project.id, ownerId });
      return project;
    } catch (error) {
      logger.error('Failed to create project', { error, ownerId });
      throw error;
    }
  }

  async getProjectById(projectId: string, requesterId?: string): Promise<Project | null> {
    try {
      // Try cache first
      const cached = await this.getCachedProject(projectId);
      if (cached) {
        // Check visibility
        if (cached.visibility === 'PRIVATE' && cached.ownerId !== requesterId) {
          return null;
        }
        return cached;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          _count: {
            select: {
              files: true,
              builds: true,
              stars: true,
              forks: true,
            },
          },
        },
      });

      if (!project) {
        return null;
      }

      // Check visibility
      if (project.visibility === 'PRIVATE' && project.ownerId !== requesterId) {
        return null;
      }

      // Cache the project
      await this.cacheProject(project);

      return project;
    } catch (error) {
      logger.error('Failed to get project', { error, projectId });
      throw error;
    }
  }

  async updateProject(projectId: string, ownerId: string, dto: UpdateProjectDto): Promise<Project> {
    try {
      // Verify ownership
      const existing = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!existing) {
        throw new Error('Project not found');
      }

      if (existing.ownerId !== ownerId) {
        throw new Error('Forbidden: You can only update your own projects');
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: {
          ...dto,
          updatedAt: new Date(),
        },
      });

      // Invalidate cache
      await this.removeCachedProject(projectId);

      // Publish event
      await eventPublisher.publish(EventSubjects.PROJECT_UPDATED, {
        projectId: project.id,
        ownerId: project.ownerId,
        changes: Object.keys(dto),
        timestamp: new Date().toISOString(),
      });

      logger.info('Project updated', { projectId, ownerId });
      return project;
    } catch (error) {
      logger.error('Failed to update project', { error, projectId, ownerId });
      throw error;
    }
  }

  async deleteProject(projectId: string, ownerId: string): Promise<void> {
    try {
      // Verify ownership
      const existing = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!existing) {
        throw new Error('Project not found');
      }

      if (existing.ownerId !== ownerId) {
        throw new Error('Forbidden: You can only delete your own projects');
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      // Invalidate cache
      await this.removeCachedProject(projectId);

      // Publish event
      await eventPublisher.publish(EventSubjects.PROJECT_DELETED, {
        projectId,
        ownerId,
        timestamp: new Date().toISOString(),
      });

      logger.info('Project deleted', { projectId, ownerId });
    } catch (error) {
      logger.error('Failed to delete project', { error, projectId, ownerId });
      throw error;
    }
  }

  async searchProjects(params: SearchProjectsParams): Promise<{ projects: Project[]; total: number }> {
    try {
      const {
        search,
        ownerId,
        visibility,
        tags,
        network,
        limit = config.defaultLimit,
        offset = 0,
      } = params;

      const where: any = {};

      // Visibility filter - only show public and unlisted projects unless owner
      if (!ownerId) {
        where.visibility = { in: ['PUBLIC', 'UNLISTED'] };
      } else {
        if (visibility) {
          where.visibility = visibility;
        }
        where.ownerId = ownerId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      if (network) {
        where.network = network;
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, config.maxLimit),
          skip: offset,
          include: {
            _count: {
              select: {
                stars: true,
                forks: true,
              },
            },
          },
        }),
        prisma.project.count({ where }),
      ]);

      return { projects, total };
    } catch (error) {
      logger.error('Failed to search projects', { error, params });
      throw error;
    }
  }

  // ==================== FILE MANAGEMENT ====================

  async createFile(projectId: string, ownerId: string, dto: CreateFileDto): Promise<ProjectFile> {
    try {
      // Verify ownership
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      if (project.ownerId !== ownerId) {
        throw new Error('Forbidden: You can only add files to your own projects');
      }

      // Check file count limit
      const fileCount = await prisma.projectFile.count({
        where: { projectId },
      });

      if (fileCount >= config.maxFilesPerProject) {
        throw new Error(`Maximum files per project (${config.maxFilesPerProject}) exceeded`);
      }

      // Check file size
      const size = Buffer.from(dto.content).length;
      if (size > config.maxFileSize) {
        throw new Error(`File size exceeds maximum (${config.maxFileSize} bytes)`);
      }

      const file = await prisma.projectFile.create({
        data: {
          projectId,
          path: dto.path,
          content: dto.content,
          language: dto.language || 'rust',
          size,
        },
      });

      // Publish event
      await eventPublisher.publish(EventSubjects.FILE_CREATED, {
        projectId,
        fileId: file.id,
        path: file.path,
        timestamp: new Date().toISOString(),
      });

      logger.info('File created', { projectId, fileId: file.id, path: file.path });
      return file;
    } catch (error) {
      logger.error('Failed to create file', { error, projectId, path: dto.path });
      throw error;
    }
  }

  async getFile(projectId: string, fileId: string, requesterId?: string): Promise<ProjectFile | null> {
    try {
      const file = await prisma.projectFile.findUnique({
        where: { id: fileId },
        include: { project: true },
      });

      if (!file || file.projectId !== projectId) {
        return null;
      }

      // Check project visibility
      if (file.project.visibility === 'PRIVATE' && file.project.ownerId !== requesterId) {
        return null;
      }

      return file;
    } catch (error) {
      logger.error('Failed to get file', { error, projectId, fileId });
      throw error;
    }
  }

  async getProjectFiles(projectId: string, requesterId?: string, limit = 100, offset = 0): Promise<{ files: any[]; total: number }> {
    try {
      // Check project visibility
      const project = await this.getProjectById(projectId, requesterId);
      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const [files, total] = await Promise.all([
        prisma.projectFile.findMany({
          where: { projectId },
          orderBy: { path: 'asc' },
          take: Math.min(limit, 100),
          skip: offset,
          select: {
            id: true,
            path: true,
            language: true,
            size: true,
            createdAt: true,
            updatedAt: true,
            // Don't include content in list view
          },
        }),
        prisma.projectFile.count({ where: { projectId } }),
      ]);

      return { files, total };
    } catch (error) {
      logger.error('Failed to get project files', { error, projectId });
      throw error;
    }
  }

  async updateFile(projectId: string, fileId: string, ownerId: string, content: string): Promise<ProjectFile> {
    try {
      const file = await prisma.projectFile.findUnique({
        where: { id: fileId },
        include: { project: true },
      });

      if (!file || file.projectId !== projectId) {
        throw new Error('File not found');
      }

      if (file.project.ownerId !== ownerId) {
        throw new Error('Forbidden: You can only update files in your own projects');
      }

      const size = Buffer.from(content).length;
      if (size > config.maxFileSize) {
        throw new Error(`File size exceeds maximum (${config.maxFileSize} bytes)`);
      }

      const updated = await prisma.projectFile.update({
        where: { id: fileId },
        data: {
          content,
          size,
          updatedAt: new Date(),
        },
      });

      // Publish event
      await eventPublisher.publish(EventSubjects.FILE_UPDATED, {
        projectId,
        fileId: file.id,
        path: file.path,
        timestamp: new Date().toISOString(),
      });

      logger.info('File updated', { projectId, fileId, path: file.path });
      return updated;
    } catch (error) {
      logger.error('Failed to update file', { error, projectId, fileId });
      throw error;
    }
  }

  async deleteFile(projectId: string, fileId: string, ownerId: string): Promise<void> {
    try {
      const file = await prisma.projectFile.findUnique({
        where: { id: fileId },
        include: { project: true },
      });

      if (!file || file.projectId !== projectId) {
        throw new Error('File not found');
      }

      if (file.project.ownerId !== ownerId) {
        throw new Error('Forbidden: You can only delete files in your own projects');
      }

      await prisma.projectFile.delete({
        where: { id: fileId },
      });

      // Publish event
      await eventPublisher.publish(EventSubjects.FILE_DELETED, {
        projectId,
        fileId,
        path: file.path,
        timestamp: new Date().toISOString(),
      });

      logger.info('File deleted', { projectId, fileId, path: file.path });
    } catch (error) {
      logger.error('Failed to delete file', { error, projectId, fileId });
      throw error;
    }
  }

  // ==================== BUILD MANAGEMENT ====================

  async triggerBuild(projectId: string, ownerId: string, trigger = 'manual'): Promise<Build> {
    try {
      // Verify ownership
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      if (project.ownerId !== ownerId) {
        throw new Error('Forbidden: You can only trigger builds for your own projects');
      }

      // Get next build number
      const lastBuild = await prisma.build.findFirst({
        where: { projectId },
        orderBy: { buildNumber: 'desc' },
      });

      const buildNumber = (lastBuild?.buildNumber || 0) + 1;

      const build = await prisma.build.create({
        data: {
          projectId,
          buildNumber,
          status: 'PENDING',
          trigger,
        },
      });

      // Update project builds count
      await prisma.project.update({
        where: { id: projectId },
        data: { buildsCount: { increment: 1 } },
      });

      // Publish event (compiler service will pick this up)
      await eventPublisher.publish(EventSubjects.BUILD_STARTED, {
        buildId: build.id,
        projectId,
        buildNumber,
        trigger,
        timestamp: new Date().toISOString(),
      });

      logger.info('Build triggered', { projectId, buildId: build.id, buildNumber });
      return build;
    } catch (error) {
      logger.error('Failed to trigger build', { error, projectId });
      throw error;
    }
  }

  async getBuild(projectId: string, buildId: string, requesterId?: string): Promise<Build | null> {
    try {
      const build = await prisma.build.findUnique({
        where: { id: buildId },
        include: { project: true },
      });

      if (!build || build.projectId !== projectId) {
        return null;
      }

      // Check project visibility
      if (build.project.visibility === 'PRIVATE' && build.project.ownerId !== requesterId) {
        return null;
      }

      return build;
    } catch (error) {
      logger.error('Failed to get build', { error, projectId, buildId });
      throw error;
    }
  }

  async getProjectBuilds(
    projectId: string,
    requesterId?: string,
    status?: BuildStatus,
    limit = 20,
    offset = 0
  ): Promise<{ builds: Build[]; total: number }> {
    try {
      // Check project visibility
      const project = await this.getProjectById(projectId, requesterId);
      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const where: any = { projectId };
      if (status) {
        where.status = status;
      }

      const [builds, total] = await Promise.all([
        prisma.build.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, config.maxLimit),
          skip: offset,
        }),
        prisma.build.count({ where }),
      ]);

      return { builds, total };
    } catch (error) {
      logger.error('Failed to get project builds', { error, projectId });
      throw error;
    }
  }

  // ==================== STARRING ====================

  async starProject(userId: string, projectId: string): Promise<Star> {
    try {
      // Check if already starred
      const existing = await prisma.star.findUnique({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      if (existing) {
        throw new Error('Project already starred');
      }

      // Create star and increment count in transaction
      const [star] = await prisma.$transaction([
        prisma.star.create({
          data: { userId, projectId },
        }),
        prisma.project.update({
          where: { id: projectId },
          data: { starsCount: { increment: 1 } },
        }),
      ]);

      // Invalidate cache
      await this.removeCachedProject(projectId);

      // Publish event
      await eventPublisher.publish(EventSubjects.PROJECT_STARRED, {
        projectId,
        userId,
        timestamp: new Date().toISOString(),
      });

      logger.info('Project starred', { projectId, userId });
      return star;
    } catch (error) {
      logger.error('Failed to star project', { error, projectId, userId });
      throw error;
    }
  }

  async unstarProject(userId: string, projectId: string): Promise<void> {
    try {
      const existing = await prisma.star.findUnique({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      if (!existing) {
        throw new Error('Project not starred');
      }

      // Delete star and decrement count in transaction
      await prisma.$transaction([
        prisma.star.delete({
          where: {
            userId_projectId: { userId, projectId },
          },
        }),
        prisma.project.update({
          where: { id: projectId },
          data: { starsCount: { decrement: 1 } },
        }),
      ]);

      // Invalidate cache
      await this.removeCachedProject(projectId);

      // Publish event
      await eventPublisher.publish(EventSubjects.PROJECT_UNSTARRED, {
        projectId,
        userId,
        timestamp: new Date().toISOString(),
      });

      logger.info('Project unstarred', { projectId, userId });
    } catch (error) {
      logger.error('Failed to unstar project', { error, projectId, userId });
      throw error;
    }
  }

  // ==================== FORKING ====================

  async forkProject(userId: string, userWallet: string, projectId: string): Promise<Project> {
    try {
      // Get original project
      const original = await prisma.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (!original) {
        throw new Error('Project not found');
      }

      if (original.visibility === 'PRIVATE') {
        throw new Error('Cannot fork private projects');
      }

      // Create forked project in transaction
      const forked = await prisma.$transaction(async (tx) => {
        // Create new project
        const newProject = await tx.project.create({
          data: {
            name: `${original.name} (fork)`,
            description: original.description,
            ownerId: userId,
            ownerWallet: userWallet,
            visibility: original.visibility,
            network: original.network,
            tags: original.tags,
            language: original.language,
            framework: original.framework,
          },
        });

        // Copy all files
        if (original.files.length > 0) {
          await tx.projectFile.createMany({
            data: original.files.map((file) => ({
              projectId: newProject.id,
              path: file.path,
              content: file.content,
              language: file.language,
              size: file.size,
            })),
          });
        }

        // Create fork record
        await tx.fork.create({
          data: {
            originalId: projectId,
            forkedProjectId: newProject.id,
            userId,
          },
        });

        // Increment fork count on original
        await tx.project.update({
          where: { id: projectId },
          data: { forksCount: { increment: 1 } },
        });

        return newProject;
      });

      // Publish event
      await eventPublisher.publish(EventSubjects.PROJECT_FORKED, {
        originalId: projectId,
        forkedId: forked.id,
        userId,
        timestamp: new Date().toISOString(),
      });

      logger.info('Project forked', { originalId: projectId, forkedId: forked.id, userId });
      return forked;
    } catch (error) {
      logger.error('Failed to fork project', { error, projectId, userId });
      throw error;
    }
  }

  // ==================== CACHING ====================

  private async cacheProject(project: any): Promise<void> {
    try {
      const key = `project:${project.id}`;
      await redisClient.setex(key, 3600, JSON.stringify(project)); // 1 hour TTL
    } catch (error) {
      logger.warn('Failed to cache project', { error, projectId: project.id });
    }
  }

  private async getCachedProject(projectId: string): Promise<any | null> {
    try {
      const key = `project:${projectId}`;
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn('Failed to get cached project', { error, projectId });
      return null;
    }
  }

  private async removeCachedProject(projectId: string): Promise<void> {
    try {
      const key = `project:${projectId}`;
      await redisClient.del(key);
    } catch (error) {
      logger.warn('Failed to remove cached project', { error, projectId });
    }
  }
}
