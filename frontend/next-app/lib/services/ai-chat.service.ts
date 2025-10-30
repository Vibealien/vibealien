/**
 * AI Chat Service
 * Handles communication with AI suggestion service
 */

import { apiClient } from '../api/client'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface ChatRequest {
  message: string
  context?: {
    code?: string
    language?: string
    filePath?: string
  }
  conversationHistory?: ChatMessage[]
}

export interface ChatResponse {
  message: string
  suggestions?: string[]
  codeBlocks?: Array<{
    language: string
    code: string
  }>
}

class AIChatService {
  private baseUrl = '/api/ai'

  /**
   * Send a chat message to AI
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/chat`, request)
      return response.data
    } catch (error) {
      console.error('Error sending chat message:', error)
      throw error
    }
  }

  /**
   * Get code suggestions for current context
   */
  async getCodeSuggestions(code: string, language: string): Promise<string[]> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/suggestions`, {
        code,
        language,
      })
      return response.data.suggestions || []
    } catch (error) {
      console.error('Error getting code suggestions:', error)
      return []
    }
  }

  /**
   * Explain code snippet
   */
  async explainCode(code: string, language: string): Promise<string> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/explain`, {
        code,
        language,
      })
      return response.data.explanation || ''
    } catch (error) {
      console.error('Error explaining code:', error)
      throw error
    }
  }

  /**
   * Find bugs in code
   */
  async findBugs(code: string, language: string): Promise<Array<{
    line: number
    severity: 'error' | 'warning' | 'info'
    message: string
    suggestion?: string
  }>> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/bugs`, {
        code,
        language,
      })
      return response.data.bugs || []
    } catch (error) {
      console.error('Error finding bugs:', error)
      return []
    }
  }

  /**
   * Generate tests for code
   */
  async generateTests(code: string, language: string): Promise<string> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/tests`, {
        code,
        language,
      })
      return response.data.tests || ''
    } catch (error) {
      console.error('Error generating tests:', error)
      throw error
    }
  }

  /**
   * Refactor code
   */
  async refactorCode(code: string, language: string, instructions?: string): Promise<string> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/refactor`, {
        code,
        language,
        instructions,
      })
      return response.data.refactoredCode || ''
    } catch (error) {
      console.error('Error refactoring code:', error)
      throw error
    }
  }

  /**
   * Optimize code performance
   */
  async optimizeCode(code: string, language: string): Promise<{
    optimizedCode: string
    improvements: string[]
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/optimize`, {
        code,
        language,
      })
      return {
        optimizedCode: response.data.optimizedCode || '',
        improvements: response.data.improvements || [],
      }
    } catch (error) {
      console.error('Error optimizing code:', error)
      throw error
    }
  }
}

export const aiChatService = new AIChatService()
