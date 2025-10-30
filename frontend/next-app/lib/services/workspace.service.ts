/**
 * Workspace Management Service
 * Based on Solana Playground's workspace architecture
 */

import { fsService } from './fs.service'
import { PathUtils } from '../utils/path'

export interface WorkspaceConfig {
  allNames: string[]
  currentName?: string
}

export interface WorkspaceMetadata {
  [path: string]: {
    position?: {
      cursor: { from: number; to: number }
      topLineNumber: number
      scrollTop: number
    }
    isDirty?: boolean
    lastModified?: number
    customMetadata?: any
  }
}

class WorkspaceService {
  private static readonly WORKSPACES_CONFIG_PATH = '/.config/workspaces.json'
  private static readonly WORKSPACE_PATH = '.workspace'
  private static readonly METADATA_PATH = '.workspace/metadata.json'
  private static readonly DEFAULT_WORKSPACE_NAME = 'default'

  static readonly errors = {
    ALREADY_EXISTS: 'Workspace already exists',
    INVALID_NAME: 'Invalid workspace name',
    NOT_FOUND: 'Workspace not found',
    CURRENT_NOT_FOUND: 'Current workspace not found'
  }

  private config: WorkspaceConfig = {
    allNames: [],
    currentName: undefined
  }

  /**
   * Initialize workspace service
   */
  async init(): Promise<void> {
    this.config = await fsService.readToJSONOrDefault<WorkspaceConfig>(
      WorkspaceService.WORKSPACES_CONFIG_PATH,
      { allNames: [] }
    )

    // Create default workspace if none exist
    if (this.config.allNames.length === 0) {
      await this.create(WorkspaceService.DEFAULT_WORKSPACE_NAME)
    }

    // Set current workspace if not set
    if (!this.config.currentName && this.config.allNames.length > 0) {
      this.config.currentName = this.config.allNames[0]
      await this.saveConfig()
    }
  }

  /**
   * Get all workspace names
   */
  get allNames(): string[] {
    return this.config.allNames
  }

  /**
   * Get all workspace names (alias for compatibility)
   */
  get allWorkspaceNames(): string[] {
    return this.config.allNames
  }

  /**
   * Get current workspace name
   */
  get currentName(): string | undefined {
    return this.config.currentName
  }

  /**
   * Get current workspace name (alias for compatibility)
   */
  get currentWorkspaceName(): string | undefined {
    return this.config.currentName
  }

  /**
   * Get current workspace path
   */
  get currentWorkspacePath(): string {
    if (!this.config.currentName) {
      throw new Error(WorkspaceService.errors.CURRENT_NOT_FOUND)
    }
    return PathUtils.joinPaths('/', this.config.currentName) + '/'
  }

  /**
   * Create a new workspace
   */
  async create(name: string): Promise<void> {
    if (this.config.allNames.includes(name)) {
      throw new Error(WorkspaceService.errors.ALREADY_EXISTS)
    }

    if (!PathUtils.isItemNameValid(name)) {
      throw new Error(WorkspaceService.errors.INVALID_NAME)
    }

    // Add to config
    this.config.allNames.push(name)
    this.config.currentName = name

    // Create workspace directories
    const workspacePath = PathUtils.joinPaths('/', name) + '/'
    await fsService.createDir(workspacePath, { createParents: true })
    await fsService.createDir(
      PathUtils.joinPaths(workspacePath, WorkspaceService.WORKSPACE_PATH),
      { createParents: true }
    )

    // Initialize metadata
    await this.saveMetadata({})

    await this.saveConfig()
  }

  /**
   * Create a new workspace with files (alias for compatibility)
   */
  async createWorkspace(name: string, files?: Array<[string, string]>): Promise<void> {
    await this.create(name)
    
    if (files) {
      const workspacePath = PathUtils.joinPaths('/', name) + '/'
      for (const [path, content] of files) {
        const fullPath = PathUtils.joinPaths(workspacePath, path)
        await fsService.writeFile(fullPath, content, { createParents: true })
      }
    }
  }

  /**
   * Delete a workspace
   */
  async delete(name: string): Promise<void> {
    if (!this.config.allNames.includes(name)) {
      throw new Error(WorkspaceService.errors.NOT_FOUND)
    }

    // Remove workspace directory
    const workspacePath = PathUtils.joinPaths('/', name) + '/'
    await fsService.removeDir(workspacePath, { recursive: true })

    // Update config
    this.config.allNames = this.config.allNames.filter(n => n !== name)

    // Switch to another workspace if current was deleted
    if (this.config.currentName === name) {
      this.config.currentName = this.config.allNames[0]
    }

    await this.saveConfig()
  }

  /**
   * Delete a workspace (alias for compatibility)
   */
  async deleteWorkspace(name: string): Promise<void> {
    await this.delete(name)
  }

  /**
   * Rename current workspace
   */
  async rename(newName: string): Promise<void> {
    if (!this.config.currentName) {
      throw new Error(WorkspaceService.errors.CURRENT_NOT_FOUND)
    }

    if (this.config.allNames.includes(newName)) {
      throw new Error(WorkspaceService.errors.ALREADY_EXISTS)
    }

    if (!PathUtils.isItemNameValid(newName)) {
      throw new Error(WorkspaceService.errors.INVALID_NAME)
    }

    const oldName = this.config.currentName
    const oldPath = PathUtils.joinPaths('/', oldName) + '/'
    const newPath = PathUtils.joinPaths('/', newName) + '/'

    // Rename directory
    await fsService.rename(oldPath, newPath)

    // Update config
    this.config.allNames = this.config.allNames.map(n => 
      n === oldName ? newName : n
    )
    this.config.currentName = newName

    await this.saveConfig()
  }

  /**
   * Rename workspace (alias for compatibility)
   */
  async renameWorkspace(oldName: string, newName: string): Promise<void> {
    // First switch to the workspace if not current
    if (this.config.currentName !== oldName) {
      await this.switch(oldName)
    }
    await this.rename(newName)
  }

  /**
   * Set current workspace name
   */
  setCurrentWorkspaceName(name: string): void {
    if (this.config.allNames.includes(name)) {
      this.config.currentName = name
    }
  }

  /**
   * Switch to a workspace
   */
  async switch(name: string): Promise<void> {
    if (!this.config.allNames.includes(name)) {
      throw new Error(WorkspaceService.errors.NOT_FOUND)
    }

    this.config.currentName = name
    await this.saveConfig()
  }

  /**
   * Get workspace metadata
   */
  async getMetadata(): Promise<WorkspaceMetadata> {
    if (!this.config.currentName) {
      return {}
    }

    const metadataPath = PathUtils.joinPaths(
      this.currentWorkspacePath,
      WorkspaceService.METADATA_PATH
    )

    return await fsService.readToJSONOrDefault<WorkspaceMetadata>(
      metadataPath,
      {}
    )
  }

  /**
   * Save workspace metadata
   */
  async saveMetadata(metadata: WorkspaceMetadata): Promise<void> {
    if (!this.config.currentName) {
      return
    }

    const metadataPath = PathUtils.joinPaths(
      this.currentWorkspacePath,
      WorkspaceService.METADATA_PATH
    )

    await fsService.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      { createParents: true }
    )
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(
    filePath: string,
    metadata: WorkspaceMetadata[string]
  ): Promise<void> {
    const allMetadata = await this.getMetadata()
    allMetadata[filePath] = {
      ...allMetadata[filePath],
      ...metadata,
      lastModified: Date.now()
    }
    await this.saveMetadata(allMetadata)
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<WorkspaceMetadata[string] | undefined> {
    const metadata = await this.getMetadata()
    return metadata[filePath]
  }

  /**
   * Save workspace config
   */
  private async saveConfig(): Promise<void> {
    await fsService.writeFile(
      WorkspaceService.WORKSPACES_CONFIG_PATH,
      JSON.stringify(this.config, null, 2),
      { createParents: true }
    )
  }

  /**
   * Check if in temporary mode (no workspace)
   */
  get isTemporary(): boolean {
    return !this.config.currentName
  }
}

export const workspaceService = new WorkspaceService()
