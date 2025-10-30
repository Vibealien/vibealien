/**
 * Session management exports
 * Provides automatic session monitoring, token refresh, and logout on expiry
 */

export { sessionService } from './session.service'
export { useSessionMonitor } from '../hooks/useSessionMonitor'
export { SessionMonitor } from '../../components/session/SessionMonitor'

/**
 * Editor service exports
 * Centralized file and editor state management inspired by Solana Playground
 */

export { editorService } from './editor.service'

/**
 * File system and workspace services
 */

export { fsService } from './fs.service'
export { workspaceService } from './workspace.service'
export { explorerService } from './explorer.service'

/**
 * Terminal and command services
 */

export { terminalService } from './terminal.service'
export { historyService } from './history.service'
export { autocompleteService } from './autocomplete.service'
export { shellService } from './shell.service'

/**
 * AI and collaboration services
 */

export { aiChatService } from './ai-chat.service'
export { collaborationService } from './collaboration.service'

