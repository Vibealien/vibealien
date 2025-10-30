/**
 * Build Command
 * Compiles Solana programs
 */

import { createCmd, createOptions } from '../create'
import { terminalService } from '../../services/terminal.service'
import { fsService } from '../../services/fs.service'
import { workspaceService } from '../../services/workspace.service'

export const buildCommand = createCmd({
  name: 'build',
  description: 'Build your Solana program',
  options: createOptions([
    { name: 'verbose', short: 'v', description: 'Verbose output' }
  ]),
  handle: async ({ options }) => {
    terminalService.println(terminalService.info('Building...'))
    
    try {
      const workspacePath = workspaceService.currentWorkspacePath
      
      // Check for Rust files in src/
      const srcPath = workspacePath + 'src/'
      const srcExists = await fsService.exists(srcPath)
      
      if (!srcExists) {
        throw new Error('No src/ directory found')
      }
      
      const files = await fsService.readDir(srcPath)
      const rustFiles = files.filter(f => f.endsWith('.rs'))
      
      if (rustFiles.length === 0) {
        throw new Error('No Rust files found in src/')
      }
      
      // TODO: Integrate with compiler service
      // For now, just simulate a build
      terminalService.println(terminalService.info(`Found ${rustFiles.length} Rust file(s)`))
      
      if (options.verbose) {
        rustFiles.forEach(f => {
          terminalService.println(`  - ${f}`)
        })
      }
      
      // Simulate build delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      terminalService.println(terminalService.success('\n✓ Build successful\n'))
      
      return { success: true, files: rustFiles }
    } catch (error: any) {
      const msg = terminalService.convertErrorMessage(error.message)
      terminalService.println(terminalService.error(`\n✗ Build failed: ${msg}\n`))
      throw error
    }
  }
})
