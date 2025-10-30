/**
 * Editor Page - New Panel-Based Layout
 * Uses solpg-inspired three-panel design with modern React architecture
 */

'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Context
import { EditorProvider, useEditor } from '@/lib/contexts/EditorContext'

// Components
import { PlaygroundPanels } from '@/components/playground/Panels'
import { EditorErrorBoundary } from '@/components/editor/EditorErrorBoundary'

/**
 * Inner Editor Component (has access to EditorContext)
 */
function EditorContent() {
  const { project, isLoading } = useEditor()

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0C0C1E]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#7B2FF7] mx-auto mb-4" />
          <p className="text-white/80 font-['Orbitron']">Loading project...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!project && !isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0C0C1E]">
        <div className="text-center">
          <p className="text-red-400 font-['Orbitron'] text-lg mb-2">
            Failed to load project
          </p>
        </div>
      </div>
    )
  }

  return <PlaygroundPanels />
}

/**
 * Main Editor Page (sets up context)
 */
export default function EditorPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <EditorErrorBoundary>
      <EditorProvider projectId={projectId}>
        <EditorContent />
      </EditorProvider>
    </EditorErrorBoundary>
  )
}
