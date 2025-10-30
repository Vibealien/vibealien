/**
 * Offline Storage Service using IndexedDB
 * Stores file changes locally when offline and syncs when online
 */

interface PendingChange {
  id: string
  projectId: string
  fileId: string
  filePath: string
  content: string
  language: string
  timestamp: number
  synced: boolean
  retryCount: number
  operation: 'update' | 'rename' | 'move' | 'delete' | 'create'
  newPath?: string // For rename/move operations
}

interface OfflineProject {
  id: string
  name: string
  description: string
  lastModified: number
}

class OfflineStorageService {
  private dbName = 'vibingalien-offline'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private readonly STORES = {
    PENDING_CHANGES: 'pendingChanges',
    PROJECTS: 'projects',
    FILES: 'files',
  }
  private syncInterval: NodeJS.Timeout | null = null
  private isOnline: boolean = true
  private onSyncCallback?: (success: boolean, count: number) => void
  private tokenGetter?: () => string | null

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }

      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('[OfflineStorage] Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('[OfflineStorage] IndexedDB initialized')
        this.setupOnlineListener()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store for pending changes (unsaved edits)
        if (!db.objectStoreNames.contains(this.STORES.PENDING_CHANGES)) {
          const changesStore = db.createObjectStore(this.STORES.PENDING_CHANGES, {
            keyPath: 'id',
          })
          changesStore.createIndex('projectId', 'projectId', { unique: false })
          changesStore.createIndex('fileId', 'fileId', { unique: false })
          changesStore.createIndex('synced', 'synced', { unique: false })
          changesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Store for cached projects
        if (!db.objectStoreNames.contains(this.STORES.PROJECTS)) {
          db.createObjectStore(this.STORES.PROJECTS, { keyPath: 'id' })
        }

        // Store for cached files
        if (!db.objectStoreNames.contains(this.STORES.FILES)) {
          const filesStore = db.createObjectStore(this.STORES.FILES, { keyPath: 'id' })
          filesStore.createIndex('projectId', 'projectId', { unique: false })
        }

        console.log('[OfflineStorage] Database schema created')
      }
    })
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineListener(): void {
    if (typeof window === 'undefined') return

    this.isOnline = navigator.onLine

    window.addEventListener('online', () => {
      console.log('[OfflineStorage] 🟢 Online - starting sync')
      this.isOnline = true
      this.syncPendingChanges()
    })

    window.addEventListener('offline', () => {
      console.log('[OfflineStorage] 🔴 Offline - changes will be queued')
      this.isOnline = false
    })

    // Start periodic sync check (every 30 seconds)
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingChanges()
      }
    }, 30000)
  }

  /**
   * Save a file change (works offline)
   */
  async saveFileChange(
    projectId: string,
    fileId: string,
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    const change: PendingChange = {
      id: `${fileId}-update-${Date.now()}`,
      projectId,
      fileId,
      filePath,
      content,
      language,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
      operation: 'update',
    }

    return this.savePendingChange(change)
  }

  /**
   * Save a file rename operation (works offline)
   */
  async saveFileRename(
    projectId: string,
    fileId: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    const change: PendingChange = {
      id: `${fileId}-rename-${Date.now()}`,
      projectId,
      fileId,
      filePath: oldPath,
      newPath,
      content: '',
      language: '',
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
      operation: 'rename',
    }

    return this.savePendingChange(change)
  }

  /**
   * Save a file move operation (works offline)
   */
  async saveFileMove(
    projectId: string,
    fileId: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    const change: PendingChange = {
      id: `${fileId}-move-${Date.now()}`,
      projectId,
      fileId,
      filePath: oldPath,
      newPath,
      content: '',
      language: '',
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
      operation: 'move',
    }

    return this.savePendingChange(change)
  }

  /**
   * Save a file delete operation (works offline)
   */
  async saveFileDelete(
    projectId: string,
    fileId: string,
    filePath: string
  ): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    const change: PendingChange = {
      id: `${fileId}-delete-${Date.now()}`,
      projectId,
      fileId,
      filePath,
      content: '',
      language: '',
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
      operation: 'delete',
    }

    return this.savePendingChange(change)
  }

  /**
   * Save a file create operation (works offline)
   */
  async saveFileCreate(
    projectId: string,
    fileId: string,
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    const change: PendingChange = {
      id: `${fileId}-create-${Date.now()}`,
      projectId,
      fileId,
      filePath,
      content,
      language,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
      operation: 'create',
    }

    return this.savePendingChange(change)
  }

  /**
   * Generic method to save a pending change
   */
  private async savePendingChange(change: PendingChange): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.PENDING_CHANGES], 'readwrite')
      const store = transaction.objectStore(this.STORES.PENDING_CHANGES)
      const request = store.add(change)

      request.onsuccess = () => {
        const opLabel = change.operation.toUpperCase()
        console.log(`[OfflineStorage] 💾 ${opLabel} saved locally:`, change.filePath, change.newPath ? `→ ${change.newPath}` : '')
        resolve()
      }

      request.onerror = () => {
        console.error('[OfflineStorage] Failed to save change:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get all pending changes for a file
   */
  async getPendingChanges(fileId?: string): Promise<PendingChange[]> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.PENDING_CHANGES], 'readonly')
      const store = transaction.objectStore(this.STORES.PENDING_CHANGES)
      
      // Get all records instead of using index to avoid key range issues
      const request = store.getAll()

      request.onsuccess = () => {
        let changes = (request.result as PendingChange[]).filter(
          (c) => !c.synced
        )
        
        if (fileId) {
          changes = changes.filter((c) => c.fileId === fileId)
        }
        
        // Sort by timestamp (oldest first)
        changes.sort((a, b) => a.timestamp - b.timestamp)
        
        resolve(changes)
      }

      request.onerror = () => {
        console.error('[OfflineStorage] Failed to get pending changes:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Sync pending changes with server
   */
  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || !this.db) return

    // Need token to sync
    const token = this.tokenGetter?.()
    if (!token) {
      console.warn('[OfflineStorage] No token available for sync')
      return
    }

    const pendingChanges = await this.getPendingChanges()
    
    if (pendingChanges.length === 0) return

    console.log(`[OfflineStorage] 🔄 Syncing ${pendingChanges.length} pending changes...`)

    let successCount = 0
    let failCount = 0

    for (const change of pendingChanges) {
      try {
        // Import projectsApi dynamically to avoid circular dependencies
        const { projectsApi } = await import('../api/projects')
        
        // Handle different operation types
        switch (change.operation) {
          case 'update':
            await projectsApi.updateFile(token, change.projectId, change.fileId, {
              content: change.content,
            })
            console.log('[OfflineStorage] ✅ Synced UPDATE:', change.filePath)
            break

          case 'rename':
          case 'move':
            if (change.newPath) {
              await projectsApi.updateFile(token, change.projectId, change.fileId, {
                path: change.newPath,
              })
              console.log('[OfflineStorage] ✅ Synced RENAME/MOVE:', change.filePath, '→', change.newPath)
            }
            break

          case 'delete':
            await projectsApi.deleteFile(token, change.projectId, change.fileId)
            console.log('[OfflineStorage] ✅ Synced DELETE:', change.filePath)
            break

          case 'create':
            await projectsApi.createFile(token, change.projectId, {
              path: change.filePath,
              content: change.content,
              language: change.language,
            })
            console.log('[OfflineStorage] ✅ Synced CREATE:', change.filePath)
            break

          default:
            console.warn('[OfflineStorage] Unknown operation:', change.operation)
        }

        // Mark as synced
        await this.markAsSynced(change.id)
        successCount++
      } catch (error) {
        console.error('[OfflineStorage] ❌ Failed to sync:', change.operation, change.filePath, error)
        
        // Increment retry count
        await this.incrementRetryCount(change.id)
        failCount++

        // Remove if too many retries (after 10 attempts)
        if (change.retryCount >= 10) {
          await this.removePendingChange(change.id)
          console.warn('[OfflineStorage] ⚠️ Removed after 10 failed attempts:', change.filePath)
        }
      }
    }

    if (successCount > 0) {
      console.log(`[OfflineStorage] 🎉 Sync complete: ${successCount} succeeded, ${failCount} failed`)
      
      // Trigger callback if set
      this.onSyncCallback?.(true, successCount)
    }
  }

  /**
   * Mark a change as synced
   */
  private async markAsSynced(changeId: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.PENDING_CHANGES], 'readwrite')
      const store = transaction.objectStore(this.STORES.PENDING_CHANGES)
      const request = store.get(changeId)

      request.onsuccess = () => {
        const change = request.result as PendingChange
        if (change) {
          change.synced = true
          store.put(change)
        }
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Increment retry count for a change
   */
  private async incrementRetryCount(changeId: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.PENDING_CHANGES], 'readwrite')
      const store = transaction.objectStore(this.STORES.PENDING_CHANGES)
      const request = store.get(changeId)

      request.onsuccess = () => {
        const change = request.result as PendingChange
        if (change) {
          change.retryCount++
          store.put(change)
        }
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove a pending change
   */
  private async removePendingChange(changeId: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.PENDING_CHANGES], 'readwrite')
      const store = transaction.objectStore(this.STORES.PENDING_CHANGES)
      const request = store.delete(changeId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all synced changes (cleanup)
   */
  async clearSyncedChanges(): Promise<void> {
    if (!this.db) return

    const syncedChanges = await new Promise<PendingChange[]>((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.PENDING_CHANGES], 'readonly')
      const store = transaction.objectStore(this.STORES.PENDING_CHANGES)
      const index = store.index('synced')
      const request = index.getAll(IDBKeyRange.only(true))

      request.onsuccess = () => resolve(request.result as PendingChange[])
      request.onerror = () => reject(request.error)
    })

    for (const change of syncedChanges) {
      await this.removePendingChange(change.id)
    }

    console.log(`[OfflineStorage] 🧹 Cleaned up ${syncedChanges.length} synced changes`)
  }

  /**
   * Get pending changes count
   */
  async getPendingCount(): Promise<number> {
    const changes = await this.getPendingChanges()
    return changes.length
  }

  /**
   * Cache files in IndexedDB for offline access
   */
  async cacheFiles(files: any[]): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.FILES], 'readwrite')
      const store = transaction.objectStore(this.STORES.FILES)

      // Clear existing files first
      store.clear()

      // Add all files
      files.forEach(file => {
        store.add(file)
      })

      transaction.oncomplete = () => {
        console.log(`[OfflineStorage] 💾 Cached ${files.length} files`)
        resolve()
      }

      transaction.onerror = () => {
        console.error('[OfflineStorage] Failed to cache files:', transaction.error)
        reject(transaction.error)
      }
    })
  }

  /**
   * Get cached files from IndexedDB
   */
  async getCachedFiles(projectId: string): Promise<any[]> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.FILES], 'readonly')
      const store = transaction.objectStore(this.STORES.FILES)
      const index = store.index('projectId')
      const request = index.getAll(projectId)

      request.onsuccess = () => {
        console.log(`[OfflineStorage] 📂 Loaded ${request.result.length} cached files`)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error('[OfflineStorage] Failed to get cached files:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Apply pending changes to files (merge offline changes with server files)
   */
  async applyPendingChanges(files: any[]): Promise<any[]> {
    const pendingChanges = await this.getPendingChanges()
    
    if (pendingChanges.length === 0) {
      return files
    }

    console.log(`[OfflineStorage] 🔄 Applying ${pendingChanges.length} pending changes to files`)

    const filesMap = new Map(files.map(f => [f.id, { ...f }]))
    
    // Apply changes in chronological order
    pendingChanges.sort((a, b) => a.timestamp - b.timestamp)
    
    for (const change of pendingChanges) {
      switch (change.operation) {
        case 'update':
          if (filesMap.has(change.fileId)) {
            const file = filesMap.get(change.fileId)!
            file.content = change.content
            file.updatedAt = new Date(change.timestamp).toISOString()
          }
          break
        
        case 'create':
          // Add new file if it doesn't exist
          if (!filesMap.has(change.fileId)) {
            filesMap.set(change.fileId, {
              id: change.fileId,
              projectId: change.projectId,
              path: change.filePath,
              content: change.content,
              language: change.language,
              size: new Blob([change.content]).size,
              createdAt: new Date(change.timestamp).toISOString(),
              updatedAt: new Date(change.timestamp).toISOString(),
            })
          }
          break
        
        case 'rename':
        case 'move':
          if (filesMap.has(change.fileId) && change.newPath) {
            const file = filesMap.get(change.fileId)!
            file.path = change.newPath
            file.updatedAt = new Date(change.timestamp).toISOString()
          }
          break
        
        case 'delete':
          filesMap.delete(change.fileId)
          break
      }
    }

    return Array.from(filesMap.values())
  }

  /**
   * Set callback for sync events
   */
  onSync(callback: (success: boolean, count: number) => void): void {
    this.onSyncCallback = callback
  }

  /**
   * Set token getter for authenticated API calls
   */
  setTokenGetter(getter: () => string | null): void {
    this.tokenGetter = getter
  }

  /**
   * Check if currently online
   */
  get online(): boolean {
    return this.isOnline
  }

  /**
   * Manually trigger sync
   */
  async forceSync(): Promise<void> {
    await this.syncPendingChanges()
  }

  /**
   * Cleanup and close
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService()
