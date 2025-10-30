/**
 * useEditorState Hook
 * Manages editor-specific state like open tabs and active file
 * Separates editor UI state from global project state
 */

import { useState, useCallback, useMemo } from 'react'
import type { ProjectFile } from '../types'
import { useProjectStore } from '../stores/useProjectStore'

export interface EditorState {
  openFiles: ProjectFile[]
  activeFile: ProjectFile | null
}

export interface EditorActions {
  openFile: (file: ProjectFile) => void
  closeFile: (fileId: string) => void
  setActiveFile: (file: ProjectFile | null) => void
  reorderTabs: (files: ProjectFile[]) => void
  closeAllFiles: () => void
  closeOtherFiles: (fileId: string) => void
}

export function useEditorState() {
  const { currentFiles, activeFile, setActiveFile: setGlobalActiveFile } = useProjectStore()
  const [openFiles, setOpenFiles] = useState<ProjectFile[]>([])

  /**
   * Open a file in a new tab or switch to it if already open
   */
  const openFile = useCallback((file: ProjectFile) => {
    // Get the up-to-date version from store
    const upToDateFile = currentFiles.find((f) => f.id === file.id) ?? file
    
    setOpenFiles((prev) => {
      // If already open, just return existing tabs
      if (prev.find((f) => f.id === file.id)) {
        return prev
      }
      return [...prev, upToDateFile]
    })
    
    // Set as active file
    setGlobalActiveFile(upToDateFile)
  }, [currentFiles, setGlobalActiveFile])

  /**
   * Close a file tab
   */
  const closeFile = useCallback((fileId: string) => {
    setOpenFiles((prev) => {
      const newOpenFiles = prev.filter((f) => f.id !== fileId)
      
      // If closing active file, switch to another
      if (activeFile?.id === fileId && newOpenFiles.length > 0) {
        setGlobalActiveFile(newOpenFiles[newOpenFiles.length - 1])
      } else if (newOpenFiles.length === 0) {
        setGlobalActiveFile(null)
      }
      
      return newOpenFiles
    })
  }, [activeFile, setGlobalActiveFile])

  /**
   * Set the currently active file
   */
  const setActiveFile = useCallback((file: ProjectFile | null) => {
    setGlobalActiveFile(file)
  }, [setGlobalActiveFile])

  /**
   * Reorder tabs (for drag and drop)
   */
  const reorderTabs = useCallback((files: ProjectFile[]) => {
    setOpenFiles(files)
  }, [])

  /**
   * Close all open tabs
   */
  const closeAllFiles = useCallback(() => {
    setOpenFiles([])
    setGlobalActiveFile(null)
  }, [setGlobalActiveFile])

  /**
   * Close all tabs except the specified one
   */
  const closeOtherFiles = useCallback((fileId: string) => {
    setOpenFiles((prev) => {
      const keepFile = prev.find((f) => f.id === fileId)
      return keepFile ? [keepFile] : []
    })
    
    const fileToKeep = openFiles.find((f) => f.id === fileId)
    if (fileToKeep) {
      setGlobalActiveFile(fileToKeep)
    }
  }, [openFiles, setGlobalActiveFile])

  /**
   * Sync open tabs with updated file content from store
   * This ensures tabs always show the latest content
   */
  const syncedOpenFiles = useMemo(() => {
    return openFiles.map((tab) => {
      const updatedFile = currentFiles.find((file) => file.id === tab.id)
      return updatedFile ?? tab
    })
  }, [openFiles, currentFiles])

  return {
    // State
    openFiles: syncedOpenFiles,
    activeFile,
    
    // Actions
    openFile,
    closeFile,
    setActiveFile,
    reorderTabs,
    closeAllFiles,
    closeOtherFiles,
  }
}
