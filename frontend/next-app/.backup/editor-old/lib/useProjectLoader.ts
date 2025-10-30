/**
 * useProjectLoader Hook
 * Handles project and files loading with offline support
 * Separates data fetching logic from UI components
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { projectsApi } from '../api/projects'
import { useAuthStore } from '../stores/useAuthStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useOfflineStorage } from './useOfflineStorage'
import { toast } from 'react-hot-toast'
import type { Project, ProjectFile } from '../types'

export interface ProjectLoaderState {
  isLoading: boolean
  error: string | null
  project: Project | null
  files: ProjectFile[]
}

export function useProjectLoader(projectId: string) {
  const router = useRouter()
  const { isAuthenticated, token, _hasHydrated } = useAuthStore()
  const { setCurrentProject, setCurrentFiles } = useProjectStore()
  const { isOnline, getCachedFiles, cacheFiles, applyPendingChanges } = useOfflineStorage()

  const [state, setState] = useState<ProjectLoaderState>({
    isLoading: true,
    error: null,
    project: null,
    files: [],
  })

  /**
   * Load project data from server or cache
   */
  const loadProject = useCallback(async () => {
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false, error: 'No authentication token' }))
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      let files: ProjectFile[] = []
      let project: Project | null = null

      if (isOnline) {
        // Load from server when online
        try {
          const [fetchedProject, fetchedFiles] = await Promise.all([
            projectsApi.getProject(token, projectId),
            projectsApi.getFiles(token, projectId),
          ])

          project = fetchedProject
          files = fetchedFiles

          // Cache files for offline access
          await cacheFiles(files)
        } catch (error) {
          console.error('Failed to load from server:', error)
          // Fall through to cache loading
        }
      }

      // If online load failed or we're offline, try cache
      if (!files.length) {
        try {
          files = await getCachedFiles(projectId)
          if (files.length > 0) {
            toast('📂 Loaded from offline cache')
          } else {
            throw new Error('No cached files available')
          }
        } catch (cacheError) {
          console.error('Failed to load from cache:', cacheError)
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Failed to load project',
          }))
          toast.error('Failed to load project')
          router.push('/dashboard')
          return
        }
      }

      // Apply any pending changes (edits made offline)
      files = await applyPendingChanges(files)

      // Update stores
      setCurrentProject(project)
      setCurrentFiles(files)

      setState({
        isLoading: false,
        error: null,
        project,
        files,
      })
    } catch (error: any) {
      console.error('Failed to load project:', error)
      setState({
        isLoading: false,
        error: error.message || 'Unknown error',
        project: null,
        files: [],
      })
      toast.error('Failed to load project')
      router.push('/dashboard')
    }
    // Only depend on projectId - other values are stable or retrieved fresh
  }, [projectId])

  /**
   * Reload project data
   */
  const reloadProject = useCallback(() => {
    loadProject()
  }, [loadProject])

  // Redirect if not authenticated
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/')
      toast.error('Please connect your wallet')
    }
  }, [isAuthenticated, _hasHydrated, router])

  // Load project on mount ONLY - prevent repeated loads
  useEffect(() => {
    if (isAuthenticated && token && projectId) {
      loadProject()
    }
    // Intentionally only run once on mount when authenticated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, projectId])

  return {
    ...state,
    reloadProject,
  }
}
