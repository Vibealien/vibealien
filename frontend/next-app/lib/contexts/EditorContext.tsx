/**
 * EditorContext
 * Provides shared state and actions to all editor components
 * Eliminates prop drilling and centralizes editor state management
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { useEditorState } from '../hooks/useEditorState'
import { useEditorUI } from '../hooks/useEditorUI'
import { useFileOperations } from '../hooks/useFileOperations'
import { useProjectLoader } from '../hooks/useProjectLoader'
import { useOfflineStorage } from '../hooks/useOfflineStorage'
import { useAuthStore } from '../stores/useAuthStore'
import type { ProjectFile, Project } from '../types'

interface EditorContextValue {
  // Project & Files
  project: Project | null
  files: ProjectFile[]
  isLoading: boolean
  error: string | null
  reloadProject: () => void

  // Editor State
  openFiles: ProjectFile[]
  activeFile: ProjectFile | null
  openFile: (file: ProjectFile) => void
  closeFile: (fileId: string) => void
  setActiveFile: (file: ProjectFile | null) => void
  reorderTabs: (files: ProjectFile[]) => void
  closeAllFiles: () => void
  closeOtherFiles: (fileId: string) => void

  // File Operations
  createFile: (path: string, isFolder?: boolean) => Promise<any>
  renameFile: (fileId: string, newPath: string) => Promise<any>
  moveFile: (fileId: string, newPath: string) => Promise<any>
  deleteFile: (fileId: string) => Promise<any>
  duplicateFile: (fileId: string) => Promise<any>
  updateFileContent: (fileId: string, content: string, silent?: boolean) => Promise<any>

  // UI State
  showCreateModal: boolean
  showCollabPanel: boolean
  sidebarPage: 'explorer' | 'build' | 'settings'
  cursorPosition: { line: number; column: number }
  selectedCount: number
  openCreateModal: () => void
  closeCreateModal: () => void
  toggleCreateModal: () => void
  openCollabPanel: () => void
  closeCollabPanel: () => void
  toggleCollabPanel: () => void
  setSidebarPage: (page: 'explorer' | 'build' | 'settings') => void
  setCursorPosition: (position: { line: number; column: number }) => void
  setSelectedCount: (count: number) => void

  // Offline & Sync
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  sync: () => Promise<void>

  // Auth
  token: string | null
  user: any
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children, projectId }: { children: ReactNode; projectId: string }) {
  const { token, user } = useAuthStore()
  
  // Load project data
  const { project, files, isLoading, error, reloadProject } = useProjectLoader(projectId)
  
  // Editor state (tabs, active file)
  const editorState = useEditorState()
  
  // UI state (modals, panels)
  const editorUI = useEditorUI()
  
  // File operations
  const fileOps = useFileOperations(projectId)
  
  // Offline & sync
  const { isOnline, pendingCount, isSyncing, sync } = useOfflineStorage()

  const value: EditorContextValue = useMemo(() => ({
    // Project & Files
    project,
    files,
    isLoading,
    error,
    reloadProject,

    // Editor State
    ...editorState,

    // File Operations
    ...fileOps,

    // UI State
    ...editorUI,

    // Offline & Sync
    isOnline,
    pendingCount,
    isSyncing,
    sync,

    // Auth
    token,
    user,
  }), [
    project,
    files,
    isLoading,
    error,
    reloadProject,
    editorState,
    fileOps,
    editorUI,
    isOnline,
    pendingCount,
    isSyncing,
    sync,
    token,
    user,
  ])

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}
