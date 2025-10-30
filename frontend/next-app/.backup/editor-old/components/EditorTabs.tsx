'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { X, Circle } from 'lucide-react'
import type { ProjectFile } from '@/lib/types'

interface EditorTabsProps {
  files: ProjectFile[]
  activeFileId: string | null
  onTabSelect: (fileId: string) => void
  onTabClose: (fileId: string) => void
  onTabReorder?: (newOrder: ProjectFile[]) => void
}

const getFileIcon = (path: string) => {
  const icons: { [key: string]: { icon: string; color: string } } = {
    '.rs': { icon: '🦀', color: '#CE422B' },
    '.toml': { icon: '📦', color: '#9C4221' },
    '.md': { icon: '📝', color: '#519ABA' },
    '.json': { icon: '{}', color: '#CBCB41' },
    '.js': { icon: 'JS', color: '#F7DF1E' },
    '.ts': { icon: 'TS', color: '#3178C6' },
    '.py': { icon: '🐍', color: '#3776AB' },
    '.c': { icon: 'C', color: '#A8B9CC' },
  }
  
  const ext = Object.keys(icons).find(e => path.endsWith(e))
  return ext ? icons[ext] : { icon: '📄', color: '#858585' }
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  files,
  activeFileId,
  onTabSelect,
  onTabClose,
  onTabReorder,
}) => {
  const [tabOrder, setTabOrder] = useState(files)

  React.useEffect(() => {
    setTabOrder(files)
  }, [files])

  const handleReorder = (newOrder: ProjectFile[]) => {
    setTabOrder(newOrder)
    onTabReorder?.(newOrder)
  }

  if (files.length === 0) return null

  return (
    <div className="flex items-center h-10 bg-[#1E1E3F] border-b border-[#2D2D4A] overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-[#3A3A5A] scrollbar-track-transparent hover:scrollbar-thumb-[#7B2FF7]/50 flex-shrink-0">
      <Reorder.Group
        axis="x"
        values={tabOrder}
        onReorder={handleReorder}
        className="flex items-center h-full"
      >
        <AnimatePresence mode="popLayout">
          {tabOrder.map((file) => {
            const { icon, color } = getFileIcon(file.path)
            const isActive = file.id === activeFileId
            
            return (
              <Reorder.Item
                key={file.id}
                value={file}
                className={`group relative flex items-center gap-2 px-3 h-full border-r border-[#2D2D4A] cursor-grab active:cursor-grabbing flex-shrink-0 min-w-[120px] max-w-[200px] ${
                  isActive
                    ? 'bg-[#0C0C1E] text-white'
                    : 'bg-[#1E1E3F] text-white/70 hover:bg-[#252545]'
                }`}
                onClick={() => onTabSelect(file.id)}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-[#7B2FF7]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* File Icon */}
                <span 
                  className="text-xs font-semibold flex-shrink-0"
                  style={{ color: isActive ? color : 'inherit' }}
                >
                  {icon}
                </span>

                {/* File Name */}
                <span className="text-[13px] font-['Inter'] truncate flex-grow">
                  {file.path.split('/').pop()}
                </span>

                {/* Modified Indicator (Dot) */}
                {/* Uncomment when you add modified tracking
                {file.isModified && (
                  <Circle className="w-2 h-2 fill-[#00FFA3] text-[#00FFA3] flex-shrink-0" />
                )} */}

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(file.id)
                  }}
                  className={`flex-shrink-0 p-0.5 rounded transition-all ${
                    isActive
                      ? 'opacity-100 hover:bg-[#3A3A5A]'
                      : 'opacity-0 group-hover:opacity-100 hover:bg-[#3A3A5A]'
                  }`}
                  aria-label={`Close ${file.path}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Hover effect overlay */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#7B2FF7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </Reorder.Item>
            )
          })}
        </AnimatePresence>
      </Reorder.Group>
      
      {/* Right shadow fade */}
      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#1E1E3F] to-transparent pointer-events-none" />
    </div>
  )
}
