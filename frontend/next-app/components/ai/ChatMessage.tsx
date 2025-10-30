/**
 * Chat Message Component
 * Displays individual chat messages with user/AI styling
 */

'use client'

import React from 'react'
import { User, Bot, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = role === 'user'
  const isSystem = role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="text-xs text-white/40 font-['Inter']">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'bg-transparent' : 'bg-[#0A0A1A]/50'}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-[#7B2FF7]' : 'bg-gradient-to-br from-[#7B2FF7] to-[#00D4FF]'}
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium font-['Orbitron'] text-white">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          {timestamp && (
            <span className="text-xs text-white/40 font-['Inter']">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-white/90 font-['Inter'] whitespace-pre-wrap break-words">
          {content}
        </div>

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCopy}
              className="text-white/40 hover:text-white transition-colors p-1"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
