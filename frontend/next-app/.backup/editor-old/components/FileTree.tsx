'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileCode, 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit, 
  FolderPlus, 
  FilePlus,
  Copy, 
  X, 
  Check,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'
import type { ProjectFile } from '@/lib/types'

interface FileTreeProps {
  files: ProjectFile[]
  folders?: string[] // Track empty folders
  activeFileId: string | null
  onFileSelect: (file: ProjectFile) => void
  onFileCreate?: () => void
  onFolderCreate?: () => void
  onCreate?: (path: string, isFolder: boolean) => Promise<void>
  onFileDelete?: (fileId: string) => void
  onFolderDelete?: (folderPath: string) => void
  onFolderRename?: (oldPath: string, newPath: string) => void
  onFileRename?: (fileId: string, newPath: string) => void
  onFileMove?: (fileId: string, newPath: string) => void
  onFileDuplicate?: (fileId: string) => void
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  file?: ProjectFile
  children: TreeNode[]
  level: number
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  folders = [],
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFolderCreate,
  onCreate,
  onFileDelete,
  onFolderDelete,
  onFolderRename,
  onFileRename,
  onFileMove,
  onFileDuplicate,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))
  const [draggedFile, setDraggedFile] = useState<ProjectFile | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const [renamingFile, setRenamingFile] = useState<string | null>(null)
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: TreeNode
  } | null>(null)
  const [showCreateInput, setShowCreateInput] = useState<{
    parentPath: string
    type: 'file' | 'folder'
  } | null>(null)
  const [createInputValue, setCreateInputValue] = useState('')

  // Build tree structure from flat file list
  const fileTree = useMemo(() => {
    const root: TreeNode = {
      name: '/',
      path: '/',
      type: 'folder',
      children: [],
      level: 0,
    }

    // Helper to find or create folder nodes
    const getOrCreateNode = (path: string): TreeNode => {
      if (path === '/' || path === '') return root

      const parts = path.split('/').filter(Boolean)
      let current = root

      parts.forEach((part, index) => {
        const currentPath = '/' + parts.slice(0, index + 1).join('/')
        let child = current.children.find((c) => c.path === currentPath)

        if (!child) {
          child = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
            level: index + 1,
          }
          current.children.push(child)
        }

        current = child
      })

      return current
    }

    // Add all empty folders first
    folders.forEach((folderPath) => {
      // Normalize folder path - ensure it has a leading slash for tree structure
      const normalizedPath = folderPath.startsWith('/') ? folderPath : '/' + folderPath
      getOrCreateNode(normalizedPath)
    })

    // Add all files to the tree
    files.forEach((file) => {
      const pathParts = file.path.split('/')
      const fileName = pathParts.pop() || file.path
      const folderPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/'

      const parentNode = getOrCreateNode(folderPath)
      
      parentNode.children.push({
        name: fileName,
        path: file.path,
        type: 'file',
        file,
        children: [],
        level: parentNode.level + 1,
      })
    })

    // Sort: folders first, then files, both alphabetically
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          sortNodes(node.children)
        }
      })
    }

    sortNodes(root.children)
    return root
  }, [files, folders])

  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderPath)) {
        next.delete(folderPath)
      } else {
        next.add(folderPath)
      }
      return next
    })
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, file: ProjectFile) => {
    setDraggedFile(file)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', file.id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolder(folderPath)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverFolder(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetFolderPath: string) => {
      e.preventDefault()
      setDragOverFolder(null)

      if (!draggedFile || !onFileMove) return

      const fileName = draggedFile.path.split('/').pop()!
      const newPath = targetFolderPath === '/' 
        ? fileName 
        : targetFolderPath.slice(1) + '/' + fileName

      if (newPath !== draggedFile.path) {
        onFileMove(draggedFile.id, newPath)
      }

      setDraggedFile(null)
    },
    [draggedFile, onFileMove]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedFile(null)
    setDragOverFolder(null)
  }, [])

  const startRename = useCallback((file: ProjectFile) => {
    setRenamingFile(file.id)
    setRenameValue(file.path.split('/').pop() || '')
  }, [])

  const cancelRename = useCallback(() => {
    setRenamingFile(null)
    setRenamingFolder(null)
    setRenameValue('')
  }, [])

  const confirmRename = useCallback(
    (file: ProjectFile) => {
      if (!renameValue.trim() || !onFileRename) {
        cancelRename()
        return
      }

      const pathParts = file.path.split('/')
      pathParts[pathParts.length - 1] = renameValue.trim()
      const newPath = pathParts.join('/')

      if (newPath !== file.path) {
        onFileRename(file.id, newPath)
      }

      cancelRename()
    },
    [renameValue, onFileRename, cancelRename]
  )

  const getFileIcon = (path: string) => {
    if (path.endsWith('.rs')) return '🦀'
    if (path.endsWith('.toml')) return '📦'
    if (path.endsWith('.md')) return '📝'
    if (path.endsWith('.json')) return '⚙️'
    if (path.endsWith('.js') || path.endsWith('.jsx')) return '🟨'
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return '🔷'
    if (path.endsWith('.py')) return '🐍'
    if (path.endsWith('.html')) return '🌐'
    if (path.endsWith('.css')) return '🎨'
    return '📄'
  }

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const startFolderRename = useCallback((folderPath: string) => {
    const folderName = folderPath.split('/').filter(Boolean).pop() || ''
    setRenamingFolder(folderPath)
    setRenameValue(folderName)
    closeContextMenu()
  }, [closeContextMenu])

  const confirmFolderRename = useCallback(
    (oldPath: string) => {
      if (!renameValue.trim()) {
        setRenamingFolder(null)
        setRenameValue('')
        return
      }

      const pathParts = oldPath.split('/').filter(Boolean)
      pathParts[pathParts.length - 1] = renameValue.trim()
      const newPath = '/' + pathParts.join('/')

      console.log('FileTree confirmFolderRename:', { oldPath, newPath, renameValue })

      if (newPath !== oldPath) {
        // Find all files in this folder and rename them
        const filesToRename = files.filter(f => f.path.startsWith(oldPath + '/'))
        
        console.log('Files to rename:', filesToRename.length)
        
        filesToRename.forEach(file => {
          const newFilePath = file.path.replace(oldPath, newPath)
          if (onFileRename) {
            onFileRename(file.id, newFilePath)
          }
        })

        // Update the folder itself
        if (onFolderRename) {
          console.log('Calling onFolderRename with:', oldPath, newPath)
          onFolderRename(oldPath, newPath)
        }
      }

      setRenamingFolder(null)
      setRenameValue('')
    },
    [renameValue, files, onFileRename, onFolderRename]
  )

  const handleCreateInFolder = useCallback((parentPath: string, type: 'file' | 'folder') => {
    setShowCreateInput({ parentPath, type })
    setCreateInputValue('')
    closeContextMenu()
    // Expand the folder if creating inside it
    if (!expandedFolders.has(parentPath)) {
      toggleFolder(parentPath)
    }
  }, [closeContextMenu, expandedFolders, toggleFolder])

  const handleDeleteFolder = useCallback((folderPath: string) => {
    if (!confirm(`Are you sure you want to delete the folder "${folderPath}" and all its contents?`)) {
      closeContextMenu()
      return
    }

    // Find all files in this folder
    const filesToDelete = files.filter(f => f.path.startsWith(folderPath + '/') || f.path === folderPath)
    
    // Delete all files in the folder
    filesToDelete.forEach(file => {
      if (onFileDelete) {
        onFileDelete(file.id)
      }
    })

    // Also remove the folder itself from the folders array
    if (onFolderDelete) {
      onFolderDelete(folderPath)
    }
    
    closeContextMenu()
  }, [files, onFileDelete, onFolderDelete, closeContextMenu])

  const handleRenameFolder = useCallback((node: TreeNode) => {
    startFolderRename(node.path)
  }, [startFolderRename])

  const confirmCreate = useCallback(async () => {
    if (!createInputValue.trim() || !showCreateInput || !onCreate) {
      setShowCreateInput(null)
      setCreateInputValue('')
      return
    }

    const { parentPath, type } = showCreateInput
    const fullPath = parentPath === '/' 
      ? createInputValue.trim()
      : `${parentPath}/${createInputValue.trim()}`.replace(/^\//, '')

    try {
      await onCreate(fullPath, type === 'folder')
      setShowCreateInput(null)
      setCreateInputValue('')
    } catch (error) {
      console.error('Failed to create file/folder:', error)
      // Keep the input open so user can try again or cancel
    }
  }, [createInputValue, showCreateInput, onCreate])

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => closeContextMenu()
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu, closeContextMenu])

  // Render tree node recursively
  const renderNode = (node: TreeNode): React.ReactNode => {
    if (node.type === 'file' && node.file) {
      return (
        <FileItem
          key={node.file.id}
          file={node.file}
          node={node}
          isActive={node.file.id === activeFileId}
          isDragging={draggedFile?.id === node.file.id}
          isRenaming={renamingFile === node.file.id}
          renameValue={renameValue}
          level={node.level}
          onSelect={() => onFileSelect(node.file!)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDelete={onFileDelete}
          onRename={() => startRename(node.file!)}
          onDuplicate={onFileDuplicate}
          onRenameChange={setRenameValue}
          onRenameConfirm={() => confirmRename(node.file!)}
          onRenameCancel={cancelRename}
          onContextMenu={handleContextMenu}
          icon={getFileIcon(node.file.path)}
        />
      )
    }

    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path)
      const isDragOver = dragOverFolder === node.path
      const isRenaming = renamingFolder === node.path

      if (isRenaming) {
        return (
          <div key={node.path}>
            <div
              style={{ paddingLeft: `${node.level * 16}px` }}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#1E1E3F]"
            >
              <Folder className="w-4 h-4 text-[#7B2FF7] flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmFolderRename(node.path)
                  } else if (e.key === 'Escape') {
                    setRenamingFolder(null)
                    setRenameValue('')
                  }
                }}
                onBlur={() => confirmFolderRename(node.path)}
                className="flex-grow bg-[#0C0C1E] text-white text-sm px-2 py-0.5 rounded border border-[#7B2FF7] focus:outline-none focus:border-[#00FFA3] font-['Inter']"
              />
              <button
                onClick={() => confirmFolderRename(node.path)}
                className="p-1 rounded hover:bg-[#00FFA3]/20 transition-colors"
              >
                <Check className="w-3 h-3 text-[#00FFA3]" />
              </button>
              <button
                onClick={() => {
                  setRenamingFolder(null)
                  setRenameValue('')
                }}
                className="p-1 rounded hover:bg-red-500/20 transition-colors"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        )
      }

      return (
        <div key={node.path}>
          <div
            style={{ paddingLeft: `${node.level * 16}px` }}
            onDragOver={(e) => handleDragOver(e, node.path)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors group ${
              isDragOver
                ? 'bg-[#7B2FF7]/30 border border-[#7B2FF7]'
                : 'hover:bg-[#1E1E3F]'
            }`}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-white/60 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />
            )}
            <Folder
              className={`w-4 h-4 flex-shrink-0 ${
                isExpanded ? 'text-[#7B2FF7]' : 'text-[#9D5FFF]'
              }`}
            />
            <span className="text-sm text-white/80 font-['Inter'] flex-grow truncate">
              {node.name}
            </span>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Inline create input */}
                {showCreateInput && showCreateInput.parentPath === node.path && (
                  <div
                    style={{ paddingLeft: `${(node.level + 1) * 16}px` }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#1E1E3F]"
                  >
                    {showCreateInput.type === 'folder' ? (
                      <Folder className="w-4 h-4 text-[#9D5FFF] flex-shrink-0" />
                    ) : (
                      <File className="w-4 h-4 text-white/60 flex-shrink-0" />
                    )}
                    <input
                      autoFocus
                      type="text"
                      value={createInputValue}
                      onChange={(e) => setCreateInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          confirmCreate()
                        } else if (e.key === 'Escape') {
                          setShowCreateInput(null)
                          setCreateInputValue('')
                        }
                      }}
                      onBlur={() => {
                        // Small delay to allow clicking the check button
                        setTimeout(() => {
                          if (showCreateInput) {
                            setShowCreateInput(null)
                            setCreateInputValue('')
                          }
                        }, 200)
                      }}
                      placeholder={showCreateInput.type === 'folder' ? 'folder name' : 'file.rs'}
                      className="flex-grow bg-[#0C0C1E] text-white text-sm px-2 py-0.5 rounded border border-[#7B2FF7] focus:outline-none focus:border-[#00FFA3] font-['Inter']"
                    />
                    <button
                      onClick={confirmCreate}
                      className="p-1 rounded hover:bg-[#00FFA3]/20 transition-colors"
                    >
                      <Check className="w-3 h-3 text-[#00FFA3]" />
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateInput(null)
                        setCreateInputValue('')
                      }}
                      className="p-1 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                )}
                {node.children.map((child) => renderNode(child))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    return null
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 48 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full bg-[#0C0C1E] border-r border-[#7B2FF7]/20 flex flex-col relative"
    >
      {/* Header */}
      <div className="h-14 px-3 border-b border-[#7B2FF7]/20 flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <FileCode className="w-5 h-5 text-[#7B2FF7]" />
            <span className="font-['Orbitron'] font-semibold text-white">Files</span>
          </motion.div>
        )}
        
        <div className="flex gap-1 ml-auto">
          {!isCollapsed && (
            <>
              {onCreate && (
                <>
                  <button
                    onClick={() => handleCreateInFolder('/', 'file')}
                    className="p-1.5 rounded hover:bg-[#7B2FF7]/20 transition-colors"
                    title="New File (Ctrl+N)"
                  >
                    <Plus className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleCreateInFolder('/', 'folder')}
                    className="p-1.5 rounded hover:bg-[#7B2FF7]/20 transition-colors"
                    title="New Folder"
                  >
                    <FolderPlus className="w-4 h-4 text-white/60" />
                  </button>
                </>
              )}
            </>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded hover:bg-[#7B2FF7]/20 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4 text-white/60" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-white/60" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-grow overflow-y-auto overflow-x-hidden p-2"
        >
          <div
            onDragOver={(e) => handleDragOver(e, '/')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, '/')}
            className={`min-h-full ${
              dragOverFolder === '/' ? 'bg-[#7B2FF7]/10 rounded' : ''
            }`}
          >
            {fileTree.children.length > 0 ? (
              <>
                {/* Inline create input at root */}
                {showCreateInput && showCreateInput.parentPath === '/' && (
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#1E1E3F] mb-1"
                  >
                    {showCreateInput.type === 'folder' ? (
                      <Folder className="w-4 h-4 text-[#9D5FFF] flex-shrink-0" />
                    ) : (
                      <File className="w-4 h-4 text-white/60 flex-shrink-0" />
                    )}
                    <input
                      autoFocus
                      type="text"
                      value={createInputValue}
                      onChange={(e) => setCreateInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          confirmCreate()
                        } else if (e.key === 'Escape') {
                          setShowCreateInput(null)
                          setCreateInputValue('')
                        }
                      }}
                      onBlur={() => {
                        // Small delay to allow clicking the check button
                        setTimeout(() => {
                          if (showCreateInput) {
                            setShowCreateInput(null)
                            setCreateInputValue('')
                          }
                        }, 200)
                      }}
                      placeholder={showCreateInput.type === 'folder' ? 'folder name' : 'file.rs'}
                      className="flex-grow bg-[#0C0C1E] text-white text-sm px-2 py-0.5 rounded border border-[#7B2FF7] focus:outline-none focus:border-[#00FFA3] font-['Inter']"
                    />
                    <button
                      onClick={confirmCreate}
                      className="p-1 rounded hover:bg-[#00FFA3]/20 transition-colors"
                    >
                      <Check className="w-3 h-3 text-[#00FFA3]" />
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateInput(null)
                        setCreateInputValue('')
                      }}
                      className="p-1 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                )}
                {fileTree.children.map((node) => renderNode(node))}
              </>
            ) : (
              <div className="p-4 text-center">
                <File className="w-8 h-8 mx-auto mb-2 text-white/20" />
                <p className="text-sm text-white/40 font-['Inter']">No files yet</p>
                {onFileCreate && (
                  <button
                    onClick={onFileCreate}
                    className="mt-2 text-xs text-[#7B2FF7] hover:text-[#00FFA3] transition-colors"
                  >
                    Create your first file
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 50,
            }}
            className="w-48 rounded-lg bg-[#1E1E3F] border border-[#7B2FF7]/30 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.node.type === 'folder' ? (
              <>
                <button
                  onClick={() => handleCreateInFolder(contextMenu.node.path, 'file')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
                >
                  <FilePlus className="w-3 h-3" />
                  New File
                </button>
                <button
                  onClick={() => handleCreateInFolder(contextMenu.node.path, 'folder')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
                >
                  <FolderPlus className="w-3 h-3" />
                  New Folder
                </button>
                <button
                  onClick={() => handleRenameFolder(contextMenu.node)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Rename
                </button>
                <div className="h-px bg-[#7B2FF7]/20 my-1" />
                <button
                  onClick={() => handleDeleteFolder(contextMenu.node.path)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Folder
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (contextMenu.node.file && onFileRename) {
                      startRename(contextMenu.node.file)
                    }
                    closeContextMenu()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    if (contextMenu.node.file && onFileDuplicate) {
                      onFileDuplicate(contextMenu.node.file.id)
                    }
                    closeContextMenu()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Duplicate
                </button>
                <div className="h-px bg-[#7B2FF7]/20 my-1" />
                <button
                  onClick={() => {
                    if (contextMenu.node.file && onFileDelete) {
                      onFileDelete(contextMenu.node.file.id)
                    }
                    closeContextMenu()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// File Item Component with Drag & Drop and Inline Rename
interface FileItemProps {
  file: ProjectFile
  isActive: boolean
  isDragging: boolean
  isRenaming: boolean
  renameValue: string
  level: number
  node: TreeNode
  onSelect: () => void
  onDragStart: (e: React.DragEvent, file: ProjectFile) => void
  onDragEnd: () => void
  onDelete?: (fileId: string) => void
  onRename?: () => void
  onDuplicate?: (fileId: string) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: () => void
  onRenameCancel: () => void
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void
  icon: string
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  isActive,
  isDragging,
  isRenaming,
  renameValue,
  level,
  node,
  onSelect,
  onDragStart,
  onDragEnd,
  onDelete,
  onRename,
  onDuplicate,
  onRenameChange,
  onRenameConfirm,
  onRenameCancel,
  onContextMenu,
  icon,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRenameConfirm()
    } else if (e.key === 'Escape') {
      onRenameCancel()
    }
  }

  if (isRenaming) {
    return (
      <div
        style={{ paddingLeft: `${level * 16}px` }}
        className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#1E1E3F]"
      >
        <span className="text-base">{icon}</span>
        <input
          ref={inputRef}
          type="text"
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onRenameConfirm}
          className="flex-grow bg-[#0C0C1E] text-white text-sm px-2 py-0.5 rounded border border-[#7B2FF7] focus:outline-none focus:border-[#00FFA3] font-['Inter']"
        />
        <button
          onClick={onRenameConfirm}
          className="p-1 rounded hover:bg-[#00FFA3]/20 transition-colors"
        >
          <Check className="w-3 h-3 text-[#00FFA3]" />
        </button>
        <button
          onClick={onRenameCancel}
          className="p-1 rounded hover:bg-red-500/20 transition-colors"
        >
          <X className="w-3 h-3 text-red-400" />
        </button>
      </div>
    )
  }

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        style={{ paddingLeft: `${level * 16}px` }}
        draggable
        onDragStart={(e) => onDragStart(e, file)}
        onDragEnd={onDragEnd}
        onClick={onSelect}
        onContextMenu={(e) => onContextMenu(e, node)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded transition-all cursor-move group ${
          isDragging
            ? 'opacity-50 cursor-grabbing'
            : isActive
            ? 'bg-[#7B2FF7]/20 text-white'
            : 'hover:bg-[#1E1E3F] text-white/70'
        }`}
      >
        <span className="text-base flex-shrink-0">{icon}</span>
        <span className="flex-grow text-left text-sm font-['Inter'] truncate">
          {file.path.split('/').pop()}
        </span>
        
        {(onDelete || onRename || onDuplicate) && !isDragging && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#7B2FF7]/30 transition-all flex-shrink-0"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute right-2 top-8 w-40 rounded-lg bg-[#1E1E3F] border border-[#7B2FF7]/30 shadow-xl z-30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {onRename && (
              <button
                onClick={() => {
                  onRename()
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
              >
                <Edit className="w-3 h-3" />
                Rename
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={() => {
                  onDuplicate(file.id)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
              >
                <Copy className="w-3 h-3" />
                Duplicate
              </button>
            )}
            {(onRename || onDuplicate) && onDelete && (
              <div className="h-px bg-[#7B2FF7]/20 my-1" />
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${file.path.split('/').pop()}?`)) {
                    onDelete(file.id)
                  }
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.div>
  )
}
