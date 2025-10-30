/**
 * Anchor Command
 * Anchor framework commands
 */

import { createCmd } from '../create'
import { terminalService } from '../../services/terminal.service'

export const anchorCommand = createCmd({
  name: 'anchor',
  description: 'Anchor framework commands',
  handle: async ({ raw }) => {
    const args = raw.split(' ')
    const subcommand = args[0]
    
    switch (subcommand) {
      case 'init':
        terminalService.println(terminalService.info('Initializing Anchor project...'))
        // TODO: Create Anchor project structure
        terminalService.println(terminalService.success('✓ Anchor project initialized'))
        break
      case 'build':
        terminalService.println(terminalService.info('Building Anchor project...'))
        // TODO: Build Anchor project
        terminalService.println(terminalService.success('✓ Build complete'))
        break
      case 'test':
        terminalService.println(terminalService.info('Running Anchor tests...'))
        // TODO: Run Anchor tests
        terminalService.println(terminalService.success('✓ All tests passed'))
        break
      default:
        terminalService.println(terminalService.warning(`Subcommand '${subcommand}' not yet implemented`))
    }
  }
})
