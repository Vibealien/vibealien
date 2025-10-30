'use client'

import React, { useEffect, useRef, useState } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import { editorService } from '@/lib/services'
import { explorerService } from '@/lib/services/explorer.service'

// Dynamic import for MonacoBinding to avoid SSR issues
let MonacoBinding: any = null

// Load MonacoBinding dynamically on client side
const loadMonacoBinding = async () => {
  if (!MonacoBinding && typeof window !== 'undefined') {
    const module = await import('y-monaco')
    MonacoBinding = module.MonacoBinding
  }
  return MonacoBinding
}

interface CollaborativeEditorProps {
  fileId: string
  filePath: string // Add filePath for model caching
  value: string
  language: string
  onChange: (value: string | undefined) => void
  onSave?: () => void
  readOnly?: boolean
  yDoc?: Y.Doc | null
  yProvider?: WebsocketProvider | null
  onCursorChange?: (position: { lineNumber: number; column: number }) => void
  onSelectionChange?: (selectionLength: number) => void
}

export const CollaborativeCodeEditor: React.FC<CollaborativeEditorProps> = ({
  fileId,
  filePath,
  value,
  language,
  onChange,
  onSave,
  readOnly = false,
  yDoc,
  yProvider,
  onCursorChange,
  onSelectionChange,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof Monaco | null>(null)
  const bindingRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const positionSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Register editor with service only once
    if (!isInitializedRef.current) {
      editorService.setEditor(editor)
      isInitializedRef.current = true
    }

    // Configure editor theme
    monaco.editor.defineTheme('vibealien-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '7B2FF7', fontStyle: 'bold' },
        { token: 'string', foreground: '00FFA3' },
        { token: 'comment', foreground: '3A3A5A', fontStyle: 'italic' },
        { token: 'number', foreground: '00FFA3' },
        { token: 'function', foreground: '9A4EFF' },
        { token: 'type', foreground: '7B2FF7' },
      ],
      colors: {
        'editor.background': '#0C0C1E',
        'editor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#1E1E3F',
        'editor.selectionBackground': '#7B2FF740',
        'editor.inactiveSelectionBackground': '#7B2FF720',
        'editorCursor.foreground': '#00FFA3',
        'editorLineNumber.foreground': '#3A3A5A',
        'editorLineNumber.activeForeground': '#7B2FF7',
      },
    })

    monaco.editor.setTheme('vibealien-dark')

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.()
    })

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        })
      }
    })

    // Track text selection
    editor.onDidChangeCursorSelection((e) => {
      if (onSelectionChange) {
        const model = editor.getModel()
        if (model) {
          const selectedText = model.getValueInRange(e.selection)
          onSelectionChange(selectedText.length)
        }
      }
    })

    // Restore cursor position from explorerService
    const position = explorerService.getEditorPosition(filePath)
    const model = editor.getModel()
    
    if (model && position) {
      // Use requestAnimationFrame to ensure editor layout is complete
      requestAnimationFrame(() => {
        try {
          // Scroll to saved line (with safety check)
          if (position.topLineNumber) {
            const scrollTop = editor.getTopForLineNumber(position.topLineNumber)
            if (scrollTop !== undefined && scrollTop !== null) {
              editor.setScrollTop(scrollTop)
            }
          }

          // Set cursor position
          const startPos = model.getPositionAt(position.cursor.from)
          const endPos = model.getPositionAt(position.cursor.to)
          editor.setSelection({
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column
          })
        } catch (error) {
          console.warn('Failed to restore editor position:', error)
        }
      })
    }

    // Focus editor
    editor.focus()
  }

  // Save cursor position periodically (like solpg)
  useEffect(() => {
    if (!editorRef.current) return

    const editor = editorRef.current

    positionSaveIntervalRef.current = setInterval(() => {
      const model = editor.getModel()
      const selection = editor.getSelection()
      
      if (!model || !selection) return

      // Safely get visible ranges with fallback
      const visibleRanges = editor.getVisibleRanges()
      const topLineNumber = visibleRanges && visibleRanges.length > 0 
        ? visibleRanges[0].startLineNumber 
        : 1

      explorerService.saveEditorPosition(filePath, {
        topLineNumber,
        cursor: {
          from: model.getOffsetAt(selection.getStartPosition()),
          to: model.getOffsetAt(selection.getEndPosition())
        }
      })
    }, 1000)

    return () => {
      if (positionSaveIntervalRef.current) {
        clearInterval(positionSaveIntervalRef.current)
      }
    }
  }, [filePath])

  // Main editor state management (similar to solpg's switchFile handler)
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    let contentChangeDisposable: Monaco.IDisposable | null = null
    let autoSaveTimeoutId: NodeJS.Timeout | null = null

    // Clear previous bindings
    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    // Wait for Monaco to create/get the model for the current file
    // Monaco Editor component handles model creation via the `path` prop
    requestAnimationFrame(() => {
      const model = editor.getModel()
      if (!model) return

      // Restore scroll position after model is set
      const position = explorerService.getEditorPosition(filePath)
      if (position && position.topLineNumber) {
        requestAnimationFrame(() => {
          try {
            const scrollTop = editor.getTopForLineNumber(position.topLineNumber!)
            if (scrollTop !== undefined && scrollTop !== null) {
              editor.setScrollTop(scrollTop)
            }
            
            // Set cursor position
            const startPos = model.getPositionAt(position.cursor.from)
            const endPos = model.getPositionAt(position.cursor.to)
            editor.setSelection({
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column
            })
          } catch (err) {
            console.warn('Failed to restore position after model switch:', err)
          }
        })
      }

      // Handle collaborative mode
      if (yDoc && yProvider) {
        const setupCollaboration = async () => {
          try {
            const YMonacoBinding = await loadMonacoBinding()
            if (!YMonacoBinding) return

            const yText = yDoc.getText('content')
            
            // Initialize with current value if yText is empty
            if (yText.length === 0 && value) {
              yText.insert(0, value)
            }

            // Create Monaco binding
            bindingRef.current = new YMonacoBinding(
              yText,
              model,
              new Set([editor]),
              yProvider.awareness
            )
          } catch (error) {
            console.error('Failed to load MonacoBinding:', error)
          }
        }
        
        setupCollaboration()
      } else {
        // Handle content changes for non-collaborative mode (like solpg)
        contentChangeDisposable = model.onDidChangeContent(() => {
          const newContent = model.getValue()
          
          // CRITICAL: Save to explorerService state immediately (like solpg)
          explorerService.saveFileToState(filePath, newContent)
          
          // Immediate onChange for UI updates
          onChange(newContent)
          
          // Clear existing timeout
          if (autoSaveTimeoutId) {
            clearTimeout(autoSaveTimeoutId)
          }
          
          // Debounced auto-save to IndexedDB (500ms like Solana Playground)
          autoSaveTimeoutId = setTimeout(() => {
            editorService.emit('editor:file:autosave', fileId, newContent)
          }, 500)
        })
      }
    })

    return () => {
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId)
      }
      if (contentChangeDisposable) {
        contentChangeDisposable.dispose()
      }
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }
    }
  }, [fileId, filePath, language, yDoc, yProvider]) // Only re-setup when file or collab state changes, NOT when onChange changes

  return (
    <div className="h-full w-full relative bg-[#0C0C1E]">
      <Editor
        height="100%"
        language={language}
        defaultValue={value} // Use defaultValue instead of value to prevent remounting
        path={filePath} // Use actual file path for proper model caching
        onMount={handleEditorDidMount}
        options={{
          // Appearance
          minimap: { enabled: true, side: 'right', maxColumn: 120 },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 4,
          glyphMargin: true,
          folding: true,
          foldingStrategy: 'indentation',
          renderLineHighlight: 'all',
          renderLineHighlightOnlyWhenFocus: false,
          wordWrap: 'off',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          renderControlCharacters: false,
          
          // Brackets & indentation
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          
          // Cursor & scrolling
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          cursorStyle: 'line',
          cursorWidth: 2,
          smoothScrolling: true,
          mouseWheelZoom: true,
          
          // Editing features
          readOnly,
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: 'full',
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          trimAutoWhitespace: true,
          
          // IntelliSense & suggestions
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'matchingDocuments',
          suggestSelection: 'first',
          
          // Code lens & hover
          codeLens: true,
          hover: {
            enabled: true,
            delay: 300,
          },
          
          // Find & replace
          find: {
            seedSearchStringFromSelection: 'selection',
            autoFindInSelection: 'multiline',
            addExtraSpaceOnTop: true,
          },
          
          // Scrollbar
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 14,
          },
          
          // Performance
          renderValidationDecorations: 'on',
          occurrencesHighlight: 'singleFile',
          selectionHighlight: true,
          matchBrackets: 'always',
        }}
      />
    </div>
  )
}
