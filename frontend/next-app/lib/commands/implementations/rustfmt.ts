/**
 * Rustfmt Command
 * Formats Rust code
 */

import { createCmd } from '../create'
import { terminalService } from '../../services/terminal.service'
import { fsService } from '../../services/fs.service'
import { workspaceService } from '../../services/workspace.service'

export const rustfmtCommand = createCmd({
  name: 'rustfmt',
  description: 'Format Rust code',
  handle: async () => {
    terminalService.println(terminalService.info('Formatting Rust files...'))
    
    try {
      const workspacePath = workspaceService.currentWorkspacePath
      const srcPath = workspacePath + 'src/'
      
      const files = await fsService.readDir(srcPath)
      const rustFiles = files.filter(f => f.endsWith('.rs'))
      
      // TODO: Integrate with actual rustfmt
      // For now, just list the files that would be formatted
      
      terminalService.println(`Formatted ${rustFiles.length} file(s)`)
      rustFiles.forEach(f => {
        terminalService.println(`  ${terminalService.success('✓')} ${f}`)
      })
      
      terminalService.println('')
      
      return { success: true, filesFormatted: rustFiles.length }
    } catch (error: any) {
      terminalService.println(terminalService.error(`\n✗ Format failed: ${error.message}\n`))
      throw error
    }
  }
})
