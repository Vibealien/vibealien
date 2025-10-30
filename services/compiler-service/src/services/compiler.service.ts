import axios from 'axios';
import { redisClient } from '../utils/redis';
import { executeBuild, cleanupArtifacts, BuildContext } from '../utils/docker';
import { publishBuildCompleted, publishBuildFailed, BuildStartedPayload } from '../utils/events';
import config from '../config';
import logger from '../utils/logger';

const ACTIVE_BUILDS_KEY = 'compiler:active-builds';
const QUEUE_KEY = 'compiler:build-queue';

export class CompilerService {
  private activeBuildCount = 0;

  /**
   * Process a build started event
   */
  async processBuildStarted(payload: BuildStartedPayload): Promise<void> {
    const { buildId, projectId, ownerId } = payload;

    logger.info(`Processing build started: ${buildId}`, { projectId, ownerId });

    // Check if we can start the build immediately
    if (this.activeBuildCount >= config.maxConcurrentBuilds) {
      logger.info(`Max concurrent builds reached, queueing build ${buildId}`);
      await this.queueBuild(payload);
      return;
    }

    await this.executeBuildTask(payload);
  }

  /**
   * Execute a build task
   */
  private async executeBuildTask(payload: BuildStartedPayload): Promise<void> {
    const { buildId, projectId } = payload;

    try {
      // Increment active builds
      this.activeBuildCount++;
      await redisClient.sadd(ACTIVE_BUILDS_KEY, buildId);

      // Update build status to BUILDING
      await this.updateBuildStatus(buildId, 'BUILDING');

      // Fetch project files from Project Service
      const files = await this.fetchProjectFiles(projectId);

      // Execute build in Docker
      const buildContext: BuildContext = {
        buildId,
        projectId,
        files,
      };

      const result = await executeBuild(buildContext);

      // Update build status based on result
      if (result.success) {
        await this.updateBuildStatus(buildId, 'SUCCESS', result.logs, result.artifacts);
        await publishBuildCompleted({
          buildId,
          projectId,
          buildNumber: payload.buildNumber,
          artifacts: result.artifacts,
          logs: result.logs,
        });
      } else {
        await this.updateBuildStatus(buildId, 'FAILED', result.logs);
        await publishBuildFailed({
          buildId,
          projectId,
          buildNumber: payload.buildNumber,
          error: result.error || 'Build failed',
          logs: result.logs,
        });
      }

      // Cleanup artifacts after some time (optional)
      setTimeout(() => {
        cleanupArtifacts(buildId).catch((err) => {
          logger.error(`Failed to cleanup artifacts for build ${buildId}:`, err);
        });
      }, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      logger.error(`Build ${buildId} failed with error:`, error);

      await this.updateBuildStatus(
        buildId,
        'FAILED',
        error instanceof Error ? error.message : 'Unknown error'
      );

      await publishBuildFailed({
        buildId,
        projectId,
        buildNumber: payload.buildNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: '',
      });
    } finally {
      // Decrement active builds
      this.activeBuildCount--;
      await redisClient.srem(ACTIVE_BUILDS_KEY, buildId);

      // Process next build in queue
      await this.processNextQueuedBuild();
    }
  }

  /**
   * Queue a build for later execution
   */
  private async queueBuild(payload: BuildStartedPayload): Promise<void> {
    await redisClient.rpush(QUEUE_KEY, JSON.stringify(payload));
    logger.info(`Queued build ${payload.buildId}`);
  }

  /**
   * Process next queued build
   */
  private async processNextQueuedBuild(): Promise<void> {
    if (this.activeBuildCount >= config.maxConcurrentBuilds) {
      return;
    }

    const queuedBuild = await redisClient.lpop(QUEUE_KEY);
    if (!queuedBuild) {
      return;
    }

    try {
      const payload: BuildStartedPayload = JSON.parse(queuedBuild);
      await this.executeBuildTask(payload);
    } catch (error) {
      logger.error('Failed to process queued build:', error);
    }
  }

  /**
   * Fetch project files from Project Service
   */
  private async fetchProjectFiles(projectId: string): Promise<Array<{ path: string; content: string }>> {
    try {
      const response = await axios.get(
        `${config.projectServiceUrl}/api/projects/${projectId}/files`,
        {
          headers: {
            // Use internal service authentication
            'X-Internal-Service': 'compiler-service',
          },
        }
      );

      const files = response.data.files;

      // Fetch content for each file
      const filesWithContent = await Promise.all(
        files.map(async (file: any) => {
          const contentResponse = await axios.get(
            `${config.projectServiceUrl}/api/projects/${projectId}/files/${file.id}`,
            {
              headers: {
                'X-Internal-Service': 'compiler-service',
              },
            }
          );

          return {
            path: file.path,
            content: contentResponse.data.content,
          };
        })
      );

      return filesWithContent;
    } catch (error) {
      logger.error(`Failed to fetch project files for ${projectId}:`, error);
      throw new Error('Failed to fetch project files');
    }
  }

  /**
   * Update build status in Project Service
   */
  private async updateBuildStatus(
    buildId: string,
    status: string,
    logs?: string,
    artifacts?: string[]
  ): Promise<void> {
    try {
      await axios.patch(
        `${config.projectServiceUrl}/api/builds/${buildId}`,
        {
          status,
          logs,
          artifacts,
          completedAt: status === 'SUCCESS' || status === 'FAILED' ? new Date().toISOString() : undefined,
        },
        {
          headers: {
            'X-Internal-Service': 'compiler-service',
          },
        }
      );

      logger.info(`Updated build ${buildId} status to ${status}`);
    } catch (error) {
      logger.error(`Failed to update build ${buildId} status:`, error);
      throw error;
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{ active: number; queued: number }> {
    const queued = await redisClient.llen(QUEUE_KEY);
    return {
      active: this.activeBuildCount,
      queued,
    };
  }
}

export default new CompilerService();
