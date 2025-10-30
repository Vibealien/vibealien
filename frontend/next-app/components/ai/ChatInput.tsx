/**
 * Chat Input Component
 * Input field for user messages with send button
 */

'use client'

import React, { useState, useRef, KeyboardEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled = false, placeholder = 'Ask AI anything...' }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
  }

  return (
    <div className="border-t border-[#7B2FF7]/20 bg-[#0A0A1A] p-4">
      <div className="flex gap-2 items-end">
        {/* Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full px-4 py-3 pr-10
              bg-[#0C0C1E] border border-[#7B2FF7]/20 rounded-lg
              text-white text-sm font-['Inter']
              placeholder:text-white/40
              focus:outline-none focus:border-[#7B2FF7]/60
              resize-none
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{ maxHeight: '150px' }}
          />
          <Sparkles className="absolute right-3 top-3 w-4 h-4 text-[#7B2FF7]/40" />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={`
            px-4 py-3 rounded-lg
            bg-gradient-to-r from-[#7B2FF7] to-[#00D4FF]
            text-white font-['Inter'] font-medium text-sm
            transition-all duration-200
            flex items-center gap-2
            ${disabled || !message.trim() 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-lg hover:shadow-[#7B2FF7]/30'
            }
          `}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Hint */}
      <div className="mt-2 text-xs text-white/30 font-['Inter']">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}
