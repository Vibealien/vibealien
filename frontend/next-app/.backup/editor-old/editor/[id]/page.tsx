/**
 * Refactored Editor Page
 * Clean, maintainable code with proper separation of concerns
 * Uses custom hooks, context, and smaller focused components
 */

'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

// Context & Hooks
import { EditorProvider, useEditor } from '@/lib/contexts/EditorContext'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'
import { useBuild } from '@/lib/hooks/useBuild'

// Services
import { collaborationService } from '@/lib/services/collaboration.service'
import { editorService } from '@/lib/services'
import { initializeEditor } from '@/lib/editor-init'

// Components
import { EditorHeader } from '@/components/editor/EditorHeader'
import { EditorMain } from '@/components/editor/EditorMain'
import { Sidebar } from '@/components/editor/Sidebar'
import { FileTree } from '@/components/editor/FileTree'
import { AIPanel } from '@/components/editor/AIPanel'
import { BuildPanel } from '@/components/editor/BuildPanel'
import { CollaborationPanel } from '@/components/editor/CollaborationPanel'
import { CreateFileModal } from '@/components/editor/CreateFileModal'
import { EditorErrorBoundary } from '@/components/editor/EditorErrorBoundary'

// Stores
import { useCollaborationStore } from '@/lib/stores/useCollaborationStore'
import { useProjectStore } from '@/lib/stores/useProjectStore'

// Types
import type { ProjectFile, Build } from '@/lib/types'

/**
 * Inner Editor Component (has access to EditorContext)
 */
function EditorContent() {
  const {
    // Project & Files
    project,
    files,
    isLoading,
    
    // Editor State
    openFiles,
    activeFile,
    openFile,
    closeFile,
    setActiveFile,
    reorderTabs,
    
    // File Operations
    createFile,
    renameFile,
    moveFile,
    deleteFile,
    duplicateFile,
    updateFileContent,
    
    // UI State
    showCreateModal,
    showCollabPanel,
    sidebarPage,
    cursorPosition,
    selectedCount,
    openCreateModal,
    closeCreateModal,
    openCollabPanel,
    closeCollabPanel,
    setSidebarPage,
    setCursorPosition,
    setSelectedCount,
    
    // Offline & Sync
    isOnline,
    pendingCount,
    isSyncing,
    sync,
    
    // Auth
    token,
    user,
  } = useEditor()

  const params = useParams()
  const projectId = params.id as string

  // Collaboration state
  const {
    isConnected,
    activeUsers,
    setConnected,
    addUser,
    removeUser,
    clearSession,
  } = useCollaborationStore()

  const { currentFiles, updateFile: updateStoreFile } = useProjectStore()

  // Build operations
  const { currentBuild, isBuilding, triggerBuild } = useBuild(projectId)

  // Local state
  const [folders, setFolders] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editorContent, setEditorContent] = useState<string>('') // Track current editor content
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
  const [yProvider, setYProvider] = useState<WebsocketProvider | null>(null)

  // Compute all folders (explicit empty + implicit from file paths)
  const allFolders = useMemo(() => {
    const folderSet = new Set<string>(folders)
    
    currentFiles.forEach(file => {
      const pathParts = file.path.split('/')
      pathParts.pop() // Remove filename
      
      let currentPath = ''
      pathParts.forEach(part => {
        if (part) {
          currentPath = currentPath ? `${currentPath}/${part}` : part
          folderSet.add(currentPath)
        }
      })
    })
    
    return Array.from(folderSet)
  }, [folders, currentFiles])

  // Initialize editor services
  useEffect(() => {
    if (projectId) {
      initializeEditor(projectId).catch(error => {
        console.error('Failed to initialize editor:', error)
      })
    }
  }, [projectId])

  // Sync editor content when active file changes
  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content)
      setHasUnsavedChanges(false)
    }
  }, [activeFile?.id]) // Only when file ID changes, not content

  // Initialize editor service with files
  useEffect(() => {
    if (currentFiles.length > 0) {
      editorService.loadFiles(currentFiles)
    }
  }, [currentFiles])

  // Listen to editor service events (auto-save)
  useEffect(() => {
    const unsubscribeAutoSave = editorService.on('editor:file:autosave', async (fileId: string, content: string) => {
      await updateFileContent(fileId, content, true)
    })

    const unsubscribeSave = editorService.on('editor:file:save', (fileId: string, content: string) => {
      handleSave()
    })

    return () => {
      unsubscribeAutoSave()
      unsubscribeSave()
    }
  }, [updateFileContent])

  // Connect to collaboration service
  useEffect(() => {
    if (activeFile && token && user && projectId) {
      const { doc, provider } = collaborationService.connect(
        projectId,
        activeFile.id,
        token,
        () => {
          setConnected(true)
          toast.success('Connected to collaboration server 🔗')
        },
        () => {
          // Updates handled by Yjs automatically
        },
        (users) => {
          const currentUsers = new Set<string>()
          
          users.forEach((state: any, userId: number) => {
            const userIdStr = userId.toString()
            currentUsers.add(userIdStr)
            
            if (state.user) {
              addUser(userIdStr, {
                userId: state.user.userId,
                username: state.user.username,
                userWallet: state.user.userWallet,
                cursor: state.cursor || { line: 1, column: 1 },
                lastSeen: Date.now(),
              })
            }
          })
          
          activeUsers.forEach((_, userId) => {
            if (!currentUsers.has(userId)) {
              removeUser(userId)
            }
          })
        }
      )
      
      setYDoc(doc)
      setYProvider(provider)
      
      collaborationService.setUserInfo(projectId, activeFile.id, {
        userId: user.id,
        username: user.username || user.wallet.slice(0, 8),
        userWallet: user.wallet,
        color: '#7B2FF7',
      })
      
      return () => {
        collaborationService.disconnect(projectId, activeFile.id)
        setConnected(false)
        clearSession()
        setYDoc(null)
        setYProvider(null)
      }
    }
  }, [activeFile, token, user, projectId, setConnected, addUser, removeUser, clearSession, activeUsers])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      if (hasUnsavedChanges && !isSaving) {
        handleSave()
      }
    },
    onNewFile: () => {
      openCreateModal()
    },
    onCloseTab: () => {
      if (activeFile) {
        closeFile(activeFile.id)
      }
    },
  })

  // Handler functions
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (!activeFile || value === undefined) return
    
    // Store content locally for saving
    setEditorContent(value)
    setHasUnsavedChanges(true)
  }, [activeFile])

  const handleSave = useCallback(async () => {
    if (!activeFile) return

    setIsSaving(true)
    try {
      // Use the editor content, not the store content
      await updateFileContent(activeFile.id, editorContent, false)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save file:', error)
    } finally {
      setIsSaving(false)
    }
  }, [activeFile, editorContent, updateFileContent])

  const handleTriggerBuild = useCallback(async () => {
    await triggerBuild()
  }, [triggerBuild])

  const handleCreateFile = useCallback(async (path: string, isFolder: boolean) => {
    try {
      if (isFolder) {
        setFolders((prev) => [...prev, path])
        toast.success(`Folder "${path}" created! 📁`)
      } else {
        const result = await createFile(path, isFolder)
        if (result.success && result.file) {
          openFile(result.file)
        }
      }
    } catch (error: any) {
      console.error('Failed to create:', error)
      toast.error('Failed to create file')
    }
  }, [createFile, openFile])

  const handleFileSelect = useCallback((file: ProjectFile) => {
    openFile(file)
  }, [openFile])

  const handleTabClose = useCallback((fileId: string) => {
    closeFile(fileId)
  }, [closeFile])

  const handleFolderDelete = useCallback((folderPath: string) => {
    setFolders((prev) => prev.filter((f) => f !== folderPath && !f.startsWith(folderPath + '/')))
  }, [])

  const handleFolderRename = useCallback((oldPath: string, newPath: string) => {
    const normalizeStoragePath = (path: string) => path.replace(/^\/+/, '')
    const normalizedOldPath = normalizeStoragePath(oldPath)
    const normalizedNewPath = normalizeStoragePath(newPath)
    
    setFolders((prev) => {
      return prev.map(f => {
        if (f === normalizedOldPath) {
          return normalizedNewPath
        }
        if (f.startsWith(normalizedOldPath + '/')) {
          return f.replace(normalizedOldPath, normalizedNewPath)
        }
        return f
      })
    })
    
    toast.success('Folder renamed successfully! ✏️')
  }, [])

  const handleCursorChange = useCallback((position: { lineNumber: number; column: number }) => {
    setCursorPosition({
      line: position.lineNumber,
      column: position.column,
    })
    
    if (activeFile && yDoc && yProvider) {
      collaborationService.updateCursor(projectId, activeFile.id, {
        line: position.lineNumber,
        column: position.column,
      })
    }
  }, [activeFile, projectId, yDoc, yProvider, setCursorPosition])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7B2FF7] animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0C0C1E]">
      <EditorHeader
        project={project}
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isConnected={isConnected}
        activeUsersCount={activeUsers.size}
        onSave={handleSave}
        onSync={sync}
        onCollaborate={openCollabPanel}
      />

      <div className="flex-grow flex overflow-hidden">
        <Sidebar 
          activePage={sidebarPage}
          onPageChange={setSidebarPage}
        />

        {sidebarPage === 'explorer' && (
          <FileTree
            files={currentFiles}
            folders={allFolders}
            activeFileId={activeFile?.id || null}
            onFileSelect={handleFileSelect}
            onFileCreate={openCreateModal}
            onFolderCreate={openCreateModal}
            onCreate={handleCreateFile}
            onFileDelete={deleteFile}
            onFolderDelete={handleFolderDelete}
            onFolderRename={handleFolderRename}
            onFileRename={renameFile}
            onFileMove={moveFile}
            onFileDuplicate={duplicateFile}
          />
        )}

        <EditorMain
          openFiles={openFiles}
          activeFile={activeFile}
          onTabSelect={(fileId) => {
            const file = openFiles.find((f) => f.id === fileId)
            if (file) setActiveFile(file)
          }}
          onTabClose={handleTabClose}
          onTabReorder={reorderTabs}
          onCodeChange={handleCodeChange}
          onSave={handleSave}
          yDoc={yDoc}
          yProvider={yProvider}
          cursorPosition={cursorPosition}
          selectedCount={selectedCount}
          isOnline={isOnline}
          pendingSync={pendingCount}
          onCursorChange={handleCursorChange}
          onSelectionChange={setSelectedCount}
        />

        <div className="h-64 min-h-64 max-h-64 flex-shrink-0 overflow-hidden">
          <BuildPanel
            projectId={projectId}
            currentBuild={currentBuild}
            onTriggerBuild={handleTriggerBuild}
          />
        </div>

        <div className="w-96 flex-shrink-0">
          <AIPanel
            code={activeFile?.content || ''}
            language={activeFile?.language || 'rust'}
            onApplySuggestion={(code) => {
              if (activeFile) {
                handleCodeChange(activeFile.content + '\n' + code)
              }
            }}
          />
        </div>
      </div>

      <CollaborationPanel
        isOpen={showCollabPanel}
        onClose={closeCollabPanel}
      />

      <CreateFileModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        onCreate={handleCreateFile}
        existingPaths={currentFiles.map((f) => f.path)}
      />
    </div>
  )
}

/**
 * Main Editor Page Component (provides context)
 */
export default function EditorPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <EditorErrorBoundary>
      <EditorProvider projectId={projectId}>
        <EditorContent />
      </EditorProvider>
    </EditorErrorBoundary>
  )
}
