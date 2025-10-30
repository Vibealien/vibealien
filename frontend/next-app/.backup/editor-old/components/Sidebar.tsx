'use client'

import React, { useState } from 'react'
import { 
  FolderTree, 
  Hammer, 
  Github, 
  Settings 
} from 'lucide-react'

interface SidebarProps {
  activePage: 'explorer' | 'build' | 'settings'
  onPageChange: (page: 'explorer' | 'build' | 'settings') => void
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const buttons = [
    {
      id: 'explorer',
      icon: FolderTree,
      tooltip: 'Explorer (Ctrl+Shift+E)',
      active: activePage === 'explorer'
    },
    {
      id: 'build',
      icon: Hammer,
      tooltip: 'Build & Deploy (Ctrl+Shift+B)',
      active: activePage === 'build'
    }
  ]

  const bottomButtons = [
    {
      id: 'github',
      icon: Github,
      tooltip: 'GitHub',
      href: 'https://github.com'
    },
    {
      id: 'settings',
      icon: Settings,
      tooltip: 'Settings',
      active: activePage === 'settings'
    }
  ]

  return (
    <div className="flex flex-col h-full w-12 bg-[#0A0A14] border-r border-[#7B2FF7]/20">
      {/* Top buttons */}
      <div className="flex flex-col items-center pt-2">
        {buttons.map((button) => {
          const Icon = button.icon
          const isActive = button.active
          const isHovered = hoveredButton === button.id

          return (
            <div
              key={button.id}
              className="relative group"
              onMouseEnter={() => setHoveredButton(button.id)}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <button
                onClick={() => onPageChange(button.id as any)}
                className={`
                  w-12 h-12 flex items-center justify-center
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#7B2FF7]/20 border-l-2 border-[#7B2FF7]' 
                    : 'hover:bg-[#1E1E3F]'
                  }
                `}
                title={button.tooltip}
              >
                <Icon 
                  className={`w-6 h-6 transition-all duration-200 ${
                    isActive || isHovered
                      ? 'text-[#00FFA3]' 
                      : 'text-white/40'
                  }`}
                />
              </button>

              {/* Tooltip */}
              {isHovered && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#1E1E3F] border border-[#7B2FF7]/30 rounded text-xs text-white/90 whitespace-nowrap font-['Inter'] z-50">
                  {button.tooltip}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#7B2FF7]/30" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom buttons */}
      <div className="flex flex-col items-center mt-auto pb-2">
        {bottomButtons.map((button) => {
          const Icon = button.icon
          const isActive = button.active
          const isHovered = hoveredButton === button.id

          return (
            <div
              key={button.id}
              className="relative group"
              onMouseEnter={() => setHoveredButton(button.id)}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {button.href ? (
                <a
                  href={button.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center hover:bg-[#1E1E3F] transition-all duration-200"
                  title={button.tooltip}
                >
                  <Icon className={`w-6 h-6 transition-all duration-200 ${
                    isHovered ? 'text-[#00FFA3]' : 'text-white/40'
                  }`} />
                </a>
              ) : (
                <button
                  onClick={() => onPageChange(button.id as any)}
                  className={`
                    w-12 h-12 flex items-center justify-center
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-[#7B2FF7]/20 border-l-2 border-[#7B2FF7]' 
                      : 'hover:bg-[#1E1E3F]'
                    }
                  `}
                  title={button.tooltip}
                >
                  <Icon className={`w-6 h-6 transition-all duration-200 ${
                    isActive || isHovered ? 'text-[#00FFA3]' : 'text-white/40'
                  }`} />
                </button>
              )}

              {/* Tooltip */}
              {isHovered && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#1E1E3F] border border-[#7B2FF7]/30 rounded text-xs text-white/90 whitespace-nowrap font-['Inter'] z-50">
                  {button.tooltip}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#7B2FF7]/30" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
