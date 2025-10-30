/**
 * Command Manager
 * Based on Solana Playground's PgCommandManager
 */

import type { Command, CommandEventCallbacks, Disposable } from './types'

class CommandManager {
  private commands: Map<string, Command> = new Map()
  private eventCallbacks: Map<string, CommandEventCallbacks> = new Map()

  /**
   * Register a command
   */
  register(command: Command): void {
    this.commands.set(command.name, command)
  }

  /**
   * Register multiple commands
   */
  registerAll(commands: Command[]): void {
    commands.forEach(cmd => this.register(cmd))
  }

  /**
   * Get all registered commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values())
  }

  /**
   * Get command names
   */
  getNames(): string[] {
    return Array.from(this.commands.keys())
  }

  /**
   * Get command by name
   */
  get(name: string): Command | undefined {
    return this.commands.get(name)
  }

  /**
   * Execute a command from tokens
   */
  async execute(tokens: string[]): Promise<any> {
    const commandName = tokens[0]
    if (!commandName) return

    const command = this.commands.get(commandName)
    if (!command) {
      throw new Error(`Command '${commandName}' not found`)
    }

    // Dispatch start event
    this.dispatchStart(commandName, tokens.join(' '))

    try {
      // Execute preChecks
      if (command.preCheck) {
        const checks = Array.isArray(command.preCheck) 
          ? command.preCheck 
          : [command.preCheck]
        
        for (const check of checks) {
          await check()
        }
      }

      // Parse arguments and options
      const parsed = this.parseInput(tokens.slice(1), command)

      // Execute command
      let result
      if (command.handle) {
        result = await command.handle(parsed)
      }

      // Dispatch finish event
      this.dispatchFinish(commandName, result)

      return result
    } catch (error) {
      this.dispatchFinish(commandName, { error })
      throw error
    }
  }

  /**
   * Parse command input
   */
  private parseInput(tokens: string[], command: Command): any {
    const args: any = {}
    const options: any = {}
    const raw = tokens.join(' ')

    let tokenIndex = 0
    let argIndex = 0

    while (tokenIndex < tokens.length) {
      const token = tokens[tokenIndex]

      // Check if it's an option
      if (token.startsWith('-')) {
        const optName = token.startsWith('--') 
          ? token.substring(2) 
          : this.getOptionByShort(command, token.substring(1))

        if (optName) {
          const opt = command.options?.find(o => o.name === optName)
          if (opt?.takeValue) {
            options[optName] = tokens[++tokenIndex]
          } else {
            options[optName] = true
          }
        }
        tokenIndex++
        continue
      }

      // It's an argument
      if (command.args && argIndex < command.args.length) {
        const arg = command.args[argIndex]
        if (arg.multiple) {
          args[arg.name] = args[arg.name] || []
          args[arg.name].push(token)
        } else {
          args[arg.name] = token
          argIndex++
        }
      }
      tokenIndex++
    }

    return { raw, args, options }
  }

  /**
   * Get option name by short form
   */
  private getOptionByShort(command: Command, short: string): string | undefined {
    return command.options?.find(o => o.short === short)?.name
  }

  /**
   * Get command completions for autocomplete
   */
  getCompletions(): Record<string, any> {
    const completions: Record<string, any> = {}

    for (const cmd of this.commands.values()) {
      completions[cmd.name] = {}
      
      if (cmd.subcommands) {
        for (const sub of cmd.subcommands) {
          completions[cmd.name][sub.name] = {}
        }
      }

      if (cmd.options) {
        for (const opt of cmd.options) {
          const long = `--${opt.name}`
          completions[cmd.name][long] = { takeValue: opt.takeValue }
          
          if (opt.short) {
            const short = `-${opt.short}`
            completions[cmd.name][short] = { takeValue: opt.takeValue }
          }
        }
      }
    }

    return completions
  }

  /**
   * Subscribe to command start event
   */
  onDidStart(commandName: string, callback: (input: string | null) => void): Disposable {
    if (!this.eventCallbacks.has(commandName)) {
      this.eventCallbacks.set(commandName, { onStart: [], onFinish: [] })
    }
    
    const callbacks = this.eventCallbacks.get(commandName)!
    callbacks.onStart.push(callback)

    return {
      dispose: () => {
        const index = callbacks.onStart.indexOf(callback)
        if (index > -1) callbacks.onStart.splice(index, 1)
      }
    }
  }

  /**
   * Subscribe to command finish event
   */
  onDidFinish(commandName: string, callback: (result: any) => void): Disposable {
    if (!this.eventCallbacks.has(commandName)) {
      this.eventCallbacks.set(commandName, { onStart: [], onFinish: [] })
    }
    
    const callbacks = this.eventCallbacks.get(commandName)!
    callbacks.onFinish.push(callback)

    return {
      dispose: () => {
        const index = callbacks.onFinish.indexOf(callback)
        if (index > -1) callbacks.onFinish.splice(index, 1)
      }
    }
  }

  /**
   * Dispatch start event
   */
  private dispatchStart(commandName: string, input: string): void {
    const callbacks = this.eventCallbacks.get(commandName)
    if (callbacks) {
      callbacks.onStart.forEach(cb => cb(input))
    }
  }

  /**
   * Dispatch finish event
   */
  private dispatchFinish(commandName: string, result: any): void {
    const callbacks = this.eventCallbacks.get(commandName)
    if (callbacks) {
      callbacks.onFinish.forEach(cb => cb(result))
    }
  }
}

export const commandManager = new CommandManager()
