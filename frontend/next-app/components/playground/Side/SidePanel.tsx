/**
 * Side Panel - Left sidebar with file explorer and navigation
 * Inspired by solpg's Side panel structure
 */

'use client'

import React, { useState, useCallback } from 'react'
import { FileText, FolderTree, Settings, Terminal as TerminalIcon } from 'lucide-react'
import { SidebarLeft } from './Left/SidebarLeft'
import { SidebarContent } from './Right/SidebarContent'

export type SidebarPage = 'explorer' | 'settings' | 'terminal'

export function SidePanel() {
  const [activePage, setActivePage] = useState<SidebarPage>('explorer')
  const [width, setWidth] = useState(320)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleToggle = useCallback((page: SidebarPage) => {
    setActivePage(prevPage => {
      if (prevPage === page && !isCollapsed) {
        setIsCollapsed(true)
        return page
      }
      setIsCollapsed(false)
      return page
    })
  }, [isCollapsed])

  return (
    <div className="flex h-full">
      <SidebarLeft
        activePage={activePage}
        onPageChange={handleToggle}
        isCollapsed={isCollapsed}
      />
      
      {!isCollapsed && (
        <SidebarContent
          page={activePage}
          width={width}
          onWidthChange={setWidth}
        />
      )}
    </div>
  )
}
