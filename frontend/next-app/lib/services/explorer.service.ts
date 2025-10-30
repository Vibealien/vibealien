/**
 * Explorer Service
 * Based on Solana Playground's PgExplorer
 * Manages file system state, tabs, and workspace integration
 */

import { fsService } from './fs.service'
import { workspaceService } from './workspace.service'
import { PathUtils } from '../utils/path'

/** Editor position data */
export interface Position {
  topLineNumber: number
  cursor: {
    from: number
    to: number
  }
}

/** Item metadata */
interface ItemMeta {
  position?: Position
}

/** File or directory item */
interface ItemInfo {
  content?: string
  meta?: ItemMeta
}

/** Full path -> ItemInfo */
type ExplorerFiles = Record<string, ItemInfo>

/** Full file with path */
export interface FullFile extends ItemInfo {
  path: string
}

/** Explorer state */
interface ExplorerState {
  files: ExplorerFiles
  tabs: string[]
  currentIndex: number
}

/** Metadata file structure */
type ItemMetaFile = Array<{
  path: string
  isTabs?: boolean
  isCurrent?: boolean
  position?: Position
}>

/** Folder content */
export interface FolderContent {
  files: string[]
  folders: string[]
}

type EventCallback = (...args: any[]) => void

class ExplorerService {
  private state: ExplorerState = this.getDefaultState()
  private _isInitialized = false
  private _isTemporary = false
  private initializedWorkspaceName: string | null = null
  private eventListeners: Map<string, EventCallback[]> = new Map()

  readonly events = {
    INIT: 'explorer:init',
    CREATE_ITEM: 'explorer:create:item',
    RENAME_ITEM: 'explorer:rename:item',
    DELETE_ITEM: 'explorer:delete:item',
    OPEN_FILE: 'explorer:open:file',
    CLOSE_FILE: 'explorer:close:file',
    TABS_CHANGED: 'explorer:tabs:changed',
    CREATE_WORKSPACE: 'explorer:create:workspace',
    RENAME_WORKSPACE: 'explorer:rename:workspace',
    DELETE_WORKSPACE: 'explorer:delete:workspace',
    SWITCH_WORKSPACE: 'explorer:switch:workspace'
  } as const

  readonly errors = {
    ALREADY_EXISTS: 'Already exists',
    INVALID_NAME: 'Invalid name',
    TYPE_MISMATCH: 'Types don\'t match',
    SRC_DELETE: 'Cannot delete src folder',
    SRC_RENAME: 'Cannot rename src folder'
  }

  /* -------------------------------- Getters ------------------------------- */

  get isInitialized() {
    return this._isInitialized
  }

  get isTemporary() {
    return this._isTemporary
  }

  get files() {
    return this.state.files
  }

  get tabs() {
    return this.state.tabs
  }

  get currentFilePath() {
    return this.state.tabs[this.state.currentIndex] ?? null
  }

  private get currentIndex() {
    return this.state.currentIndex
  }

  get currentWorkspacePath() {
    return workspaceService.currentWorkspacePath
  }

  get currentWorkspaceName() {
    return workspaceService.currentWorkspaceName
  }

  get allWorkspaceNames() {
    return workspaceService.allWorkspaceNames
  }

  /* ---------------------------- Public methods ---------------------------- */

  /**
   * Initialize explorer
   */
  async init(params?: { files?: ExplorerFiles; name?: string }): Promise<void> {
    if (params?.files) {
      this._isTemporary = true
      this.state = this.getDefaultState()
      this.state.files = params.files

      // Open first file
      const paths = Object.keys(params.files)
      if (paths.length > 0) {
        const firstFile = paths.find(p => !PathUtils.isDirectory(p))
        if (firstFile) this.openFile(firstFile)
      }
    } else {
      this._isTemporary = false
      await workspaceService.init()

      const workspaceName = params?.name ?? this.currentWorkspaceName
      if (workspaceName && this.allWorkspaceNames.includes(workspaceName)) {
        await this.switchWorkspace(workspaceName)
      } else if (this.allWorkspaceNames.length === 0) {
        this.state = this.getDefaultState()
      }
    }

    // Sanity check
    if (this.tabs.length && !this.currentFilePath) {
      console.log('Tab and current file state is partially invalid')
      this.openFile(this.tabs[0])
    }

    this._isInitialized = true
    this.emit(this.events.INIT)
  }

  /**
   * Create a new item (file or folder)
   */
  async createItem(
    path: string,
    content: string = '',
    opts?: { 
      skipNameValidation?: boolean
      override?: boolean
      openOptions?: {
        dontOpen?: boolean
        onlyRefreshIfAlreadyOpen?: boolean
      }
    }
  ): Promise<void> {
    const fullPath = PathUtils.convertToFullPath(path)

    if (!opts?.skipNameValidation) {
      const name = PathUtils.getItemNameFromPath(fullPath)
      if (!PathUtils.isItemNameValid(name)) {
        throw new Error(this.errors.INVALID_NAME)
      }
    }

    if (this.state.files[fullPath] && !opts?.override) {
      throw new Error(this.errors.ALREADY_EXISTS)
    }

    const itemType = PathUtils.getItemTypeFromPath(fullPath)

    if (itemType.file) {
      if (!this._isTemporary) {
        await fsService.writeFile(fullPath, content, { createParents: true })
      }

      this.state.files[fullPath] = {
        content,
        meta: this.state.files[fullPath]?.meta ?? {}
      }

      if (!opts?.openOptions || opts?.openOptions?.onlyRefreshIfAlreadyOpen) {
        const isCurrentFile = this.currentFilePath === fullPath

        if (opts?.override && isCurrentFile) this.closeFile(fullPath)

        if (!opts?.openOptions || isCurrentFile) this.openFile(fullPath)
      }
    } else {
      // Folder
      if (!this._isTemporary) {
        await fsService.createDir(fullPath)
      }

      this.state.files[fullPath] = {}
    }

    this.emit(this.events.CREATE_ITEM)
    await this.saveMeta()
  }

  /**
   * Rename an item
   */
  async renameItem(
    oldPath: string,
    newPath: string,
    opts?: { skipNameValidation?: boolean; override?: boolean }
  ): Promise<void> {
    oldPath = PathUtils.convertToFullPath(oldPath)
    newPath = PathUtils.convertToFullPath(newPath)

    if (oldPath === newPath) return

    if (!opts?.skipNameValidation) {
      const name = PathUtils.getItemNameFromPath(newPath)
      if (!PathUtils.isItemNameValid(name)) {
        throw new Error(this.errors.INVALID_NAME)
      }
    }

    const itemType = PathUtils.getItemTypeFromPath(oldPath)
    const newItemType = PathUtils.getItemTypeFromPath(newPath)
    
    if ((itemType.file && !newItemType.file) || (itemType.folder && !newItemType.folder)) {
      throw new Error(this.errors.TYPE_MISMATCH)
    }

    if (!opts?.override) {
      if (itemType.file && this.state.files[newPath]) {
        throw new Error(this.errors.ALREADY_EXISTS)
      } else if (itemType.folder) {
        const folderContent = this.getFolderContent(newPath)
        if (folderContent.files.length > 0 || folderContent.folders.length > 0) {
          throw new Error(this.errors.ALREADY_EXISTS)
        }
      }
    }

    if (!this._isTemporary) {
      await fsService.rename(oldPath, newPath)
    }

    // Update state
    if (itemType.file) {
      this.state.files[newPath] = this.state.files[oldPath]
      delete this.state.files[oldPath]

      // Update tabs
      const tabIndex = this.state.tabs.indexOf(oldPath)
      if (tabIndex !== -1) {
        this.state.tabs[tabIndex] = newPath
      }

      // Update current index if needed
      if (this.currentFilePath === oldPath) {
        this.state.currentIndex = this.state.tabs.indexOf(newPath)
      }
    } else {
      // Folder - rename all children
      const oldFiles = Object.keys(this.state.files).filter(p => p.startsWith(oldPath))
      for (const oldFilePath of oldFiles) {
        const newFilePath = oldFilePath.replace(oldPath, newPath)
        this.state.files[newFilePath] = this.state.files[oldFilePath]
        delete this.state.files[oldFilePath]

        // Update tabs
        const tabIndex = this.state.tabs.indexOf(oldFilePath)
        if (tabIndex !== -1) {
          this.state.tabs[tabIndex] = newFilePath
        }
      }
    }

    this.emit(this.events.RENAME_ITEM, newPath)
    await this.saveMeta()
  }

  /**
   * Delete an item
   */
  async deleteItem(path: string): Promise<void> {
    const fullPath = PathUtils.convertToFullPath(path)
    const itemType = PathUtils.getItemTypeFromPath(fullPath)

    if (!this._isTemporary) {
      if (itemType.file) {
        await fsService.removeFile(fullPath)
      } else {
        await fsService.removeDir(fullPath, { recursive: true })
      }
    }

    // Update state
    if (itemType.file) {
      delete this.state.files[fullPath]
      this.closeFile(fullPath)
    } else {
      // Folder - delete all children
      const filesToDelete = Object.keys(this.state.files).filter(p => p.startsWith(fullPath))
      for (const filePath of filesToDelete) {
        delete this.state.files[filePath]
        this.closeFile(filePath)
      }
    }

    this.emit(this.events.DELETE_ITEM, fullPath)
    await this.saveMeta()
  }

  /* ----------------------------- State methods ---------------------------- */

  /**
   * Get all files as array of [path, content] tuples
   */
  getAllFiles(): Array<[string, string]> {
    return Object.entries(this.state.files)
      .filter(([_, info]) => info.content !== undefined)
      .map(([path, info]) => [path, info.content!])
  }

  /**
   * Save file to state only
   */
  saveFileToState(path: string, content: string): void {
    if (!this.state.files[path]) {
      this.state.files[path] = {}
    }
    this.state.files[path].content = content
  }

  /**
   * Get full file data
   */
  getFile(path: string): FullFile | null {
    const file = this.state.files[path]
    if (!file) return null
    return { ...file, path }
  }

  /**
   * Get file content from state
   */
  getFileContent(path: string): string | undefined {
    return this.state.files[path]?.content
  }

  /**
   * Get folder content
   */
  getFolderContent(path: string): FolderContent {
    const folderPath = PathUtils.isDirectory(path) ? path : path + '/'
    const items = Object.keys(this.state.files).filter(p => {
      if (p === folderPath) return false
      if (!p.startsWith(folderPath)) return false
      
      const relativePath = p.slice(folderPath.length)
      return !relativePath.includes('/')
    })

    const files: string[] = []
    const folders: string[] = []

    for (const item of items) {
      if (PathUtils.isDirectory(item)) {
        folders.push(PathUtils.getItemNameFromPath(item))
      } else {
        files.push(PathUtils.getItemNameFromPath(item))
      }
    }

    return { files, folders }
  }

  /**
   * Get current open file
   */
  getCurrentFile(): FullFile | null {
    if (!this.currentFilePath) return null
    return this.getFile(this.currentFilePath)
  }

  /**
   * Open file
   */
  openFile(path: string): void {
    const fullPath = PathUtils.convertToFullPath(path)

    if (!this.state.tabs.includes(fullPath)) {
      this.state.tabs.push(fullPath)
    }

    this.state.currentIndex = this.state.tabs.indexOf(fullPath)
    this.emit(this.events.OPEN_FILE, { path: fullPath })
  }

  /**
   * Close file
   */
  closeFile(path: string): void {
    const fullPath = PathUtils.convertToFullPath(path)
    const index = this.state.tabs.indexOf(fullPath)

    if (index === -1) return

    this.state.tabs.splice(index, 1)

    if (this.currentFilePath === fullPath) {
      const newIndex = Math.min(index, this.state.tabs.length - 1)
      this.state.currentIndex = newIndex >= 0 ? newIndex : -1
    } else if (this.state.currentIndex > index) {
      this.state.currentIndex--
    }

    this.emit(this.events.CLOSE_FILE)
  }

  /**
   * Set tabs
   */
  setTabs(tabs: readonly string[]): void {
    this.state.tabs = [...new Set(tabs)]
    this.emit(this.events.TABS_CHANGED)
  }

  /**
   * Get editor position
   */
  getEditorPosition(path: string): Position {
    return this.state.files[path]?.meta?.position ?? {
      topLineNumber: 1,
      cursor: { from: 0, to: 0 }
    }
  }

  /**
   * Save editor position
   */
  saveEditorPosition(path: string, position: Position): void {
    if (!this.state.files[path]) {
      this.state.files[path] = {}
    }
    if (!this.state.files[path].meta) {
      this.state.files[path].meta = {}
    }
    this.state.files[path].meta!.position = position
  }

  /* --------------------------- Workspace methods -------------------------- */

  /**
   * Create a new workspace
   */
  async createWorkspace(
    name: string,
    opts?: { 
      files?: Array<[string, string]>
      defaultOpenFile?: string
      fromTemporary?: boolean
    }
  ): Promise<void> {
    await workspaceService.createWorkspace(name, opts?.files)
    
    if (opts?.defaultOpenFile) {
      this.openFile(opts.defaultOpenFile)
    }

    this.emit(this.events.CREATE_WORKSPACE)
    await this.saveMeta()
  }

  /**
   * Switch workspace
   */
  async switchWorkspace(name: string, opts?: { defaultOpenFile?: string }): Promise<void> {
    await this.saveMeta()

    workspaceService.setCurrentWorkspaceName(name)
    await this.initCurrentWorkspace()

    if (opts?.defaultOpenFile) {
      this.openFile(opts.defaultOpenFile)
      await this.saveMeta()
    } else {
      this.emit(this.events.OPEN_FILE, this.getCurrentFile())
    }

    this.initializedWorkspaceName = name
    this.emit(this.events.SWITCH_WORKSPACE)
  }

  /**
   * Rename workspace
   */
  async renameWorkspace(newName: string): Promise<void> {
    const oldName = this.currentWorkspaceName
    if (!oldName) throw new Error('No current workspace')

    await workspaceService.renameWorkspace(oldName, newName)
    await this.switchWorkspace(newName)

    this.emit(this.events.RENAME_WORKSPACE)
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(): Promise<void> {
    const name = this.currentWorkspaceName
    if (!name) throw new Error('No current workspace')

    await this.deleteItem(this.currentWorkspacePath)
    workspaceService.deleteWorkspace(name)

    const remaining = this.allWorkspaceNames
    if (remaining.length > 0) {
      await this.switchWorkspace(remaining[remaining.length - 1])
    } else {
      this.state = this.getDefaultState()
    }

    this.emit(this.events.DELETE_WORKSPACE)
  }

  /* --------------------------- Private methods ---------------------------- */

  private async initCurrentWorkspace(): Promise<void> {
    const workspacePath = this.currentWorkspacePath

    // Load all files from the workspace
    await this.loadWorkspaceFiles(workspacePath)

    // Load metadata
    try {
      const metaPath = PathUtils.joinPaths(workspacePath, '.playground/metadata.json')
      const metaExists = await fsService.exists(metaPath)
      
      if (metaExists) {
        const metaContent = await fsService.readToString(metaPath)
        const metaFile: ItemMetaFile = JSON.parse(metaContent)

        for (const meta of metaFile) {
          const fullPath = PathUtils.joinPaths(workspacePath, meta.path)
          
          if (meta.position && this.state.files[fullPath]) {
            this.state.files[fullPath].meta = { position: meta.position }
          }

          if (meta.isTabs) {
            this.state.tabs.push(fullPath)
          }

          if (meta.isCurrent) {
            this.state.currentIndex = this.state.tabs.indexOf(fullPath)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load metadata:', error)
    }

    // Open default file if no tabs
    if (this.state.tabs.length === 0) {
      const paths = Object.keys(this.state.files)
      const firstFile = paths.find(p => !PathUtils.isDirectory(p))
      if (firstFile) this.openFile(firstFile)
    }
  }

  private async loadWorkspaceFiles(workspacePath: string): Promise<void> {
    this.state.files = {}
    await this.recursivelyLoadFiles(workspacePath)
  }

  private async recursivelyLoadFiles(dirPath: string): Promise<void> {
    try {
      const items = await fsService.readDir(dirPath)

      for (const item of items) {
        const itemPath = PathUtils.joinPaths(dirPath, item)
        const metadata = await fsService.getMetadata(itemPath)

        if (metadata.isDirectory()) {
          this.state.files[itemPath + '/'] = {}
          await this.recursivelyLoadFiles(itemPath + '/')
        } else {
          const content = await fsService.readToString(itemPath)
          this.state.files[itemPath] = { content, meta: {} }
        }
      }
    } catch (error) {
      console.warn(`Failed to load files from ${dirPath}:`, error)
    }
  }

  /**
   * Save metadata to indexedDB
   */
  async saveMeta(): Promise<void> {
    const paths = Object.keys(this.state.files)
    if (!this.currentWorkspaceName || !paths.length || this._isTemporary) return

    const isInvalidState = paths.some(p => !p.startsWith(this.currentWorkspacePath))
    if (isInvalidState) return

    const metaFile = paths
      .reduce((acc, path) => {
        if (path.startsWith(this.currentWorkspacePath)) {
          acc.push({
            path,
            isTabs: this.state.tabs.includes(path),
            isCurrent: this.currentFilePath === path,
            position: this.state.files[path].meta?.position
          })
        }
        return acc
      }, [] as ItemMetaFile)
      .sort((a, b) => {
        if (!a.isTabs) return 1
        if (!b.isTabs) return -1
        return this.state.tabs.indexOf(a.path) - this.state.tabs.indexOf(b.path)
      })
      .map(meta => ({
        ...meta,
        path: meta.path.slice(this.currentWorkspacePath.length)
      }))

    const metaPath = PathUtils.joinPaths(this.currentWorkspacePath, '.playground/metadata.json')
    await fsService.writeFile(metaPath, JSON.stringify(metaFile), { createParents: true })
  }

  private getDefaultState(): ExplorerState {
    return {
      files: {},
      tabs: [],
      currentIndex: -1
    }
  }

  /**
   * Get all files in a tree structure for UI rendering
   */
  getFiles(): any[] {
    return this.buildFileTree(this.currentWorkspacePath || '/')
  }

  private buildFileTree(basePath: string): any[] {
    const result: any[] = []
    const pathsAtThisLevel = Object.keys(this.state.files)
      .filter(p => {
        if (p === basePath) return false
        if (!p.startsWith(basePath)) return false
        const relativePath = p.slice(basePath.length)
        const parts = relativePath.split('/').filter(Boolean)
        return parts.length === 1 || (parts.length === 2 && relativePath.endsWith('/'))
      })

    for (const path of pathsAtThisLevel) {
      const name = PathUtils.getItemNameFromPath(path)
      
      if (PathUtils.isDirectory(path)) {
        result.push({
          path,
          name,
          type: 'dir',
          children: this.buildFileTree(path)
        })
      } else {
        result.push({
          path,
          name,
          type: 'file'
        })
      }
    }

    return result.sort((a, b) => {
      if (a.type === 'dir' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'dir') return 1
      return a.name.localeCompare(b.name)
    })
  }

  /* --------------------------- Event listeners ---------------------------- */

  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)

    return () => {
      const callbacks = this.eventListeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.eventListeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb(...args))
    }
  }
}

export const explorerService = new ExplorerService()
