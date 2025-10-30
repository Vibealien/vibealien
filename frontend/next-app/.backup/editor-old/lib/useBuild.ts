/**
 * useBuild Hook
 * Handles build operations with proper state management
 * Separates build logic from UI components
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { projectsApi } from '../api/projects'
import { useAuthStore } from '../stores/useAuthStore'
import { toast } from 'react-hot-toast'
import type { Build } from '../types'

export interface BuildState {
  currentBuild: Build | null
  isBuilding: boolean
  error: string | null
}

export function useBuild(projectId: string) {
  const { token } = useAuthStore()
  const [state, setState] = useState<BuildState>({
    currentBuild: null,
    isBuilding: false,
    error: null,
  })
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Stop polling for build status
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  /**
   * Poll for build status
   */
  const pollBuildStatus = useCallback((buildId: string) => {
    if (!token) return

    stopPolling()

    pollIntervalRef.current = setInterval(async () => {
      try {
        const build = await projectsApi.getBuild(token, projectId, buildId)
        
        setState((prev) => ({ ...prev, currentBuild: build }))

        if (build.status === 'SUCCESS' || build.status === 'FAILED') {
          stopPolling()
          
          if (build.status === 'SUCCESS') {
            toast.success('Build completed! ✅')
          } else {
            toast.error('Build failed ❌')
          }
          
          setState((prev) => ({ ...prev, isBuilding: false }))
        }
      } catch (error) {
        console.error('Failed to poll build status:', error)
        stopPolling()
        setState((prev) => ({ 
          ...prev, 
          isBuilding: false, 
          error: 'Failed to check build status' 
        }))
      }
    }, 2000)
  }, [token, projectId, stopPolling])

  /**
   * Trigger a new build
   */
  const triggerBuild = useCallback(async () => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    setState((prev) => ({ ...prev, isBuilding: true, error: null }))

    try {
      const build = await projectsApi.triggerBuild(token, projectId)
      
      setState((prev) => ({ 
        ...prev, 
        currentBuild: build,
      }))
      
      toast.success('Build started! 🚀')
      
      // Start polling for status
      pollBuildStatus(build.id)
    } catch (error: any) {
      console.error('Failed to trigger build:', error)
      toast.error('Failed to start build')
      
      setState((prev) => ({ 
        ...prev, 
        isBuilding: false, 
        error: error.message || 'Failed to start build' 
      }))
    }
  }, [token, projectId, pollBuildStatus])

  /**
   * Cancel the current build
   */
  const cancelBuild = useCallback(async () => {
    if (!state.currentBuild || !token) return

    try {
      // If your API supports build cancellation, add it here
      stopPolling()
      setState((prev) => ({ ...prev, isBuilding: false }))
      toast.success('Build cancelled')
    } catch (error) {
      console.error('Failed to cancel build:', error)
      toast.error('Failed to cancel build')
    }
  }, [state.currentBuild, token, stopPolling])

  /**
   * Get build logs (if API supports it)
   */
  const getBuildLogs = useCallback(async (buildId: string) => {
    if (!token) return null

    try {
      // Note: Implement this when API supports build logs
      // const logs = await projectsApi.getBuildLogs(token, projectId, buildId)
      // return logs
      console.log('Build logs not yet implemented in API')
      return null
    } catch (error) {
      console.error('Failed to get build logs:', error)
      return null
    }
  }, [token, projectId])

  /**
   * Clear build state
   */
  const clearBuild = useCallback(() => {
    stopPolling()
    setState({
      currentBuild: null,
      isBuilding: false,
      error: null,
    })
  }, [stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    ...state,
    triggerBuild,
    cancelBuild,
    getBuildLogs,
    clearBuild,
  }
}
