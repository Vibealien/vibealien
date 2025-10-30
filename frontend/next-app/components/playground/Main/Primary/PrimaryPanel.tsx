/**
 * Primary Panel - Main code editor area
 * Contains tabs, editor, and status bar
 */

'use client'

import React from 'react'
import { useEditor } from '@/lib/contexts/EditorContext'
import { EditorTabs } from '@/components/editor/EditorTabs'
import { CollaborativeCodeEditor } from '@/components/editor/CollaborativeCodeEditor'
import { StatusBar } from '@/components/editor/StatusBar'

export function PrimaryPanel() {
  const {
    openFiles,
    activeFile,
    setActiveFile,
    closeFile,
    reorderTabs,
    cursorPosition,
    selectedCount,
    isOnline,
    pendingCount,
  } = useEditor()

  const [editorContent, setEditorContent] = React.useState('')
  const [yDoc, setYDoc] = React.useState<any>(null)
  const [yProvider, setYProvider] = React.useState<any>(null)

  // Sync content when active file changes
  React.useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content || '')
    } else {
      setEditorContent('')
    }
  }, [activeFile?.id]) // Only depend on ID

  const handleCodeChange = React.useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value)
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tabs */}
      <EditorTabs
        files={openFiles}
        activeFileId={activeFile?.id || null}
        onTabSelect={(fileId) => {
          const file = openFiles.find(f => f.id === fileId)
          if (file) setActiveFile(file)
        }}
        onTabClose={closeFile}
        onTabReorder={reorderTabs}
      />

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <CollaborativeCodeEditor
            fileId={activeFile.id}
            filePath={activeFile.path}
            value={editorContent}
            language={activeFile.language}
            onChange={handleCodeChange}
            onSave={() => {}}
            yDoc={yDoc}
            yProvider={yProvider}
            onCursorChange={() => {}}
            onSelectionChange={() => {}}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/60 font-['Orbitron'] text-lg mb-2">
                No file selected
              </p>
              <p className="text-white/40 font-['Inter'] text-sm">
                Select a file from the explorer to start coding
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {activeFile && (
        <StatusBar
          line={cursorPosition.line}
          column={cursorPosition.column}
          language={activeFile.language}
          totalLines={(editorContent || '').split('\n').length}
          selectedCount={selectedCount > 0 ? selectedCount : undefined}
          encoding="UTF-8"
          lineEnding="LF"
          isOnline={isOnline}
          pendingSync={pendingCount}
        />
      )}
    </div>
  )
}
