/**
 * Shell Service
 * Interactive terminal shell with history and autocomplete
 */

import { commandManager } from '../commands/manager'
import { terminalService } from './terminal.service'
import { historyService } from './history.service'
import { autocompleteService } from './autocomplete.service'

interface ShellOptions {
  prompt?: string
}

class ShellService {
  private isEnabled = true
  private currentInput = ''
  private prompt = '$ '

  /**
   * Initialize shell
   */
  init(options?: ShellOptions) {
    if (options?.prompt) {
      this.prompt = options.prompt
    }
  }

  /**
   * Execute command from string
   */
  async execute(input: string): Promise<any> {
    if (!input || input.trim().length === 0) return

    // Add to history
    historyService.add(input)

    // Parse input into tokens
    const tokens = this.parseInput(input)

    try {
      // Execute command
      const result = await commandManager.execute(tokens)
      return result
    } catch (error: any) {
      terminalService.println(error.message, 'error')
      throw error
    }
  }

  /**
   * Parse input string into tokens
   */
  private parseInput(input: string): string[] {
    const tokens: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''

    for (let i = 0; i < input.length; i++) {
      const char = input[i]

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false
        quoteChar = ''
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current)
          current = ''
        }
      } else {
        current += char
      }
    }

    if (current) {
      tokens.push(current)
    }

    return tokens
  }

  /**
   * Get completions for current input
   */
  getCompletions(input: string): string[] {
    return autocompleteService.getCompletions(input)
  }

  /**
   * Get previous command from history
   */
  getPreviousCommand(): string | null {
    return historyService.previous()
  }

  /**
   * Get next command from history
   */
  getNextCommand(): string | null {
    return historyService.next()
  }

  /**
   * Get current prompt
   */
  getPrompt(): string {
    return this.prompt
  }

  /**
   * Set prompt
   */
  setPrompt(prompt: string): void {
    this.prompt = prompt
  }

  /**
   * Enable shell
   */
  enable(): void {
    this.isEnabled = true
  }

  /**
   * Disable shell
   */
  disable(): void {
    this.isEnabled = false
  }

  /**
   * Check if shell is enabled
   */
  isActive(): boolean {
    return this.isEnabled
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyPress(key: string, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean }): void {
    switch (key) {
      case 'ArrowUp':
        if (!modifiers.ctrl && !modifiers.shift && !modifiers.alt) {
          const prev = this.getPreviousCommand()
          if (prev !== null) {
            this.currentInput = prev
          }
        }
        break
      
      case 'ArrowDown':
        if (!modifiers.ctrl && !modifiers.shift && !modifiers.alt) {
          const next = this.getNextCommand()
          if (next !== null) {
            this.currentInput = next
          }
        }
        break

      case 'c':
        if (modifiers.ctrl) {
          // Ctrl+C - interrupt
          terminalService.println('^C')
        }
        break

      case 'l':
        if (modifiers.ctrl) {
          // Ctrl+L - clear
          terminalService.clear()
        }
        break
    }
  }
}

export const shellService = new ShellService()
