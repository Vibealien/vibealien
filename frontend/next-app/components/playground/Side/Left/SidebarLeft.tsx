/**
 * Sidebar Left - Icon-based navigation bar
 * Follows solpg's vertical icon bar pattern
 */

'use client'

import React from 'react'
import { FileText, Settings, Terminal as TerminalIcon, FolderTree } from 'lucide-react'
import type { SidebarPage } from '../SidePanel'

interface SidebarLeftProps {
  activePage: SidebarPage
  onPageChange: (page: SidebarPage) => void
  isCollapsed: boolean
}

interface NavItem {
  id: SidebarPage
  icon: React.ElementType
  label: string
  keybind?: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'explorer', icon: FolderTree, label: 'Explorer', keybind: 'Ctrl+Shift+E' },
  { id: 'terminal', icon: TerminalIcon, label: 'Terminal', keybind: 'Ctrl+`' },
  { id: 'settings', icon: Settings, label: 'Settings', keybind: 'Ctrl+,' },
]

export function SidebarLeft({ activePage, onPageChange, isCollapsed }: SidebarLeftProps) {
  return (
    <div className="w-12 bg-[#0A0A1A] border-r border-[#7B2FF7]/20 flex flex-col items-center py-4 gap-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activePage === item.id && !isCollapsed
        
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`
              w-10 h-10 rounded flex items-center justify-center
              transition-all duration-200
              ${isActive 
                ? 'bg-[#7B2FF7] text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
            title={`${item.label} ${item.keybind ? `(${item.keybind})` : ''}`}
            aria-label={item.label}
          >
            <Icon className="w-5 h-5" />
          </button>
        )
      })}
    </div>
  )
}
