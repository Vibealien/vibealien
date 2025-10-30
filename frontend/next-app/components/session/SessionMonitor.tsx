'use client'

import { useSessionMonitor } from '@/lib/hooks/useSessionMonitor'

/**
 * Client component wrapper for session monitoring
 * Place this in the root layout to enable automatic session management
 */
export function SessionMonitor() {
  useSessionMonitor()
  return null // This component doesn't render anything
}
