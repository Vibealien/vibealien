/**
 * Bottom Panel - Terminal, Build Output, Problems
 * Resizable and collapsible
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Terminal, Code, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Terminal as TerminalComponent } from '@/components/terminal/Terminal'

const MIN_HEIGHT = 100
const MAX_HEIGHT = 600
const DEFAULT_HEIGHT = 300

export function BottomPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [activeTab, setActiveTab] = useState<'terminal' | 'build' | 'problems'>('terminal')
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newHeight = containerRect.bottom - e.clientY
      
      if (newHeight >= MIN_HEIGHT && newHeight <= MAX_HEIGHT) {
        setHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  if (isCollapsed) {
    return (
      <div className="h-8 bg-[#0A0A1A] border-t border-[#7B2FF7]/20 flex items-center justify-between px-4">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setIsCollapsed(false)
              setActiveTab('terminal')
            }}
            className="text-white/60 hover:text-white text-xs font-['Inter'] flex items-center gap-1"
          >
            <Terminal className="w-3 h-3" />
            Terminal
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false)
              setActiveTab('build')
            }}
            className="text-white/60 hover:text-white text-xs font-['Inter'] flex items-center gap-1"
          >
            <Code className="w-3 h-3" />
            Build
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false)
              setActiveTab('problems')
            }}
            className="text-white/60 hover:text-white text-xs font-['Inter'] flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            Problems
          </button>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-white/60 hover:text-white"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px` }}
      className="bg-[#0A0A1A] border-t border-[#7B2FF7]/20 flex flex-col"
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResize}
        className={`
          h-1 cursor-ns-resize hover:bg-[#7B2FF7]/40 transition-colors
          ${isResizing ? 'bg-[#7B2FF7]/60' : 'bg-transparent'}
        `}
      />

      {/* Header */}
      <div className="h-10 border-b border-[#7B2FF7]/20 flex items-center justify-between px-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`
              px-3 py-1 rounded text-xs font-['Inter'] font-medium transition-colors flex items-center gap-1
              ${activeTab === 'terminal' 
                ? 'bg-[#7B2FF7] text-white' 
                : 'text-white/60 hover:text-white'
              }
            `}
          >
            <Terminal className="w-3 h-3" />
            Terminal
          </button>
          <button
            onClick={() => setActiveTab('build')}
            className={`
              px-3 py-1 rounded text-xs font-['Inter'] font-medium transition-colors flex items-center gap-1
              ${activeTab === 'build' 
                ? 'bg-[#7B2FF7] text-white' 
                : 'text-white/60 hover:text-white'
              }
            `}
          >
            <Code className="w-3 h-3" />
            Build
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={`
              px-3 py-1 rounded text-xs font-['Inter'] font-medium transition-colors flex items-center gap-1
              ${activeTab === 'problems' 
                ? 'bg-[#7B2FF7] text-white' 
                : 'text-white/60 hover:text-white'
              }
            `}
          >
            <AlertCircle className="w-3 h-3" />
            Problems
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-white/60 hover:text-white"
            title="Collapse panel"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-white/60 hover:text-white"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'terminal' && (
          <TerminalComponent />
        )}
        
        {activeTab === 'build' && (
          <div className="h-full overflow-auto p-4 font-mono text-sm">
            <div className="text-white/60">Build output will appear here...</div>
          </div>
        )}
        
        {activeTab === 'problems' && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/40 text-sm font-['Inter']">
              No problems detected
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
