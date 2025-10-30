/**
 * Chat Panel Component
 * Main AI chat interface with message history and input
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Trash2, Download, Sparkles } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { AIFeaturesOverview } from './AIFeaturesOverview'
import { useEditor } from '@/lib/contexts/EditorContext'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  'Explain this code',
  'Find bugs',
  'Optimize performance',
  'Add comments',
  'Write tests',
  'Refactor code',
]

export function ChatPanel() {
  const { activeFile } = useEditor()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(content, activeFile?.content),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    let message = prompt
    if (activeFile) {
      const fileName = activeFile.path.split('/').pop() || activeFile.path
      message += ` in ${fileName}`
    }
    handleSendMessage(message)
  }

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([])
    }
  }

  const handleExportChat = () => {
    const chatText = messages
      .filter(m => m.role !== 'system')
      .map(m => `[${m.timestamp.toLocaleTimeString()}] ${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`)
      .join('\n\n')

    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full bg-[#0C0C1E]">
      {/* Header */}
      <div className="h-12 border-b border-[#7B2FF7]/20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#00D4FF] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-['Orbitron'] font-medium text-sm">
            AI Assistant
          </span>
          {isLoading && (
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-[#7B2FF7] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-[#7B2FF7] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-[#7B2FF7] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportChat}
            className="text-white/60 hover:text-white transition-colors p-1"
            title="Export chat"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearChat}
            className="text-white/60 hover:text-white transition-colors p-1"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages or Welcome Screen */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <AIFeaturesOverview onFeatureClick={handleSendMessage} />
        ) : (
          <div className="py-4">
            {messages.map(message => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3 px-4 py-3 bg-[#0A0A1A]/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#00D4FF] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium font-['Orbitron'] text-white mb-1">
                    AI Assistant
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  )
}

// Mock response generator (replace with actual API call)
function generateMockResponse(userMessage: string, code?: string): string {
  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes('explain')) {
    return 'I can help explain your code! To provide a detailed explanation, I\'ll need to analyze the code structure, functions, and logic flow. Would you like me to focus on a specific part?'
  }

  if (lowerMessage.includes('bug') || lowerMessage.includes('error')) {
    return 'I\'ll analyze your code for potential bugs. Common issues to look for include:\n\n• Null/undefined checks\n• Type mismatches\n• Memory leaks\n• Race conditions\n• Edge cases\n\nCould you share more details about the issue you\'re experiencing?'
  }

  if (lowerMessage.includes('optimize') || lowerMessage.includes('performance')) {
    return 'Performance optimization tips:\n\n• Use memoization for expensive computations\n• Avoid unnecessary re-renders\n• Implement lazy loading\n• Optimize loops and algorithms\n• Use proper data structures\n\nWhat specific performance issue are you trying to address?'
  }

  if (lowerMessage.includes('test')) {
    return 'I can help you write tests! Good tests should:\n\n• Cover happy paths and edge cases\n• Be independent and repeatable\n• Have clear assertions\n• Test behavior, not implementation\n\nWhat testing framework are you using?'
  }

  if (lowerMessage.includes('refactor')) {
    return 'Refactoring recommendations:\n\n• Extract reusable functions\n• Follow SOLID principles\n• Improve naming conventions\n• Reduce complexity\n• Remove code duplication\n\nWhich part of the code would you like to refactor?'
  }

  return 'I\'m here to help with your code! You can ask me to:\n\n• Explain code logic\n• Find and fix bugs\n• Optimize performance\n• Write tests\n• Suggest improvements\n• Answer programming questions\n\nWhat would you like to know?'
}
