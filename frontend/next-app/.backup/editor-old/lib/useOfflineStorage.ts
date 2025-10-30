import { useEffect, useState } from 'react'
import { offlineStorageService } from '../services/offline-storage.service'
import { useAuthStore } from '../stores/useAuthStore'
import { toast } from 'react-hot-toast'

/**
 * Hook to manage offline storage and sync status
 */
export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const { token } = useAuthStore()

  useEffect(() => {
    // Initialize offline storage
    offlineStorageService.init().catch((error) => {
      console.error('[useOfflineStorage] Failed to initialize:', error)
    })

    // Set token getter
    offlineStorageService.setTokenGetter(() => token || null)

    // Update online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Update pending count
    const updatePendingCount = async () => {
      try {
        const count = await offlineStorageService.getPendingCount()
        setPendingCount(count)
      } catch (error) {
        console.error('[useOfflineStorage] Failed to get pending count:', error)
      }
    }

    // Setup sync callback
    offlineStorageService.onSync((success, count) => {
      if (success) {
        toast.success(`✅ Synced ${count} change${count > 1 ? 's' : ''}`)
        updatePendingCount()
      }
    })

    // Initial checks
    updateOnlineStatus()
    updatePendingCount()

    // Listen for online/offline events
    window.addEventListener('online', () => {
      updateOnlineStatus()
      toast.success('🟢 Back online - syncing changes...')
      setIsSyncing(true)
      
      offlineStorageService.forceSync().finally(() => {
        setIsSyncing(false)
      })
    })

    window.addEventListener('offline', () => {
      updateOnlineStatus()
      toast.error('🔴 Offline - changes will be saved locally')
    })

    // Poll for pending count every 10 seconds
    const interval = setInterval(updatePendingCount, 10000)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [token])

  /**
   * Save file change (works offline)
   */
  const saveOffline = async (
    projectId: string,
    fileId: string,
    filePath: string,
    content: string,
    language: string
  ): Promise<void> => {
    try {
      await offlineStorageService.saveFileChange(
        projectId,
        fileId,
        filePath,
        content,
        language
      )
      
      // Update pending count
      const count = await offlineStorageService.getPendingCount()
      setPendingCount(count)
      
      if (!isOnline) {
        toast.success('💾 Saved locally (will sync when online)')
      }
    } catch (error) {
      console.error('[useOfflineStorage] Failed to save offline:', error)
      throw error
    }
  }

  /**
   * Save file rename (works offline)
   */
  const saveRenameOffline = async (
    projectId: string,
    fileId: string,
    oldPath: string,
    newPath: string
  ): Promise<void> => {
    try {
      await offlineStorageService.saveFileRename(projectId, fileId, oldPath, newPath)
      const count = await offlineStorageService.getPendingCount()
      setPendingCount(count)
      
      if (!isOnline) {
        toast.success('✏️ Rename saved locally (will sync when online)')
      }
    } catch (error) {
      console.error('[useOfflineStorage] Failed to save rename offline:', error)
      throw error
    }
  }

  /**
   * Save file move (works offline)
   */
  const saveMoveOffline = async (
    projectId: string,
    fileId: string,
    oldPath: string,
    newPath: string
  ): Promise<void> => {
    try {
      await offlineStorageService.saveFileMove(projectId, fileId, oldPath, newPath)
      const count = await offlineStorageService.getPendingCount()
      setPendingCount(count)
      
      if (!isOnline) {
        toast.success('📁 Move saved locally (will sync when online)')
      }
    } catch (error) {
      console.error('[useOfflineStorage] Failed to save move offline:', error)
      throw error
    }
  }

  /**
   * Save file delete (works offline)
   */
  const saveDeleteOffline = async (
    projectId: string,
    fileId: string,
    filePath: string
  ): Promise<void> => {
    try {
      await offlineStorageService.saveFileDelete(projectId, fileId, filePath)
      const count = await offlineStorageService.getPendingCount()
      setPendingCount(count)
      
      if (!isOnline) {
        toast.success('🗑️ Delete saved locally (will sync when online)')
      }
    } catch (error) {
      console.error('[useOfflineStorage] Failed to save delete offline:', error)
      throw error
    }
  }

  /**
   * Save file create (works offline)
   */
  const saveCreateOffline = async (
    projectId: string,
    fileId: string,
    filePath: string,
    content: string,
    language: string
  ): Promise<void> => {
    try {
      await offlineStorageService.saveFileCreate(projectId, fileId, filePath, content, language)
      const count = await offlineStorageService.getPendingCount()
      setPendingCount(count)
      
      if (!isOnline) {
        toast.success('📄 Create saved locally (will sync when online)')
      }
    } catch (error) {
      console.error('[useOfflineStorage] Failed to save create offline:', error)
      throw error
    }
  }

  /**
   * Manually trigger sync
   */
  const sync = async (): Promise<void> => {
    if (!isOnline) {
      toast.error('Cannot sync while offline')
      return
    }

    setIsSyncing(true)
    try {
      await offlineStorageService.forceSync()
      const count = await offlineStorageService.getPendingCount()
      setPendingCount(count)
    } catch (error) {
      console.error('[useOfflineStorage] Sync failed:', error)
      toast.error('Failed to sync changes')
    } finally {
      setIsSyncing(false)
    }
  }

  /**
   * Cache files for offline access
   */
  const cacheFiles = async (files: any[]): Promise<void> => {
    try {
      await offlineStorageService.cacheFiles(files)
    } catch (error) {
      console.error('[useOfflineStorage] Failed to cache files:', error)
    }
  }

  /**
   * Get cached files
   */
  const getCachedFiles = async (projectId: string): Promise<any[]> => {
    try {
      return await offlineStorageService.getCachedFiles(projectId)
    } catch (error) {
      console.error('[useOfflineStorage] Failed to get cached files:', error)
      return []
    }
  }

  /**
   * Apply pending changes to files
   */
  const applyPendingChanges = async (files: any[]): Promise<any[]> => {
    try {
      return await offlineStorageService.applyPendingChanges(files)
    } catch (error) {
      console.error('[useOfflineStorage] Failed to apply pending changes:', error)
      return files
    }
  }

  return {
    isOnline,
    pendingCount,
    isSyncing,
    saveOffline,
    saveRenameOffline,
    saveMoveOffline,
    saveDeleteOffline,
    saveCreateOffline,
    sync,
    cacheFiles,
    getCachedFiles,
    applyPendingChanges,
  }
}
