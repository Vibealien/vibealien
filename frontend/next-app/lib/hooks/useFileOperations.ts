/**
 * useFileOperations Hook
 * Provides file CRUD operations with offline support
 * Integrates file operations service with editor state
 */

import { useCallback } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useOfflineStorage } from './useOfflineStorage'
import { fileOperationsService } from '../services/file-operations.service'
import type { ProjectFile } from '../types'
import { toast } from 'react-hot-toast'

export function useFileOperations(projectId: string) {
  const { token } = useAuthStore()
  const { currentProject, currentFiles, setCurrentFiles, updateFile, removeFile, addFile } = useProjectStore()
  const { isOnline } = useOfflineStorage()

  /**
   * Create a new file or folder
   */
  const createFile = useCallback(async (path: string, isFolder: boolean = false) => {
    try {
      if (isFolder) {
        // Folders are handled by parent component state
        return { success: true, isFolder: true }
      }

      // Determine language from extension
      const extension = path.split('.').pop()?.toLowerCase() || 'text'
      const languageMap: { [key: string]: string } = {
        rs: 'rust',
        toml: 'toml',
        md: 'markdown',
        json: 'json',
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        c: 'c',
      }
      const language = languageMap[extension] || 'text'

      // Get template content
      const content = fileOperationsService.getFileTemplate(path, language, currentProject?.name)

      // Create file
      const result = await fileOperationsService.createFile(
        projectId,
        { path, content, language },
        token,
        isOnline
      )

      if (result.success && result.data) {
        // Add to store
        addFile(result.data)
        toast.success('File created! 📄')
        return { success: true, file: result.data }
      }

      return { success: false, error: result.error }
    } catch (error: any) {
      console.error('Failed to create file:', error)
      toast.error('Failed to create file')
      return { success: false, error: error.message }
    }
  }, [projectId, token, isOnline, currentProject, addFile])

  /**
   * Rename a file
   */
  const renameFile = useCallback(async (fileId: string, newPath: string) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) {
      toast.error('File not found')
      return { success: false, error: 'File not found' }
    }

    // Check if path already exists
    if (currentFiles.some((f) => f.path === newPath && f.id !== fileId)) {
      toast.error('A file with this path already exists')
      return { success: false, error: 'Path already exists' }
    }

    const result = await fileOperationsService.renameFile(
      projectId,
      fileId,
      file.path,
      newPath,
      token,
      isOnline
    )

    if (result.success) {
      // Update in store
      updateFile(fileId, { path: newPath })
      return { success: true }
    }

    toast.error('Failed to rename file')
    return result
  }, [projectId, token, isOnline, currentFiles, updateFile])

  /**
   * Move a file to a new location
   */
  const moveFile = useCallback(async (fileId: string, newPath: string) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) {
      toast.error('File not found')
      return { success: false, error: 'File not found' }
    }

    // Check if path already exists
    if (currentFiles.some((f) => f.path === newPath && f.id !== fileId)) {
      toast.error('A file with this path already exists')
      return { success: false, error: 'Path already exists' }
    }

    const result = await fileOperationsService.moveFile(
      projectId,
      fileId,
      file.path,
      newPath,
      token,
      isOnline
    )

    if (result.success) {
      // Update in store
      updateFile(fileId, { path: newPath })
      return { success: true }
    }

    toast.error('Failed to move file')
    return result
  }, [projectId, token, isOnline, currentFiles, updateFile])

  /**
   * Delete a file
   */
  const deleteFile = useCallback(async (fileId: string) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) {
      toast.error('File not found')
      return { success: false, error: 'File not found' }
    }

    const result = await fileOperationsService.deleteFile(
      projectId,
      fileId,
      file.path,
      token,
      isOnline
    )

    if (result.success) {
      // Remove from store
      removeFile(fileId)
      return { success: true }
    }

    toast.error('Failed to delete file')
    return result
  }, [projectId, token, isOnline, currentFiles, removeFile])

  /**
   * Duplicate a file
   */
  const duplicateFile = useCallback(async (fileId: string) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) {
      toast.error('File not found')
      return { success: false, error: 'File not found' }
    }

    const result = await fileOperationsService.duplicateFile(
      projectId,
      file,
      token,
      isOnline
    )

    if (result.success && result.data) {
      // Add to store
      addFile(result.data)
      toast.success('File duplicated! 📋')
      return { success: true, file: result.data }
    }

    toast.error('Failed to duplicate file')
    return result
  }, [projectId, token, isOnline, currentFiles, addFile])

  /**
   * Update file content (for editor changes)
   */
  const updateFileContent = useCallback(async (
    fileId: string,
    content: string,
    silent: boolean = false
  ) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) return { success: false, error: 'File not found' }

    const result = await fileOperationsService.updateFileContent(
      projectId,
      fileId,
      file.path,
      content,
      file.language,
      token,
      isOnline
    )

    if (result.success) {
      // Update in store
      updateFile(fileId, { content })
      
      if (!silent) {
        toast.success('File saved! 💾')
      }
      
      return { success: true }
    }

    if (!silent) {
      toast.error('Failed to save file')
    }
    
    return result
  }, [projectId, token, isOnline, currentFiles, updateFile])

  return {
    createFile,
    renameFile,
    moveFile,
    deleteFile,
    duplicateFile,
    updateFileContent,
  }
}
