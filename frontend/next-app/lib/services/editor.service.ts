/**
 * Editor Service - Centralized file and editor state management
 * Inspired by Solana Playground's PgExplorer architecture
 */

import * as monaco from 'monaco-editor'
import type { ProjectFile } from '../types'

interface EditorPosition {
  cursor: { from: number; to: number }
  topLineNumber: number
  scrollTop: number
}

interface FileMetadata {
  position?: EditorPosition
  isDirty?: boolean
  lastModified?: number
}

interface EditorState {
  files: Map<string, ProjectFile>
  openTabs: string[] // file IDs
  activeFileId: string | null
  models: Map<string, monaco.editor.ITextModel>
  metadata: Map<string, FileMetadata>
}

type EventCallback = (...args: any[]) => void

class EditorService {
  private state: EditorState = {
    files: new Map(),
    openTabs: [],
    activeFileId: null,
    models: new Map(),
    metadata: new Map(),
  }

  private editor: monaco.editor.IStandaloneCodeEditor | null = null
  private eventListeners: Map<string, EventCallback[]> = new Map()
  private autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map()

  // Event types
  readonly events = {
    FILE_OPENED: 'editor:file:opened',
    FILE_CLOSED: 'editor:file:closed',
    FILE_CHANGED: 'editor:file:changed',
    TABS_CHANGED: 'editor:tabs:changed',
    ACTIVE_FILE_CHANGED: 'editor:active:changed',
  } as const

  /**
   * Initialize the editor service with a Monaco editor instance
   */
  setEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor

    // Listen to content changes for auto-save
    editor.onDidChangeModelContent(() => {
      const activeFileId = this.state.activeFileId
      if (!activeFileId) return

      // Mark as dirty
      const metadata = this.state.metadata.get(activeFileId) || {}
      metadata.isDirty = true
      metadata.lastModified = Date.now()
      this.state.metadata.set(activeFileId, metadata)

      // Debounced auto-save
      this.scheduleAutoSave(activeFileId)

      // Emit change event
      this.emit(this.events.FILE_CHANGED, activeFileId)
    })

    // Listen to cursor position changes
    editor.onDidChangeCursorPosition(() => {
      this.saveEditorPosition()
    })

    // Listen to scroll position changes
    editor.onDidScrollChange(() => {
      this.saveEditorPosition()
    })
  }

  /**
   * Load files into the service
   */
  loadFiles(files: ProjectFile[]) {
    this.state.files.clear()
    files.forEach((file) => {
      this.state.files.set(file.id, file)
    })
  }

  /**
   * Add or update a single file
   */
  updateFile(file: ProjectFile) {
    this.state.files.set(file.id, file)
    
    // Update model if it exists
    const model = this.state.models.get(file.id)
    if (model && model.getValue() !== file.content) {
      model.setValue(file.content)
    }
  }

  /**
   * Remove a file
   */
  removeFile(fileId: string) {
    this.state.files.delete(fileId)
    this.state.metadata.delete(fileId)
    
    // Dispose model
    const model = this.state.models.get(fileId)
    if (model) {
      model.dispose()
      this.state.models.delete(fileId)
    }

    // Remove from tabs
    if (this.state.openTabs.includes(fileId)) {
      this.closeFile(fileId)
    }
  }

  /**
   * Open a file in a tab and switch to it
   */
  openFile(fileId: string) {
    const file = this.state.files.get(fileId)
    if (!file) {
      console.warn(`File ${fileId} not found`)
      return
    }

    // Add to tabs if not already open
    if (!this.state.openTabs.includes(fileId)) {
      this.state.openTabs.push(fileId)
      this.emit(this.events.TABS_CHANGED, this.state.openTabs)
    }

    // Don't switch if already active
    if (this.state.activeFileId === fileId) return

    // Save position of current file before switching
    if (this.state.activeFileId) {
      this.saveEditorPosition()
    }

    // Switch to the file
    this.state.activeFileId = fileId
    this.switchEditorModel(fileId)
    this.emit(this.events.FILE_OPENED, file)
    this.emit(this.events.ACTIVE_FILE_CHANGED, file)
  }

  /**
   * Close a file tab
   */
  closeFile(fileId: string) {
    const index = this.state.openTabs.indexOf(fileId)
    if (index === -1) return

    // Save position before closing
    if (this.state.activeFileId === fileId) {
      this.saveEditorPosition()
    }

    // Remove from tabs
    this.state.openTabs.splice(index, 1)

    // If closing active file, switch to another
    if (this.state.activeFileId === fileId) {
      const newFileId =
        this.state.openTabs[index] ?? // Next tab
        this.state.openTabs[index - 1] ?? // Previous tab
        null

      if (newFileId) {
        this.openFile(newFileId)
      } else {
        this.state.activeFileId = null
        if (this.editor) {
          this.editor.setModel(null)
        }
      }
    }

    this.emit(this.events.FILE_CLOSED, fileId)
    this.emit(this.events.TABS_CHANGED, this.state.openTabs)
  }

  /**
   * Reorder tabs
   */
  reorderTabs(newOrder: string[]) {
    this.state.openTabs = newOrder
    this.emit(this.events.TABS_CHANGED, this.state.openTabs)
  }

  /**
   * Get or create a Monaco model for a file
   */
  private getOrCreateModel(fileId: string): monaco.editor.ITextModel | null {
    const file = this.state.files.get(fileId)
    if (!file) return null

    // Return existing model
    let model = this.state.models.get(fileId)
    if (model && !model.isDisposed()) {
      return model
    }

    // Create new model
    const uri = monaco.Uri.parse(`file:///${file.path}`)
    model = monaco.editor.createModel(file.content, file.language, uri)
    this.state.models.set(fileId, model)

    return model
  }

  /**
   * Switch the editor to a different file's model
   */
  private switchEditorModel(fileId: string) {
    if (!this.editor) return

    const model = this.getOrCreateModel(fileId)
    if (!model) return

    // Set the model
    this.editor.setModel(model)

    // Restore saved position
    const metadata = this.state.metadata.get(fileId)
    if (metadata?.position) {
      const { cursor, topLineNumber, scrollTop } = metadata.position

      // Restore cursor position
      const startPos = model.getPositionAt(cursor.from)
      const endPos = model.getPositionAt(cursor.to)
      this.editor.setSelection({
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column,
      })

      // Restore scroll position
      if (scrollTop !== undefined) {
        this.editor.setScrollTop(scrollTop)
      } else if (topLineNumber) {
        this.editor.setScrollTop(this.editor.getTopForLineNumber(topLineNumber))
      }
    }

    // Focus editor
    this.editor.focus()
  }

  /**
   * Save current editor position for active file
   */
  private saveEditorPosition() {
    if (!this.editor || !this.state.activeFileId) return

    const model = this.editor.getModel()
    const selection = this.editor.getSelection()
    if (!model || !selection) return

    const metadata = this.state.metadata.get(this.state.activeFileId) || {}
    metadata.position = {
      cursor: {
        from: model.getOffsetAt(selection.getStartPosition()),
        to: model.getOffsetAt(selection.getEndPosition()),
      },
      topLineNumber: this.editor.getVisibleRanges()[0]?.startLineNumber || 1,
      scrollTop: this.editor.getScrollTop(),
    }
    this.state.metadata.set(this.state.activeFileId, metadata)
  }

  /**
   * Schedule auto-save for a file
   */
  private scheduleAutoSave(fileId: string) {
    // Clear existing timeout
    const existingTimeout = this.autoSaveTimeouts.get(fileId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Schedule new save
    const timeout = setTimeout(() => {
      this.saveFile(fileId)
    }, 500) // 500ms delay like Solana Playground

    this.autoSaveTimeouts.set(fileId, timeout)
  }

  /**
   * Save file content (to be called by external save handler)
   */
  private saveFile(fileId: string) {
    const model = this.state.models.get(fileId)
    if (!model) return

    const file = this.state.files.get(fileId)
    if (!file) return

    const content = model.getValue()
    if (file.content === content) return

    // Update file content
    file.content = content

    // Mark as clean
    const metadata = this.state.metadata.get(fileId) || {}
    metadata.isDirty = false
    this.state.metadata.set(fileId, metadata)

    // Emit save event (external handlers can listen to this)
    this.emit('editor:file:save', fileId, content)
  }

  /**
   * Force save current file
   */
  forceSave() {
    if (this.state.activeFileId) {
      this.saveFile(this.state.activeFileId)
    }
  }

  /**
   * Get current file content from editor
   */
  getCurrentContent(): string | null {
    return this.editor?.getValue() ?? null
  }

  /**
   * Event emitter - made public for external use
   */
  emit(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((callback) => callback(...args))
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event) || []
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Clear all timeouts
    this.autoSaveTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.autoSaveTimeouts.clear()

    // Dispose all models
    this.state.models.forEach((model) => model.dispose())
    this.state.models.clear()

    // Clear listeners
    this.eventListeners.clear()

    // Clear state
    this.state.files.clear()
    this.state.openTabs = []
    this.state.activeFileId = null
    this.state.metadata.clear()

    this.editor = null
  }

  // Getters
  get files() {
    return Array.from(this.state.files.values())
  }

  get openTabs() {
    return this.state.openTabs.map((id) => this.state.files.get(id)!).filter(Boolean)
  }

  get activeFile() {
    return this.state.activeFileId
      ? this.state.files.get(this.state.activeFileId) ?? null
      : null
  }

  get isDirty() {
    return this.state.activeFileId
      ? this.state.metadata.get(this.state.activeFileId)?.isDirty ?? false
      : false
  }
}

// Export singleton instance
export const editorService = new EditorService()
