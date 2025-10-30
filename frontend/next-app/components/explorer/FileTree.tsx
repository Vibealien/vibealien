'use client'

import React, { useState, useEffect } from 'react'
import { explorerService } from '@/lib/services'

interface FileTreeNode {
  path: string
  name: string
  type: 'file' | 'dir'
  children?: FileTreeNode[]
}

export const FileTree: React.FC = () => {
  const [files, setFiles] = useState<FileTreeNode[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [activeFile, setActiveFile] = useState<string | null>(null)

  useEffect(() => {
    const loadFiles = async () => {
      await explorerService.init()
      setFiles(explorerService.getFiles() as any)
    }

    loadFiles()

    // Subscribe to explorer events
    const unsubscribeInit = explorerService.on(explorerService.events.INIT, () => {
      setFiles(explorerService.getFiles() as any)
    })

    const unsubscribeCreate = explorerService.on(explorerService.events.CREATE_ITEM, () => {
      setFiles(explorerService.getFiles() as any)
    })

    const unsubscribeDelete = explorerService.on(explorerService.events.DELETE_ITEM, () => {
      setFiles(explorerService.getFiles() as any)
    })

    const unsubscribeOpen = explorerService.on(explorerService.events.OPEN_FILE, ({ path }) => {
      setActiveFile(path)
    })

    return () => {
      unsubscribeInit()
      unsubscribeCreate()
      unsubscribeDelete()
      unsubscribeOpen()
    }
  }, [])

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleFileClick = async (node: FileTreeNode) => {
    if (node.type === 'dir') {
      toggleDir(node.path)
    } else {
      await explorerService.openFile(node.path)
    }
  }

  const renderNode = (node: FileTreeNode, level: number = 0) => {
    const isExpanded = expandedDirs.has(node.path)
    const isActive = activeFile === node.path
    const indent = level * 16

    return (
      <div key={node.path}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-800 ${
            isActive ? 'bg-purple-900/30 text-purple-400' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'dir' && (
            <span className="mr-1 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className={node.type === 'dir' ? 'font-semibold' : ''}>
            {node.name}
          </span>
        </div>
        
        {node.type === 'dir' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0C0C1E] text-white">
      <div className="p-2 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-purple-400">Explorer</h3>
      </div>
      <div className="text-sm">
        {files.map(node => renderNode(node))}
      </div>
    </div>
  )
}
