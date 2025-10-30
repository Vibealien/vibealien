import Docker from 'dockerode';
import fs from 'fs-extra';
import path from 'path';
import tar from 'tar';
import config from '../config';
import logger from './logger';

const docker = new Docker({ socketPath: config.dockerSocketPath });

export interface BuildContext {
  buildId: string;
  projectId: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export interface BuildResult {
  success: boolean;
  artifacts: string[];
  logs: string;
  error?: string;
}

/**
 * Create a tar archive from project files
 */
async function createBuildContext(buildId: string, files: BuildContext['files']): Promise<string> {
  const contextDir = path.join(config.artifactsDir, 'contexts', buildId);
  await fs.ensureDir(contextDir);

  // Write all files to context directory
  for (const file of files) {
    const filePath = path.join(contextDir, file.path);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, file.content, 'utf-8');
  }

  // Create tar archive
  const tarPath = path.join(config.artifactsDir, 'contexts', `${buildId}.tar`);
  await tar.create(
    {
      file: tarPath,
      cwd: contextDir,
    },
    ['.']
  );

  return tarPath;
}

/**
 * Execute Solana build in Docker container
 */
export async function executeBuild(context: BuildContext): Promise<BuildResult> {
  const { buildId, projectId, files } = context;
  const containerName = `vibecode-build-${buildId}`;
  let container: Docker.Container | null = null;

  try {
    logger.info(`Starting build ${buildId} for project ${projectId}`);

    // Create build context tar
    const tarPath = await createBuildContext(buildId, files);
    const tarStream = fs.createReadStream(tarPath);

    // Pull Solana image if not exists
    try {
      await docker.getImage(config.solanaImageTag).inspect();
    } catch {
      logger.info(`Pulling image ${config.solanaImageTag}`);
      await new Promise((resolve, reject) => {
        docker.pull(config.solanaImageTag, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) return reject(err);
            resolve(null);
          });
        });
      });
    }

    // Create container
    container = await docker.createContainer({
      Image: config.solanaImageTag,
      name: containerName,
      Cmd: ['/bin/bash', '-c', 'anchor build || cargo build-bpf'],
      WorkingDir: '/workspace',
      HostConfig: {
        AutoRemove: true,
        Memory: 2 * 1024 * 1024 * 1024, // 2GB
        MemorySwap: 2 * 1024 * 1024 * 1024,
      },
    });

    // Copy build context to container
    await container.putArchive(tarStream, { path: '/workspace' });

    // Start container
    await container.start();

    // Wait for container with timeout
    const waitPromise = container.wait();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Build timeout')), config.buildTimeout);
    });

    const result = await Promise.race([waitPromise, timeoutPromise]);

    // Get logs
    const logsStream = await container.logs({
      stdout: true,
      stderr: true,
      follow: false,
    });
    const logs = logsStream.toString('utf-8');

    // Check exit code
    if (result.StatusCode !== 0) {
      logger.error(`Build ${buildId} failed with exit code ${result.StatusCode}`);
      return {
        success: false,
        artifacts: [],
        logs,
        error: `Build failed with exit code ${result.StatusCode}`,
      };
    }

    // Extract artifacts
    const artifacts = await extractArtifacts(container, buildId);

    logger.info(`Build ${buildId} completed successfully`, { artifactCount: artifacts.length });

    return {
      success: true,
      artifacts,
      logs,
    };
  } catch (error) {
    logger.error(`Build ${buildId} error:`, error);
    
    // Get logs if container exists
    let logs = '';
    if (container) {
      try {
        const logsStream = await container.logs({
          stdout: true,
          stderr: true,
          follow: false,
        });
        logs = logsStream.toString('utf-8');
      } catch {
        // Ignore log retrieval errors
      }
    }

    return {
      success: false,
      artifacts: [],
      logs,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Cleanup container if not auto-removed
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {
        // Ignore removal errors (may already be removed)
      }
    }
  }
}

/**
 * Extract build artifacts from container
 */
async function extractArtifacts(
  container: Docker.Container,
  buildId: string
): Promise<string[]> {
  const artifactsDir = path.join(config.artifactsDir, 'builds', buildId);
  await fs.ensureDir(artifactsDir);

  const artifacts: string[] = [];

  try {
    // Extract compiled programs (.so files)
    const targetStream = await container.getArchive({
      path: '/workspace/target/deploy',
    });

    const extractPath = path.join(artifactsDir, 'deploy');
    await fs.ensureDir(extractPath);

    await new Promise((resolve, reject) => {
      targetStream.pipe(
        tar.extract({
          cwd: extractPath,
        })
      )
        .on('finish', resolve)
        .on('error', reject);
    });

    // Find .so files
    const files = await fs.readdir(extractPath, { recursive: true });
    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.so')) {
        artifacts.push(path.join(extractPath, file));
      }
    }

    // Extract IDL (if Anchor project)
    try {
      const idlStream = await container.getArchive({
        path: '/workspace/target/idl',
      });

      const idlPath = path.join(artifactsDir, 'idl');
      await fs.ensureDir(idlPath);

      await new Promise((resolve, reject) => {
        idlStream.pipe(
          tar.extract({
            cwd: idlPath,
          })
        )
          .on('finish', resolve)
          .on('error', reject);
      });

      const idlFiles = await fs.readdir(idlPath, { recursive: true });
      for (const file of idlFiles) {
        if (typeof file === 'string' && file.endsWith('.json')) {
          artifacts.push(path.join(idlPath, file));
        }
      }
    } catch {
      // IDL may not exist for non-Anchor projects
      logger.debug(`No IDL found for build ${buildId}`);
    }
  } catch (error) {
    logger.error(`Failed to extract artifacts for build ${buildId}:`, error);
  }

  return artifacts;
}

/**
 * Cleanup old build artifacts
 */
export async function cleanupArtifacts(buildId: string): Promise<void> {
  try {
    const buildDir = path.join(config.artifactsDir, 'builds', buildId);
    const contextDir = path.join(config.artifactsDir, 'contexts', buildId);
    const tarPath = path.join(config.artifactsDir, 'contexts', `${buildId}.tar`);

    await Promise.all([
      fs.remove(buildDir),
      fs.remove(contextDir),
      fs.remove(tarPath),
    ]);

    logger.info(`Cleaned up artifacts for build ${buildId}`);
  } catch (error) {
    logger.error(`Failed to cleanup artifacts for build ${buildId}:`, error);
  }
}

export { docker };
