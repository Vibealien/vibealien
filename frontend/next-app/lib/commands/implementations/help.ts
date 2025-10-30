/**
 * Help Command
 * Displays all available commands
 */

import { createCmd } from '../create'
import { commandManager } from '../manager'
import { terminalService } from '../../services/terminal.service'

export const helpCommand = createCmd({
  name: 'help',
  description: 'Display help information',
  handle: () => {
    const commands = commandManager.getAll()
    
    terminalService.println(terminalService.bold('\nAvailable Commands:\n'))
    
    commands.forEach(cmd => {
      const name = terminalService.primary(cmd.name.padEnd(15))
      const desc = cmd.description
      terminalService.println(`  ${name} ${desc}`)
    })
    
    terminalService.println('')
  }
})
