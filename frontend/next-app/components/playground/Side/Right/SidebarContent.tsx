/**
 * Sidebar Content - Right side content area
 * Shows different content based on active page
 */

'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useEditor } from '@/lib/contexts/EditorContext'
import { FileTree } from '@/components/editor/FileTree'
import type { SidebarPage } from '../SidePanel'

interface SidebarContentProps {
  page: SidebarPage
  width: number
  onWidthChange: (width: number) => void
}

const MIN_WIDTH = 200
const MAX_WIDTH = 600

export function SidebarContent({ page, width, onWidthChange }: SidebarContentProps) {
  const {
    files,
    activeFile,
    openFile,
    deleteFile,
    renameFile,
    moveFile,
    duplicateFile,
    openCreateModal,
  } = useEditor()

  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(width)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
    
    e.preventDefault()
  }, [width])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const delta = e.clientX - startXRef.current
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + delta))
    onWidthChange(newWidth)
  }, [isDragging, onWidthChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div 
      className="relative bg-[#0C0C1E] border-r border-[#7B2FF7]/20 flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      {/* Content based on active page */}
      <div className="h-full overflow-hidden">
        {page === 'explorer' && (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[#7B2FF7]/20">
              <h2 className="text-sm font-['Orbitron'] font-semibold text-white uppercase tracking-wide">
                Explorer
              </h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <FileTree
                files={files}
                folders={[]} // Will be computed from files
                activeFileId={activeFile?.id || null}
                onFileSelect={(file) => openFile(file)}
                onFileCreate={openCreateModal}
                onFolderCreate={openCreateModal}
                onCreate={async () => {}}
                onFileDelete={deleteFile}
                onFolderDelete={() => {}}
                onFolderRename={() => {}}
                onFileRename={renameFile}
                onFileMove={moveFile}
                onFileDuplicate={duplicateFile}
              />
            </div>
          </div>
        )}

        {page === 'terminal' && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/40 text-sm font-['Inter']">
              Terminal view (coming soon)
            </p>
          </div>
        )}

        {page === 'settings' && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/40 text-sm font-['Inter']">
              Settings view (coming soon)
            </p>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className={`
          absolute top-0 right-0 w-1 h-full cursor-col-resize
          hover:bg-[#7B2FF7]/50 transition-colors
          ${isDragging ? 'bg-[#7B2FF7]' : 'bg-transparent'}
        `}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
