/**
 * Command History Management
 * For terminal command history navigation
 */

class HistoryService {
  private history: string[] = []
  private currentIndex: number = -1
  private maxSize: number = 100

  /**
   * Add command to history
   */
  add(command: string): void {
    if (!command || command.trim().length === 0) return
    
    // Don't add duplicate consecutive commands
    if (this.history[this.history.length - 1] === command) return

    this.history.push(command)
    
    // Limit history size
    if (this.history.length > this.maxSize) {
      this.history.shift()
    }

    this.currentIndex = this.history.length
  }

  /**
   * Get previous command
   */
  previous(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return this.history[this.currentIndex]
    }
    return null
  }

  /**
   * Get next command
   */
  next(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      return this.history[this.currentIndex]
    } else {
      this.currentIndex = this.history.length
      return ''
    }
  }

  /**
   * Get last command
   */
  getLast(): string | null {
    return this.history[this.history.length - 1] || null
  }

  /**
   * Search history
   */
  search(query: string): string[] {
    return this.history.filter(cmd => cmd.includes(query))
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = []
    this.currentIndex = -1
  }

  /**
   * Get all history
   */
  getAll(): string[] {
    return [...this.history]
  }
}

export const historyService = new HistoryService()
