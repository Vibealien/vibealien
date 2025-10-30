/**
 * Command System Index
 * Initializes and exports the command system
 */

import { commandManager } from './manager'
import {
  clearCommand,
  helpCommand,
  buildCommand,
  deployCommand,
  testCommand,
  solanaCommand,
  anchorCommand,
  rustfmtCommand
} from './implementations'

// Register all commands
export function initializeCommands() {
  commandManager.registerAll([
    clearCommand,
    helpCommand,
    buildCommand,
    deployCommand,
    testCommand,
    solanaCommand,
    anchorCommand,
    rustfmtCommand
  ])
}

// Export command system
export { commandManager } from './manager'
export { createCmd, createArgs, createOptions } from './create'
export * from './types'
