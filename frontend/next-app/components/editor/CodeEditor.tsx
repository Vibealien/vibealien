'use client'

import React, { useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string | undefined) => void
  onSave?: () => void
  readOnly?: boolean
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
  onSave,
  readOnly = false,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

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

    // Focus editor
    editor.focus()
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineNumbers: 'on',
          // rulers: [80, 120],
          wordWrap: 'off',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          readOnly,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
          // AI suggestions
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
        }}
      />
    </div>
  )
}
