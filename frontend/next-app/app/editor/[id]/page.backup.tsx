'use client';

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Users, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useProjectStore } from '@/lib/stores/useProjectStore'
import { useCollaborationStore } from '@/lib/stores/useCollaborationStore'
import { useOfflineStorage } from '@/lib/hooks/useOfflineStorage'
import { projectsApi } from '@/lib/api/projects'
import { CollaborativeCodeEditor } from '@/components/editor/CollaborativeCodeEditor'
import { CollaborationPanel } from '@/components/editor/CollaborationPanel'
import { collaborationService } from '@/lib/services/collaboration.service'
import { editorService } from '@/lib/services'
import { FileTree } from '@/components/editor/FileTree'
import { EditorTabs } from '@/components/editor/EditorTabs'
import { StatusBar } from '@/components/editor/StatusBar'
import { AIPanel } from '@/components/editor/AIPanel'
import { BuildPanel } from '@/components/editor/BuildPanel'
import { CreateFileModal } from '@/components/editor/CreateFileModal'
import { Sidebar } from '@/components/editor/Sidebar'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { initializeEditor } from '@/lib/editor-init'
import type { ProjectFile, Build } from '@/lib/types'
import type * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const { isAuthenticated, token, user, _hasHydrated } = useAuthStore()
  const {
    currentProject,
    currentFiles,
    activeFile,
    setCurrentProject,
    setCurrentFiles,
    setActiveFile,
    updateFile,
  } = useProjectStore()
  
  const {
    isConnected,
    activeUsers,
    setConnected,
    addUser,
    removeUser,
    updateUserCursor,
    clearSession,
  } = useCollaborationStore()

  // Offline storage hook
  const { 
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
  } = useOfflineStorage()

  const [openFiles, setOpenFiles] = useState<ProjectFile[]>([])
  const [folders, setFolders] = useState<string[]>([]) // Track empty folders
  const [currentBuild, setCurrentBuild] = useState<Build | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sidebarPage, setSidebarPage] = useState<'explorer' | 'build' | 'settings'>('explorer')
  
  // Compute all folders (explicit empty + implicit from file paths)
  const allFolders = React.useMemo(() => {
    const folderSet = new Set<string>(folders)
    
    // Add implicit folders from file paths
    currentFiles.forEach(file => {
      const pathParts = file.path.split('/')
      pathParts.pop() // Remove filename
      
      // Add all parent folders
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
  
  // Collaboration state
  const [showCollabPanel, setShowCollabPanel] = useState(false) 
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
  const [yProvider, setYProvider] = useState<WebsocketProvider | null>(null)
  
  // Cursor/Status bar tracking
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [selectedCount, setSelectedCount] = useState(0)

  // Keep open tabs in sync with the canonical project file state so edits persist across tab switches
  useEffect(() => {
    setOpenFiles((prev) =>
      prev.map((tab) => currentFiles.find((file) => file.id === tab.id) ?? tab)
    )
  }, [currentFiles])

  // Redirect if not authenticated (only after hydration)
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/')
      toast.error('Please connect your wallet')
    }
  }, [isAuthenticated, _hasHydrated, router])

  // Initialize editor services (file system, workspace, commands)
  useEffect(() => {
    if (projectId) {
      initializeEditor(projectId).catch(error => {
        console.error('Failed to initialize editor:', error)
        // Non-critical - editor can still work with existing functionality
      })
    }
  }, [projectId])

  // Load project and files
  useEffect(() => {
    if (isAuthenticated && token && projectId) {
      loadProject()
    }
  }, [isAuthenticated, token, projectId])

  // Initialize editor service with files
  useEffect(() => {
    if (currentFiles.length > 0) {
      editorService.loadFiles(currentFiles)
      // Re-cache files whenever they change
      cacheFiles(currentFiles).catch(err => {
        console.error('Failed to cache files:', err)
      })
    }
  }, [currentFiles, cacheFiles])

  // Listen to editor service events
  useEffect(() => {
    // Silent auto-save listener (no toast)
    const unsubscribeAutoSave = editorService.on('editor:file:autosave', async (fileId: string, content: string) => {
      const file = currentFiles.find(f => f.id === fileId)
      if (!file) return

      try {
        // Save to IndexedDB silently (no toast)
        await saveOffline(projectId, fileId, file.path, content, file.language)
        
        // Attempt server sync asynchronously in background
        if (isOnline && token) {
          projectsApi.updateFile(token, projectId, fileId, { content })
            .catch(err => {
              console.log('[AutoSave] Server sync failed, will retry later:', err)
              // Silently fail - already saved locally
            })
        }
      } catch (error) {
        console.error('[AutoSave] Failed to save locally:', error)
      }
    })

    // Manual save event listener (original behavior with toast)
    const unsubscribeSave = editorService.on('editor:file:save', (fileId: string, content: string) => {
      handleAutoSave(fileId, content)
    })

    return () => {
      unsubscribeAutoSave()
      unsubscribeSave()
    }
  }, [projectId, token, isOnline, saveOffline, currentFiles])
  
  // Connect to collaboration service when file is opened
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
          // Handle presence updates
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
          
          // Remove users who left
          activeUsers.forEach((_, userId) => {
            if (!currentUsers.has(userId)) {
              removeUser(userId)
            }
          })
        }
      )
      
      setYDoc(doc)
      setYProvider(provider)
      
      // Set local user info
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
  }, [activeFile, token, user, projectId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges && !isSaving) {
          handleSave()
        }
      }
      
      // Ctrl/Cmd + N to create new file
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowCreateModal(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges, isSaving])

  const loadProject = async () => {
    if (!token) return

    try {
      // Try to load from server
      let files: any[] = []
      let project: any = null

      if (isOnline) {
        // Load from server when online
        [project, files] = await Promise.all([
          projectsApi.getProject(token, projectId),
          projectsApi.getFiles(token, projectId),
        ])

        // Cache files for offline access
        await cacheFiles(files)
      } else {
        // Load from cache when offline
        files = await getCachedFiles(projectId)
        toast('📂 Loaded from offline cache')
      }

      // Apply any pending changes (edits made offline)
      files = await applyPendingChanges(files)

      setCurrentProject(project)
      setCurrentFiles(files)

      // Open first file by default
      if (files.length > 0 && !activeFile) {
        handleFileSelect(files[0])
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      
      // Try to load from cache as fallback
      try {
        const cachedFiles = await getCachedFiles(projectId)
        if (cachedFiles.length > 0) {
          const filesWithChanges = await applyPendingChanges(cachedFiles)
          setCurrentFiles(filesWithChanges)
          toast.success('📂 Loaded from offline cache')
          
          if (filesWithChanges.length > 0 && !activeFile) {
            handleFileSelect(filesWithChanges[0])
          }
          return
        }
      } catch (cacheError) {
        console.error('Failed to load from cache:', cacheError)
      }
      
      toast.error('Failed to load project')
      router.push('/dashboard')
    }
  }

  const handleFileSelect = (file: ProjectFile) => {
    const upToDateFile = currentFiles.find((f) => f.id === file.id) ?? file
    setActiveFile(upToDateFile)
    
    // Add to open files if not already open
    if (!openFiles.find((f) => f.id === file.id)) {
      setOpenFiles([...openFiles, upToDateFile])
    }
  }

  const handleTabClose = (fileId: string) => {
    const newOpenFiles = openFiles.filter((f) => f.id !== fileId)
    setOpenFiles(newOpenFiles)

    // If closing active file, switch to another
    if (activeFile?.id === fileId && newOpenFiles.length > 0) {
      setActiveFile(newOpenFiles[newOpenFiles.length - 1])
    } else if (newOpenFiles.length === 0) {
      setActiveFile(null)
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return
    
    updateFile(activeFile.id, { content: value })
    setHasUnsavedChanges(true)
  }

  const handleAutoSave = async (fileId: string, content: string) => {
    // Auto-save triggered by editor service
    try {
      await saveOffline(projectId, fileId, activeFile?.path || '', content, activeFile?.language || 'rust')

      if (isOnline && token) {
        try {
          await projectsApi.updateFile(token, projectId, fileId, { content })
        } catch (error) {
          console.error('Auto-save to server failed:', error)
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  const handleSave = async () => {
    if (!activeFile) return

    setIsSaving(true)
    try {
      // Always save to IndexedDB first (works offline)
      await saveOffline(
        projectId,
        activeFile.id,
        activeFile.path,
        activeFile.content,
        activeFile.language
      )

      // If online, also try to save to server immediately
      if (isOnline && token) {
        try {
          await projectsApi.updateFile(token, projectId, activeFile.id, {
            content: activeFile.content,
          })
          toast.success('File saved! 💾')
        } catch (error) {
          console.error('Failed to save to server:', error)
          toast('⚠️ Saved locally - will sync when connection improves', {
            icon: '💾',
          })
        }
      } else {
        toast.success('💾 Saved locally (offline)')
      }
      
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save file:', error)
      toast.error('Failed to save file')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTriggerBuild = async () => {
    if (!token) return

    try {
      const build = await projectsApi.triggerBuild(token, projectId)
      setCurrentBuild(build)
      toast.success('Build started! 🚀')
      
      // Poll for build status (in real app, use WebSocket)
      pollBuildStatus(build.id)
    } catch (error) {
      console.error('Failed to trigger build:', error)
      toast.error('Failed to start build')
    }
  }

  const pollBuildStatus = async (buildId: string) => {
    if (!token) return

    const interval = setInterval(async () => {
      try {
        const build = await projectsApi.getBuild(token, projectId, buildId)
        setCurrentBuild(build)

        if (build.status === 'SUCCESS' || build.status === 'FAILED') {
          clearInterval(interval)
          if (build.status === 'SUCCESS') {
            toast.success('Build completed! ✅')
          } else {
            toast.error('Build failed ❌')
          }
        }
      } catch (error) {
        clearInterval(interval)
      }
    }, 2000)
  }

  const handleCreateFile = async (path: string, isFolder: boolean) => {
    try {
      if (isFolder) {
        // Just track the folder path - no .gitkeep file needed
        setFolders((prev) => [...prev, path])
        toast.success(`Folder "${path}" created! 📁`)
      } else {
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

        // Get template content based on file type
        const templateContent = getFileTemplate(path, language)

        // Generate temp ID
        const tempId = `temp-${Date.now()}`
        const tempFile: ProjectFile = {
          id: tempId,
          projectId,
          path,
          content: templateContent,
          language,
          size: templateContent.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Add to current files and open it immediately
        setCurrentFiles([...currentFiles, tempFile])
        handleFileSelect(tempFile)

        // Save to offline storage
        await saveCreateOffline(projectId, tempId, path, templateContent, language)

        // If online, create on server
        if (isOnline && token) {
          try {
            const file = await projectsApi.createFile(token, projectId, {
              path,
              content: templateContent,
              language,
            })

            // Replace temp with real file
            setCurrentFiles((prev) =>
              prev.map((f) => (f.id === tempId ? file : f))
            )

            // Update active file if it's the created one
            if (activeFile?.id === tempId) {
              setActiveFile(file)
            }

            // Update open files
            setOpenFiles((prev) =>
              prev.map((f) => (f.id === tempId ? file : f))
            )
            
            toast.success('File created! 📄')
          } catch (error) {
            console.error('Failed to create file on server:', error)
            toast('⚠️ File saved locally - will sync when online', { icon: '💾' })
          }
        } else {
          toast.success('📄 File saved locally (offline)')
        }
      }
    } catch (error: any) {
      console.error('Failed to create:', error)
      toast.error('Failed to create file')
    }
  }

  const handleRenameFile = async (fileId: string, newPath: string) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) return

    // Check if path already exists
    if (currentFiles.some((f) => f.path === newPath && f.id !== fileId)) {
      toast.error('A file with this path already exists')
      return
    }

    try {
      // Save to offline storage first
      await saveRenameOffline(projectId, fileId, file.path, newPath)

      // Update local state immediately (optimistic update)
      const updatedFiles = currentFiles.map((f) =>
        f.id === fileId ? { ...f, path: newPath } : f
      )
      setCurrentFiles(updatedFiles)

      // Update active file if it's the renamed one
      if (activeFile?.id === fileId) {
        setActiveFile({ ...activeFile, path: newPath })
      }

      // Update open files
      setOpenFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, path: newPath } : f))
      )

      // If online, try to rename on server
      if (isOnline && token) {
        try {
          await projectsApi.updateFile(token, projectId, fileId, {
            path: newPath,
          })
          toast.success('File renamed successfully! ✏️')
        } catch (error) {
          console.error('Failed to rename on server:', error)
          toast('⚠️ Rename saved locally - will sync when online', { icon: '💾' })
        }
      } else {
        toast.success('✏️ Rename saved locally (offline)')
      }
    } catch (error) {
      console.error('Failed to rename file:', error)
      toast.error('Failed to rename file')
    }
  }

  const handleFileMove = async (fileId: string, newPath: string) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) return

    // Check if path already exists
    if (currentFiles.some((f) => f.path === newPath && f.id !== fileId)) {
      toast.error('A file with this path already exists')
      return
    }

    try {
      // Save to offline storage first
      await saveMoveOffline(projectId, fileId, file.path, newPath)

      // Update local state immediately (optimistic update)
      const updatedFiles = currentFiles.map((f) =>
        f.id === fileId ? { ...f, path: newPath } : f
      )
      setCurrentFiles(updatedFiles)

      // Update active file if it's the moved one
      if (activeFile?.id === fileId) {
        setActiveFile({ ...activeFile, path: newPath })
      }

      // Update open files
      setOpenFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, path: newPath } : f))
      )

      // If online, try to move on server
      if (isOnline && token) {
        try {
          await projectsApi.updateFile(token, projectId, fileId, {
            path: newPath,
          })
          toast.success('File moved successfully! 📁')
        } catch (error) {
          console.error('Failed to move on server:', error)
          toast('⚠️ Move saved locally - will sync when online', { icon: '💾' })
        }
      } else {
        toast.success('📁 Move saved locally (offline)')
      }
    } catch (error) {
      console.error('Failed to move file:', error)
      toast.error('Failed to move file')
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) return

    try {
      // Save to offline storage first
      await saveDeleteOffline(projectId, fileId, file.path)

      // Update local state immediately (optimistic update)
      setCurrentFiles((prev) => prev.filter((f) => f.id !== fileId))

      // Close tab if it's open
      setOpenFiles((prev) => {
        const newOpen = prev.filter((f) => f.id !== fileId)
        // If we closed the active file, switch to another
        if (activeFile?.id === fileId && newOpen.length > 0) {
          setActiveFile(newOpen[newOpen.length - 1])
        } else if (newOpen.length === 0) {
          setActiveFile(null)
        }
        return newOpen
      })

      // If online, try to delete on server
      if (isOnline && token) {
        try {
          await projectsApi.deleteFile(token, projectId, fileId)
          toast.success('File deleted! 🗑️')
        } catch (error) {
          console.error('Failed to delete on server:', error)
          toast('⚠️ Delete saved locally - will sync when online', { icon: '💾' })
        }
      } else {
        toast.success('🗑️ Delete saved locally (offline)')
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      toast.error('Failed to delete file')
    }
  }

  const handleFolderDelete = (folderPath: string) => {
    // Remove from folders array
    setFolders((prev) => prev.filter((f) => f !== folderPath && !f.startsWith(folderPath + '/')))
  }

  const handleFolderRename = (oldPath: string, newPath: string) => {
    // Normalize paths - remove leading slashes for storage
    const normalizeStoragePath = (path: string) => path.replace(/^\/+/, '')
    const normalizedOldPath = normalizeStoragePath(oldPath)
    const normalizedNewPath = normalizeStoragePath(newPath)
    
    console.log('Renaming folder:', { oldPath, newPath, normalizedOldPath, normalizedNewPath, currentFolders: folders, allFolders })
    
    // Update folder in the explicit folders array (empty folders)
    setFolders((prev) => {
      const updated = prev.map(f => {
        // Exact match - rename the folder itself
        if (f === normalizedOldPath) {
          return normalizedNewPath
        }
        // Subfolder - update its path
        if (f.startsWith(normalizedOldPath + '/')) {
          return f.replace(normalizedOldPath, normalizedNewPath)
        }
        return f
      })
      
      console.log('Updated folders:', updated)
      return updated
    })
    
    toast.success('Folder renamed successfully! ✏️')
  }

  const handleFileDuplicate = async (fileId: string) => {
    const file = currentFiles.find((f) => f.id === fileId)
    if (!file) return

    try {
      // Generate new path
      const pathParts = file.path.split('/')
      const fileName = pathParts.pop() || ''
      const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : ''
      const baseName = fileName.replace(ext, '')
      const newFileName = `${baseName}_copy${ext}`
      const newPath = pathParts.length > 0 
        ? `${pathParts.join('/')}/${newFileName}`
        : newFileName

      // Generate temp ID
      const tempId = `temp-${Date.now()}`
      const tempFile: ProjectFile = {
        ...file,
        id: tempId,
        path: newPath,
        size: file.content.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Add to local state immediately (optimistic update)
      setCurrentFiles([...currentFiles, tempFile])

      // Save to offline storage
      await saveCreateOffline(projectId, tempId, newPath, file.content, file.language)

      // If online, create on server
      if (isOnline && token) {
        try {
          const newFile = await projectsApi.createFile(token, projectId, {
            path: newPath,
            content: file.content,
            language: file.language,
          })

          // Replace temp file with real one
          setCurrentFiles((prev) =>
            prev.map((f) => (f.id === tempId ? newFile : f))
          )
          
          toast.success('File duplicated successfully! 📋')
        } catch (error) {
          console.error('Failed to duplicate on server:', error)
          toast('⚠️ Duplicate saved locally - will sync when online', { icon: '💾' })
        }
      } else {
        toast.success('📋 Duplicate saved locally (offline)')
      }
    } catch (error) {
      console.error('Failed to duplicate file:', error)
      toast.error('Failed to duplicate file')
    }
  }

  const getFileTemplate = (path: string, language: string): string => {
    const filename = path.split('/').pop() || ''
    
    if (filename === 'Cargo.toml') {
      return `[package]
name = "${currentProject?.name || 'my-project'}"
version = "0.1.0"
edition = "2021"

[dependencies]
`
    }
    
    if (filename === 'lib.rs') {
      return `// ${currentProject?.name || 'Library'} - Main library file

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
`
    }
    
    if (filename === 'main.rs') {
      return `// ${currentProject?.name || 'Project'} - Main entry point

fn main() {
    println!("Hello, Solana! 🚀");
}
`
    }
    
    if (filename === 'README.md') {
      return `# ${currentProject?.name || 'Project'}

${currentProject?.description || 'A Solana smart contract project'}

## Building

\`\`\`bash
cargo build-bpf
\`\`\`

## Testing

\`\`\`bash
cargo test
\`\`\`
`
    }
    
    return '' // Empty content for other files
  }

  if (!isAuthenticated || !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7B2FF7] animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0C0C1E]">
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#7B2FF7]/20 bg-[#0C0C1E]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="font-['Orbitron'] font-bold text-white">
              {currentProject.name}
            </h1>
            {currentProject.description && (
              <p className="text-xs text-white/40 font-['Inter']">
                {currentProject.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline/Sync Status */}
          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-yellow-500/20 border border-yellow-500/50">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-xs text-yellow-300 font-['Inter']">Offline Mode</span>
            </div>
          )}
          
          {pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={sync}
              disabled={!isOnline || isSyncing}
              className="border-[#00FFA3]/50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <span className="text-[#00FFA3] mr-1">↻</span>
                  Sync ({pendingCount})
                </>
              )}
            </Button>
          )}
          
          {hasUnsavedChanges && (
            <span className="text-xs text-[#00FFA3] font-['Inter']">Unsaved changes</span>
          )}
          
          <Button
            variant="cosmic"
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                Save
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCollabPanel(true)}
            className={isConnected ? 'border-[#00FFA3]/50' : ''}
          >
            <Users className={`w-3 h-3 mr-1 ${isConnected ? 'text-[#00FFA3]' : ''}`} />
            Collaborate {activeUsers.size > 0 && `(${activeUsers.size})`}
          </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex-grow flex overflow-hidden">
        {/* Left Sidebar - Vertical Icons */}
        <Sidebar 
          activePage={sidebarPage}
          onPageChange={setSidebarPage}
        />

        {/* File Tree - Shown when explorer is active */}
        {sidebarPage === 'explorer' && (
          <FileTree
            files={currentFiles}
            folders={allFolders}
            activeFileId={activeFile?.id || null}
            onFileSelect={handleFileSelect}
            onFileCreate={() => setShowCreateModal(true)}
            onFolderCreate={() => setShowCreateModal(true)}
            onCreate={handleCreateFile}
            onFileDelete={handleDeleteFile}
            onFolderDelete={handleFolderDelete}
            onFolderRename={handleFolderRename}
            onFileRename={handleRenameFile}
            onFileMove={handleFileMove}
            onFileDuplicate={handleFileDuplicate}
          />
        )}

        {/* Main Editor - 50% */}
        <div className="flex-grow flex flex-col mt-0">
          <EditorTabs
            files={openFiles}
            activeFileId={activeFile?.id || null}
            onTabSelect={(fileId) => {
              const file = openFiles.find((f) => f.id === fileId)
              if (file) setActiveFile(file)
            }}
            onTabClose={handleTabClose}
            onTabReorder={setOpenFiles}
          />
          
          <div className="flex-grow">
            {activeFile ? (
              <CollaborativeCodeEditor
                fileId={activeFile.id}
                filePath={activeFile.path}
                value={activeFile.content}
                language={activeFile.language}
                onChange={handleCodeChange}
                onSave={handleSave}
                yDoc={yDoc}
                yProvider={yProvider}
                onCursorChange={(position) => {
                  // Update local cursor state for status bar
                  setCursorPosition({
                    line: position.lineNumber,
                    column: position.column,
                  })
                  
                  // Broadcast cursor to other users
                  if (activeFile && yDoc && yProvider) {
                    collaborationService.updateCursor(projectId, activeFile.id, {
                      line: position.lineNumber,
                      column: position.column,
                    })
                  }
                }}
                onSelectionChange={(selectionLength) => {
                  setSelectedCount(selectionLength)
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/40 font-['Inter']">Select a file to start coding</p>
              </div>
            )}
          </div>

          {/* Status Bar */}
          {activeFile && (
            <StatusBar
              line={cursorPosition.line}
              column={cursorPosition.column}
              language={activeFile.language}
              totalLines={activeFile.content ? activeFile.content.split('\n').length : 0}
              selectedCount={selectedCount > 0 ? selectedCount : undefined}
              encoding="UTF-8"
              lineEnding="LF"
              isOnline={isOnline}
              pendingSync={pendingCount}
            />
          )}

          {/* Build Panel - Bottom 30% */}
          <div className="h-64 min-h-64 max-h-64 flex-shrink-0 overflow-hidden">
            <BuildPanel
              projectId={projectId}
              currentBuild={currentBuild}
              onTriggerBuild={handleTriggerBuild}
            />
          </div>
        </div>

        {/* AI Panel - 30% */}
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
      
      {/* Collaboration Panel */}
      <CollaborationPanel
        isOpen={showCollabPanel}
        onClose={() => setShowCollabPanel(false)}
      />

      {/* Create File/Folder Modal */}
      <CreateFileModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateFile}
        existingPaths={currentFiles.map((f) => f.path)}
      />
    </div>
  )
}
