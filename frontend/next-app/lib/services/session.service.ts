import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/useAuthStore'
import { SESSION_CONFIG } from '../constants'

/**
 * Session monitoring service
 * Checks token validity and refreshes tokens automatically
 */
class SessionService {
  private intervalId: NodeJS.Timeout | null = null
  private isRefreshing = false
  private readonly CHECK_INTERVAL = SESSION_CONFIG.CHECK_INTERVAL
  private readonly TOKEN_REFRESH_THRESHOLD = SESSION_CONFIG.TOKEN_REFRESH_THRESHOLD

  /**
   * Start monitoring the session
   */
  start(): void {
    if (this.intervalId) {
      console.log('[SessionService] Already running')
      return
    }

    console.log('[SessionService] Starting session monitor')
    
    // Check immediately on start
    this.checkSession()
    
    // Then check periodically
    this.intervalId = setInterval(() => {
      this.checkSession()
    }, this.CHECK_INTERVAL)
  }

  /**
   * Stop monitoring the session
   */
  stop(): void {
    if (this.intervalId) {
      console.log('[SessionService] Stopping session monitor')
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Check if the current session is valid
   */
  private async checkSession(): Promise<void> {
    const { token, refreshToken, isAuthenticated, clearAuth } = useAuthStore.getState()

    // Skip if not authenticated
    if (!isAuthenticated || !token || !refreshToken) {
      return
    }

    try {
      // Decode JWT to check expiration (without verifying signature, just reading payload)
      const tokenData = this.decodeToken(token)
      
      if (!tokenData || !tokenData.exp) {
        console.warn('[SessionService] Invalid token format')
        this.handleSessionExpired()
        return
      }

      const now = Date.now()
      const expiresAt = tokenData.exp * 1000 // Convert to milliseconds
      const timeUntilExpiry = expiresAt - now

      // If token has already expired
      if (timeUntilExpiry <= 0) {
        console.log('[SessionService] Token expired, attempting refresh')
        await this.refreshSession()
        return
      }

      // If token is about to expire (within threshold), refresh it
      if (timeUntilExpiry <= this.TOKEN_REFRESH_THRESHOLD) {
        console.log(`[SessionService] Token expires in ${Math.floor(timeUntilExpiry / 1000)}s, refreshing`)
        await this.refreshSession()
        return
      }

      // Token is still valid
      console.log(`[SessionService] Token valid, expires in ${Math.floor(timeUntilExpiry / 60000)} minutes`)
    } catch (error) {
      console.error('[SessionService] Error checking session:', error)
      // Don't logout on check errors, only on refresh failures
    }
  }

  /**
   * Attempt to refresh the session using refresh token
   */
  private async refreshSession(): Promise<void> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      console.log('[SessionService] Refresh already in progress')
      return
    }

    this.isRefreshing = true

    try {
      const { refreshToken: currentRefreshToken, user, setAuth } = useAuthStore.getState()

      if (!currentRefreshToken) {
        throw new Error('No refresh token available')
      }

      console.log('[SessionService] Refreshing tokens...')
      const { token: newToken, refreshToken: newRefreshToken } = await authApi.refreshToken(currentRefreshToken)

      // Update store with new tokens
      if (user) {
        setAuth(user, newToken, newRefreshToken)
        console.log('[SessionService] Tokens refreshed successfully')
      } else {
        throw new Error('No user data available')
      }
    } catch (error) {
      console.error('[SessionService] Failed to refresh session:', error)
      this.handleSessionExpired()
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Handle expired session - logout user
   */
  private handleSessionExpired(): void {
    console.log('[SessionService] Session expired, logging out')
    
    const { clearAuth, token } = useAuthStore.getState()
    
    // Attempt to call logout endpoint (fire and forget)
    if (token) {
      authApi.logout(token).catch((err) => {
        console.warn('[SessionService] Logout API call failed:', err)
      })
    }
    
    // Clear local auth state
    clearAuth()
    
    // Stop monitoring
    this.stop()
    
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  /**
   * Decode JWT token (client-side, no verification)
   * Only for reading expiration time
   */
  private decodeToken(token: string): { exp?: number; iat?: number; userId?: string } | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      const payload = parts[1]
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      return decoded
    } catch (error) {
      console.error('[SessionService] Error decoding token:', error)
      return null
    }
  }

  /**
   * Manually trigger a session check
   */
  checkNow(): void {
    this.checkSession()
  }

  /**
   * Get the time until token expiration
   */
  getTimeUntilExpiry(): number | null {
    const { token } = useAuthStore.getState()
    if (!token) return null

    const tokenData = this.decodeToken(token)
    if (!tokenData || !tokenData.exp) return null

    const now = Date.now()
    const expiresAt = tokenData.exp * 1000
    return Math.max(0, expiresAt - now)
  }
}

// Export singleton instance
export const sessionService = new SessionService()
