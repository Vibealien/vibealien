/**
 * EditorHeader Component
 * Top bar with navigation, project info, and action buttons
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Project } from '@/lib/types'

interface EditorHeaderProps {
  project: Project | null
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  hasUnsavedChanges: boolean
  isSaving: boolean
  isConnected: boolean
  activeUsersCount: number
  onSave: () => void
  onSync: () => void
  onCollaborate: () => void
}

export function EditorHeader({
  project,
  isOnline,
  pendingCount,
  isSyncing,
  hasUnsavedChanges,
  isSaving,
  isConnected,
  activeUsersCount,
  onSave,
  onSync,
  onCollaborate,
}: EditorHeaderProps) {
  const router = useRouter()

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-[#7B2FF7]/20 bg-[#0C0C1E]">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {project && (
          <div>
            <h1 className="font-['Orbitron'] font-bold text-white">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs text-white/40 font-['Inter']">
                {project.description}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Offline Status */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-yellow-500/20 border border-yellow-500/50">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-300 font-['Inter']">Offline Mode</span>
          </div>
        )}
        
        {/* Sync Button */}
        {pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={!isOnline || isSyncing}
            className="border-[#00FFA3]/50"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <span className="text-[#00FFA3] mr-1">↻</span>
                Sync ({pendingCount})
              </>
            )}
          </Button>
        )}
        
        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <span className="text-xs text-[#00FFA3] font-['Inter']">Unsaved changes</span>
        )}
        
        {/* Save Button */}
        <Button
          variant="cosmic"
          size="sm"
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-3 h-3 mr-1" />
              Save
            </>
          )}
        </Button>

        {/* Collaborate Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onCollaborate}
          className={isConnected ? 'border-[#00FFA3]/50' : ''}
        >
          <Users className={`w-3 h-3 mr-1 ${isConnected ? 'text-[#00FFA3]' : ''}`} />
          Collaborate {activeUsersCount > 0 && `(${activeUsersCount})`}
        </Button>
      </div>
    </div>
  )
}
