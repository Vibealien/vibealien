/**
 * Terminal Service
 * Based on Solana Playground's PgTerminal
 */

type TerminalMessageType = 'success' | 'error' | 'warning' | 'info'

class TerminalService {
  private outputCallbacks: Array<(message: string, type?: TerminalMessageType) => void> = []
  private clearCallbacks: Array<() => void> = []

  /**
   * Print message to terminal
   */
  println(message: any, type?: TerminalMessageType): void {
    const formattedMessage = this.formatMessage(message, type)
    this.outputCallbacks.forEach(cb => cb(formattedMessage, type))
  }

  /**
   * Clear terminal
   */
  clear(): void {
    this.clearCallbacks.forEach(cb => cb())
  }

  /**
   * Subscribe to terminal output
   */
  onOutput(callback: (message: string, type?: TerminalMessageType) => void): () => void {
    this.outputCallbacks.push(callback)
    return () => {
      const index = this.outputCallbacks.indexOf(callback)
      if (index > -1) this.outputCallbacks.splice(index, 1)
    }
  }

  /**
   * Subscribe to terminal clear
   */
  onClear(callback: () => void): () => void {
    this.clearCallbacks.push(callback)
    return () => {
      const index = this.clearCallbacks.indexOf(callback)
      if (index > -1) this.clearCallbacks.splice(index, 1)
    }
  }

  /**
   * Format message with ANSI color codes
   */
  private formatMessage(message: any, type?: TerminalMessageType): string {
    const text = typeof message === 'string' ? message : JSON.stringify(message, null, 2)
    
    switch (type) {
      case 'success':
        return this.success(text)
      case 'error':
        return this.error(text)
      case 'warning':
        return this.warning(text)
      case 'info':
        return this.info(text)
      default:
        return text
    }
  }

  // ANSI color helpers
  success(text: string): string {
    return `\x1b[1;32m${text}\x1b[0m`
  }

  error(text: string): string {
    return `\x1b[1;31m${text}\x1b[0m`
  }

  warning(text: string): string {
    return `\x1b[1;33m${text}\x1b[0m`
  }

  info(text: string): string {
    return `\x1b[1;34m${text}\x1b[0m`
  }

  primary(text: string): string {
    return `\x1b[1;35m${text}\x1b[0m`
  }

  secondary(text: string): string {
    return `\x1b[1;36m${text}\x1b[0m`
  }

  bold(text: string): string {
    return `\x1b[1m${text}\x1b[0m`
  }

  italic(text: string): string {
    return `\x1b[3m${text}\x1b[0m`
  }

  underline(text: string): string {
    return `\x1b[4m${text}\x1b[0m`
  }

  /**
   * Convert error messages to user-friendly format
   */
  convertErrorMessage(msg: string): string {
    // Add custom error message conversions here
    return msg
  }
}

export const terminalService = new TerminalService()
