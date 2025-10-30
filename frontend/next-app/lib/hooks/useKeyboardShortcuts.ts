/**
 * useKeyboardShortcuts Hook
 * Centralized keyboard shortcut handling for the editor
 * Separates keyboard event logic from component code
 */

import { useEffect } from 'react'

export interface KeyboardShortcutHandlers {
  onSave?: () => void
  onNewFile?: () => void
  onCloseTab?: () => void
  onFind?: () => void
  onReplace?: () => void
  onToggleTerminal?: () => void
  onToggleSidebar?: () => void
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd + S - Save
      if (modifier && e.key === 's') {
        e.preventDefault()
        handlers.onSave?.()
      }

      // Ctrl/Cmd + N - New File
      if (modifier && e.key === 'n') {
        e.preventDefault()
        handlers.onNewFile?.()
      }

      // Ctrl/Cmd + W - Close Tab
      if (modifier && e.key === 'w') {
        e.preventDefault()
        handlers.onCloseTab?.()
      }

      // Ctrl/Cmd + F - Find
      if (modifier && e.key === 'f') {
        e.preventDefault()
        handlers.onFind?.()
      }

      // Ctrl/Cmd + H - Replace
      if (modifier && e.key === 'h') {
        e.preventDefault()
        handlers.onReplace?.()
      }

      // Ctrl/Cmd + ` - Toggle Terminal
      if (modifier && e.key === '`') {
        e.preventDefault()
        handlers.onToggleTerminal?.()
      }

      // Ctrl/Cmd + B - Toggle Sidebar
      if (modifier && e.key === 'b') {
        e.preventDefault()
        handlers.onToggleSidebar?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, enabled])
}
