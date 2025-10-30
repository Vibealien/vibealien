'use client'

import React from 'react'
import { FileCode, GitBranch, AlertCircle, Check } from 'lucide-react'

interface StatusBarProps {
  line: number
  column: number
  language: string
  encoding?: string
  lineEnding?: 'LF' | 'CRLF'
  totalLines?: number
  selectedCount?: number
  branch?: string
  isOnline?: boolean
  pendingSync?: number
}

export const StatusBar: React.FC<StatusBarProps> = ({
  line,
  column,
  language,
  encoding = 'UTF-8',
  lineEnding = 'LF',
  totalLines,
  selectedCount,
  branch,
  isOnline = true,
  pendingSync = 0,
}) => {
  const languageDisplayNames: { [key: string]: string } = {
    rust: 'Rust',
    toml: 'TOML',
    markdown: 'Markdown',
    json: 'JSON',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    c: 'C',
    cpp: 'C++',
    plaintext: 'Plain Text',
  }

  const languageIcons: { [key: string]: string } = {
    rust: '🦀',
    toml: '📦',
    markdown: '📝',
    json: '{}',
    javascript: 'JS',
    typescript: 'TS',
    python: '🐍',
    c: 'C',
  }

  return (
    <div className="flex items-center justify-between h-6 bg-[#7B2FF7] text-white text-[11px] px-3 border-t border-[#9D5FFF]">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Git Branch */}
        {branch && (
          <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
            <GitBranch className="w-3 h-3" />
            <span className="font-['Inter'] font-medium">{branch}</span>
          </div>
        )}

        {/* Problems/Warnings (placeholder) */}
        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <AlertCircle className="w-3 h-3" />
          <span className="font-['Inter']">0</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Line and Column */}
        <div className="hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">
          <span className="font-['JetBrains_Mono'] font-medium">
            Ln {line}, Col {column}
          </span>
          {selectedCount !== undefined && selectedCount > 0 && (
            <span className="ml-1 text-white/80">
              ({selectedCount} selected)
            </span>
          )}
        </div>

        {/* Total Lines */}
        {totalLines !== undefined && (
          <div className="px-2 py-0.5 text-white/80">
            <span className="font-['JetBrains_Mono']">{totalLines} lines</span>
          </div>
        )}

        {/* Language */}
        <div className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">
          <span>{languageIcons[language] || '📄'}</span>
          <span className="font-['Inter'] font-medium">
            {languageDisplayNames[language] || language}
          </span>
        </div>

        {/* Encoding */}
        <div className="hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">
          <span className="font-['JetBrains_Mono']">{encoding}</span>
        </div>

        {/* Line Ending */}
        <div className="hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">
          <span className="font-['JetBrains_Mono']">{lineEnding}</span>
        </div>

        {/* Tab/Spaces (placeholder) */}
        <div className="hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">
          <span className="font-['JetBrains_Mono']">Spaces: 2</span>
        </div>

        {/* Online/Sync Status */}
        {!isOnline ? (
          <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="font-['Inter'] text-xs text-yellow-300">Offline</span>
            {pendingSync > 0 && (
              <span className="font-['Inter'] text-xs text-yellow-300">({pendingSync})</span>
            )}
          </div>
        ) : pendingSync > 0 ? (
          <div className="flex items-center gap-1 bg-[#00FFA3]/20 px-2 py-0.5 rounded">
            <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="font-['Inter'] text-xs text-[#00FFA3]">Syncing ({pendingSync})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
            <Check className="w-3 h-3" />
            <span className="font-['Inter'] text-xs">Synced</span>
          </div>
        )}
      </div>
    </div>
  )
}
