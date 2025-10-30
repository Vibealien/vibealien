/**
 * Secondary Panel - Side panel for additional views (AI, docs, etc.)
 * Can be toggled on/off
 */

'use client'

import React, { useState } from 'react'
import { X, Bot, Book, MessageSquare } from 'lucide-react'
import { AIPanel } from '@/components/editor/AIPanel'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { useEditor } from '@/lib/contexts/EditorContext'

export function SecondaryPanel() {
  const [isVisible, setIsVisible] = useState(true)
  const [activeView, setActiveView] = useState<'chat' | 'suggestions' | 'docs'>('chat')
  const { activeFile } = useEditor()

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="w-8 bg-[#0A0A1A] border-l border-[#7B2FF7]/20 flex items-center justify-center hover:bg-[#7B2FF7]/10"
        title="Show AI Panel"
      >
        <Bot className="w-4 h-4 text-white/60" />
      </button>
    )
  }

  return (
    <div className="w-96 flex-shrink-0 bg-[#0A0A1A] border-l border-[#7B2FF7]/20 flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-[#7B2FF7]/20 flex items-center justify-between px-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView('chat')}
            className={`
              px-3 py-1 rounded text-xs font-['Inter'] font-medium transition-colors flex items-center gap-1
              ${activeView === 'chat' 
                ? 'bg-[#7B2FF7] text-white' 
                : 'text-white/60 hover:text-white'
              }
            `}
          >
            <MessageSquare className="w-3 h-3" />
            Chat
          </button>
          <button
            onClick={() => setActiveView('suggestions')}
            className={`
              px-3 py-1 rounded text-xs font-['Inter'] font-medium transition-colors flex items-center gap-1
              ${activeView === 'suggestions' 
                ? 'bg-[#7B2FF7] text-white' 
                : 'text-white/60 hover:text-white'
              }
            `}
          >
            <Bot className="w-3 h-3" />
            Suggestions
          </button>
          <button
            onClick={() => setActiveView('docs')}
            className={`
              px-3 py-1 rounded text-xs font-['Inter'] font-medium transition-colors flex items-center gap-1
              ${activeView === 'docs' 
                ? 'bg-[#7B2FF7] text-white' 
                : 'text-white/60 hover:text-white'
              }
            `}
          >
            <Book className="w-3 h-3" />
            Docs
          </button>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white transition-colors"
          title="Hide panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'chat' && <ChatPanel />}
        
        {activeView === 'suggestions' && (
          <AIPanel
            code={activeFile?.content || ''}
            language={activeFile?.language || 'rust'}
            onApplySuggestion={() => {}}
          />
        )}
        
        {activeView === 'docs' && (
          <div className="h-full flex items-center justify-center p-8">
            <p className="text-white/40 text-sm font-['Inter'] text-center">
              Documentation panel coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
