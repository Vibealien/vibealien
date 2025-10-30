/**
 * EditorMain Component
 * Main editor area with tabs, code editor, and status bar
 */

import React from 'react'
import { EditorTabs } from './EditorTabs'
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor'
import { StatusBar } from './StatusBar'
import type { ProjectFile } from '@/lib/types'
import type * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

interface EditorMainProps {
  openFiles: ProjectFile[]
  activeFile: ProjectFile | null
  onTabSelect: (fileId: string) => void
  onTabClose: (fileId: string) => void
  onTabReorder: (files: ProjectFile[]) => void
  onCodeChange: (value: string | undefined) => void
  onSave: () => void
  yDoc: Y.Doc | null
  yProvider: WebsocketProvider | null
  cursorPosition: { line: number; column: number }
  selectedCount: number
  isOnline: boolean
  pendingSync: number
  onCursorChange: (position: { lineNumber: number; column: number }) => void
  onSelectionChange: (selectionLength: number) => void
}

export function EditorMain({
  openFiles,
  activeFile,
  onTabSelect,
  onTabClose,
  onTabReorder,
  onCodeChange,
  onSave,
  yDoc,
  yProvider,
  cursorPosition,
  selectedCount,
  isOnline,
  pendingSync,
  onCursorChange,
  onSelectionChange,
}: EditorMainProps) {
  return (
    <div className="flex-grow flex flex-col mt-0">
      <EditorTabs
        files={openFiles}
        activeFileId={activeFile?.id || null}
        onTabSelect={onTabSelect}
        onTabClose={onTabClose}
        onTabReorder={onTabReorder}
      />
      
      <div className="flex-grow">
        {activeFile ? (
          <CollaborativeCodeEditor
            fileId={activeFile.id}
            filePath={activeFile.path}
            value={activeFile.content}
            language={activeFile.language}
            onChange={onCodeChange}
            onSave={onSave}
            yDoc={yDoc}
            yProvider={yProvider}
            onCursorChange={onCursorChange}
            onSelectionChange={onSelectionChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/40 font-['Inter']">Select a file to start coding</p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {activeFile && (
        <StatusBar
          line={cursorPosition.line}
          column={cursorPosition.column}
          language={activeFile.language}
          totalLines={activeFile.content ? activeFile.content.split('\n').length : 0}
          selectedCount={selectedCount > 0 ? selectedCount : undefined}
          encoding="UTF-8"
          lineEnding="LF"
          isOnline={isOnline}
          pendingSync={pendingSync}
        />
      )}
    </div>
  )
}
