/**
 * Autocomplete Service
 * Provides command and argument completion for terminal
 */

import { commandManager } from '../commands/manager'

class AutocompleteService {
  /**
   * Get completions for the current input
   */
  getCompletions(input: string): string[] {
    const tokens = input.trim().split(/\s+/)
    
    // No input - show all commands
    if (tokens.length === 0 || input.trim() === '') {
      return commandManager.getNames()
    }

    const commandName = tokens[0]
    const command = commandManager.get(commandName)

    // First token - complete command name
    if (tokens.length === 1 && !input.endsWith(' ')) {
      return commandManager
        .getNames()
        .filter(name => name.startsWith(commandName))
    }

    // Command exists - complete options/args
    if (command) {
      const lastToken = tokens[tokens.length - 1]
      const completions: string[] = []

      // Option completions
      if (lastToken.startsWith('-')) {
        if (command.options) {
          for (const opt of command.options) {
            const long = `--${opt.name}`
            const short = opt.short ? `-${opt.short}` : null
            
            if (long.startsWith(lastToken)) {
              completions.push(long)
            }
            if (short && short.startsWith(lastToken)) {
              completions.push(short)
            }
          }
        }
        return completions
      }

      // Show available options
      if (command.options) {
        for (const opt of command.options) {
          if (!tokens.includes(`--${opt.name}`)) {
            completions.push(`--${opt.name}`)
          }
        }
      }

      return completions
    }

    return []
  }

  /**
   * Get completion for path arguments
   */
  async getPathCompletions(partialPath: string): Promise<string[]> {
    // TODO: Integrate with fsService to get file/folder completions
    return []
  }
}

export const autocompleteService = new AutocompleteService()
