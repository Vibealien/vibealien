/**
 * useEditorUI Hook
 * Manages UI-specific state for the editor (modals, panels, sidebar)
 * Separates presentation state from business logic
 */

import { useState, useCallback } from 'react'

export type SidebarPage = 'explorer' | 'build' | 'settings'

export interface EditorUIState {
  showCreateModal: boolean
  showCollabPanel: boolean
  sidebarPage: SidebarPage
  cursorPosition: { line: number; column: number }
  selectedCount: number
}

export interface EditorUIActions {
  openCreateModal: () => void
  closeCreateModal: () => void
  toggleCreateModal: () => void
  openCollabPanel: () => void
  closeCollabPanel: () => void
  toggleCollabPanel: () => void
  setSidebarPage: (page: SidebarPage) => void
  setCursorPosition: (position: { line: number; column: number }) => void
  setSelectedCount: (count: number) => void
}

export function useEditorUI() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCollabPanel, setShowCollabPanel] = useState(false)
  const [sidebarPage, setSidebarPage] = useState<SidebarPage>('explorer')
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [selectedCount, setSelectedCount] = useState(0)

  // Modal actions
  const openCreateModal = useCallback(() => setShowCreateModal(true), [])
  const closeCreateModal = useCallback(() => setShowCreateModal(false), [])
  const toggleCreateModal = useCallback(() => setShowCreateModal((prev) => !prev), [])

  // Collab panel actions
  const openCollabPanel = useCallback(() => setShowCollabPanel(true), [])
  const closeCollabPanel = useCallback(() => setShowCollabPanel(false), [])
  const toggleCollabPanel = useCallback(() => setShowCollabPanel((prev) => !prev), [])

  return {
    // State
    showCreateModal,
    showCollabPanel,
    sidebarPage,
    cursorPosition,
    selectedCount,

    // Actions
    openCreateModal,
    closeCreateModal,
    toggleCreateModal,
    openCollabPanel,
    closeCollabPanel,
    toggleCollabPanel,
    setSidebarPage,
    setCursorPosition,
    setSelectedCount,
  }
}
