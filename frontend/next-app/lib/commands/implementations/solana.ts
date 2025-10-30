/**
 * Solana Command
 * Passthrough to Solana CLI
 */

import { createCmd } from '../create'
import { terminalService } from '../../services/terminal.service'

export const solanaCommand = createCmd({
  name: 'solana',
  description: 'Solana CLI commands',
  handle: async ({ raw }) => {
    terminalService.println(terminalService.info(`Executing: solana ${raw}`))
    
    // TODO: Integrate with actual Solana CLI or WASM version
    // For now, handle some basic commands
    
    const args = raw.split(' ')
    const subcommand = args[0]
    
    switch (subcommand) {
      case 'balance':
        terminalService.println('5.0 SOL')
        break
      case 'airdrop':
        const amount = args[1] || '1'
        terminalService.println(terminalService.success(`Airdropped ${amount} SOL`))
        break
      case 'config':
        if (args[1] === 'get') {
          terminalService.println('RPC URL: https://api.devnet.solana.com')
          terminalService.println('WebSocket URL: wss://api.devnet.solana.com')
        }
        break
      default:
        terminalService.println(terminalService.warning(`Subcommand '${subcommand}' not yet implemented`))
    }
  }
})
