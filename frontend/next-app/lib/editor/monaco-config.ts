/**
 * Monaco Editor Configuration
 * Enhanced editor settings, themes, and keybindings
 * Inspired by Solana Playground with modern best practices
 */

import type { editor } from 'monaco-editor'
import type * as Monaco from 'monaco-editor'

/**
 * Custom Vibealien Dark Theme
 * Cosmic purple/cyan color scheme
 */
export const VIBEALIEN_THEME: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Keywords (purple)
    { token: 'keyword', foreground: '7B2FF7', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: '7B2FF7', fontStyle: 'bold' },
    { token: 'storage.type', foreground: '7B2FF7' },
    { token: 'storage.modifier', foreground: '7B2FF7' },
    
    // Strings (green/cyan)
    { token: 'string', foreground: '00FFA3' },
    { token: 'string.quoted', foreground: '00FFA3' },
    { token: 'string.template', foreground: '00D4FF' },
    
    // Comments (dark gray with italic)
    { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
    { token: 'comment.line', foreground: '6B7280', fontStyle: 'italic' },
    { token: 'comment.block', foreground: '6B7280', fontStyle: 'italic' },
    
    // Numbers (cyan)
    { token: 'constant.numeric', foreground: '00D4FF' },
    { token: 'number', foreground: '00D4FF' },
    
    // Functions (light purple)
    { token: 'entity.name.function', foreground: '9A4EFF' },
    { token: 'support.function', foreground: '9A4EFF' },
    { token: 'function', foreground: '9A4EFF' },
    
    // Types (purple)
    { token: 'entity.name.type', foreground: '7B2FF7' },
    { token: 'entity.name.class', foreground: '7B2FF7' },
    { token: 'support.type', foreground: '7B2FF7' },
    { token: 'type', foreground: '7B2FF7' },
    
    // Variables (white)
    { token: 'variable', foreground: 'E5E7EB' },
    { token: 'variable.parameter', foreground: 'F3F4F6' },
    
    // Operators (cyan)
    { token: 'keyword.operator', foreground: '00D4FF' },
    { token: 'punctuation', foreground: '9CA3AF' },
    
    // Special (pink/magenta)
    { token: 'constant.language', foreground: 'FF6B9D' },
    { token: 'support.constant', foreground: 'FF6B9D' },
    { token: 'meta.tag', foreground: 'FF6B9D' },
  ],
  colors: {
    // Editor background
    'editor.background': '#0C0C1E',
    'editor.foreground': '#E5E7EB',
    
    // Line highlighting
    'editor.lineHighlightBackground': '#1E1E3F',
    'editor.lineHighlightBorder': '#00000000',
    
    // Selection
    'editor.selectionBackground': '#7B2FF740',
    'editor.selectionHighlightBackground': '#7B2FF720',
    'editor.inactiveSelectionBackground': '#7B2FF720',
    
    // Cursor
    'editorCursor.foreground': '#00FFA3',
    'editorCursor.background': '#0C0C1E',
    
    // Line numbers
    'editorLineNumber.foreground': '#4B5563',
    'editorLineNumber.activeForeground': '#7B2FF7',
    
    // Indent guides
    'editorIndentGuide.background': '#1F2937',
    'editorIndentGuide.activeBackground': '#374151',
    
    // Bracket matching
    'editorBracketMatch.background': '#7B2FF720',
    'editorBracketMatch.border': '#7B2FF7',
    
    // Widget colors
    'editorWidget.background': '#1F2937',
    'editorWidget.border': '#7B2FF740',
    'editorSuggestWidget.background': '#1F2937',
    'editorSuggestWidget.border': '#7B2FF740',
    'editorSuggestWidget.selectedBackground': '#7B2FF740',
    
    // Hover widget
    'editorHoverWidget.background': '#1F2937',
    'editorHoverWidget.border': '#7B2FF740',
    
    // Gutter
    'editorGutter.background': '#0C0C1E',
    'editorGutter.modifiedBackground': '#00D4FF',
    'editorGutter.addedBackground': '#00FFA3',
    'editorGutter.deletedBackground': '#FF6B6B',
    
    // Scrollbar
    'scrollbarSlider.background': '#7B2FF740',
    'scrollbarSlider.hoverBackground': '#7B2FF760',
    'scrollbarSlider.activeBackground': '#7B2FF780',
    
    // Minimap
    'minimap.selectionHighlight': '#7B2FF740',
    'minimap.background': '#0A0A1A',
    
    // Find/replace
    'editor.findMatchBackground': '#00D4FF40',
    'editor.findMatchHighlightBackground': '#00D4FF20',
    'editor.findRangeHighlightBackground': '#00D4FF10',
  },
}

/**
 * Editor Options
 * Optimized settings for best coding experience
 */
export const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  // Font settings
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  fontSize: 14,
  fontLigatures: true,
  lineHeight: 22,
  letterSpacing: 0.5,
  
  // Line numbers
  lineNumbers: 'on',
  lineNumbersMinChars: 3,
  glyphMargin: false,
  
  // Cursor
  cursorStyle: 'line',
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  
  // Scrolling
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  mouseWheelScrollSensitivity: 1,
  fastScrollSensitivity: 5,
  
  // Minimap
  minimap: {
    enabled: true,
    side: 'right',
    showSlider: 'mouseover',
    renderCharacters: false,
  },
  
  // Indentation
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  
  // Word wrap
  wordWrap: 'off',
  wordWrapColumn: 120,
  wrappingIndent: 'same',
  
  // Suggestions
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true,
  },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'smart',
  tabCompletion: 'on',
  
  // IntelliSense
  parameterHints: {
    enabled: true,
    cycle: true,
  },
  
  // Hover
  hover: {
    enabled: true,
    delay: 300,
    sticky: true,
  },
  
  // Auto-closing
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'languageDefined',
  
  // Formatting
  formatOnPaste: true,
  formatOnType: false,
  
  // Brackets
  bracketPairColorization: {
    enabled: true,
  },
  guides: {
    bracketPairs: true,
    indentation: true,
  },
  
  // Selection
  selectionHighlight: true,
  occurrencesHighlight: 'singleFile',
  
  // Find
  find: {
    seedSearchStringFromSelection: 'selection',
    autoFindInSelection: 'never',
    addExtraSpaceOnTop: true,
  },
  
  // Rendering
  renderWhitespace: 'selection',
  renderControlCharacters: false,
  renderLineHighlight: 'all',
  renderLineHighlightOnlyWhenFocus: false,
  
  // Accessibility
  accessibilitySupport: 'auto',
  
  // Performance
  automaticLayout: true,
  
  // Padding
  padding: {
    top: 16,
    bottom: 16,
  },
  
  // Folding
  folding: true,
  foldingStrategy: 'indentation',
  showFoldingControls: 'mouseover',
  
  // Links
  links: true,
  
  // Context menu
  contextmenu: true,
  
  // Multi-cursor
  multiCursorModifier: 'alt',
  multiCursorPaste: 'spread',
  
  // Sticky scroll
  stickyScroll: {
    enabled: true,
  },
}

/**
 * Read-only editor options
 */
export const READONLY_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  ...EDITOR_OPTIONS,
  readOnly: true,
  domReadOnly: true,
  cursorStyle: 'underline-thin',
  renderValidationDecorations: 'off',
}

/**
 * Setup keyboard shortcuts
 */
export function setupKeybindings(
  editor: editor.IStandaloneCodeEditor,
  monaco: typeof Monaco,
  callbacks: {
    onSave?: () => void
    onFormat?: () => void
    onFind?: () => void
    onReplace?: () => void
    onCommandPalette?: () => void
  }
) {
  const { onSave, onFormat, onFind, onReplace, onCommandPalette } = callbacks

  // Save: Cmd/Ctrl + S
  if (onSave) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave()
    })
  }

  // Format: Shift + Alt + F
  if (onFormat) {
    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        onFormat()
      }
    )
  }

  // Find: Cmd/Ctrl + F
  if (onFind) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      onFind()
    })
  }

  // Replace: Cmd/Ctrl + H
  if (onReplace) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      onReplace()
    })
  }

  // Command Palette: Cmd/Ctrl + Shift + P
  if (onCommandPalette) {
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      () => {
        onCommandPalette()
      }
    )
  }

  // Additional useful shortcuts
  
  // Toggle comment: Cmd/Ctrl + /
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
    editor.trigger('keyboard', 'editor.action.commentLine', {})
  })

  // Duplicate line: Shift + Alt + Down/Up
  editor.addCommand(
    monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
    () => {
      editor.trigger('keyboard', 'editor.action.copyLinesDownAction', {})
    }
  )

  editor.addCommand(
    monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
    () => {
      editor.trigger('keyboard', 'editor.action.copyLinesUpAction', {})
    }
  )

  // Move line: Alt + Down/Up
  editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
    editor.trigger('keyboard', 'editor.action.moveLinesDownAction', {})
  })

  editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
    editor.trigger('keyboard', 'editor.action.moveLinesUpAction', {})
  })

  // Multi-cursor: Cmd/Ctrl + Alt + Down/Up
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
    () => {
      editor.trigger('keyboard', 'editor.action.insertCursorBelow', {})
    }
  )

  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
    () => {
      editor.trigger('keyboard', 'editor.action.insertCursorAbove', {})
    }
  )
}

/**
 * Configure language-specific settings
 */
export function configureLanguage(
  monaco: typeof Monaco,
  language: string
) {
  switch (language) {
    case 'rust':
      monaco.languages.setLanguageConfiguration('rust', {
        comments: {
          lineComment: '//',
          blockComment: ['/*', '*/'],
        },
        brackets: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')'],
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: '`', close: '`' },
          { open: '/*', close: '*/' },
        ],
        surroundingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: '`', close: '`' },
        ],
        indentationRules: {
          increaseIndentPattern: /^.*\{[^}"']*$/,
          decreaseIndentPattern: /^\s*\}/,
        },
      })
      break

    case 'typescript':
    case 'javascript':
      // TypeScript/JavaScript already has good defaults
      break

    case 'json':
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: true,
        schemas: [],
        enableSchemaRequest: true,
      })
      break
  }
}

/**
 * Apply theme to Monaco
 */
export function applyTheme(monaco: typeof Monaco) {
  monaco.editor.defineTheme('vibealien-dark', VIBEALIEN_THEME)
  monaco.editor.setTheme('vibealien-dark')
}
