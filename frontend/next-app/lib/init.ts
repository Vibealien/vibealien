/**
 * Application Initialization
 * Initialize all services and commands
 */

import { initializeCommands } from './commands'
import { workspaceService, explorerService, shellService } from './services'

export async function initializeApp() {
  // Initialize commands
  initializeCommands()

  // Initialize workspace
  await workspaceService.init()

  // Initialize explorer
  await explorerService.init()

  // Initialize shell
  shellService.init({
    prompt: '$ '
  })

  console.log('✓ Application initialized')
}
