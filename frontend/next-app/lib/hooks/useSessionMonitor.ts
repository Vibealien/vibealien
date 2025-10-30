import { useEffect } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { sessionService } from '../services/session.service'

/**
 * Hook to automatically monitor session and logout on expiry
 * Use this in the root layout or app component
 */
export function useSessionMonitor() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const _hasHydrated = useAuthStore((state) => state._hasHydrated)

  useEffect(() => {
    // Wait for hydration to complete
    if (!_hasHydrated) {
      return
    }

    if (isAuthenticated) {
      console.log('[useSessionMonitor] Starting session monitoring')
      sessionService.start()
    } else {
      console.log('[useSessionMonitor] Stopping session monitoring')
      sessionService.stop()
    }

    // Cleanup on unmount
    return () => {
      sessionService.stop()
    }
  }, [isAuthenticated, _hasHydrated])
}
