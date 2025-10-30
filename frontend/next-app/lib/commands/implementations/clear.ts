/**
 * Clear Command
 * Clears the terminal output
 */

import { createCmd } from '../create'
import { terminalService } from '../../services/terminal.service'

export const clearCommand = createCmd({
  name: 'clear',
  description: 'Clear terminal',
  handle: () => {
    terminalService.clear()
  }
})
