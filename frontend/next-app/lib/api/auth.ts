import axios from 'axios'
import { API_BASE_URL } from '../constants'
import type { User } from '../types'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Auth API functions
export const authApi = {
  // Get challenge message for wallet signature
  getChallenge: async (wallet: string): Promise<{ challenge: string }> => {
    const { data } = await api.post('/challenge', { walletAddress: wallet })
    console.log({data})
    return data.data // Backend wraps in { success: true, data: {...} }
  },

  // Verify wallet signature and get JWT tokens
  verifySignature: async (
    wallet: string,
    signature: string,
    challenge: string
  ): Promise<{
    user: User
    token: string
    refreshToken: string
  }> => {
    const { data } = await api.post('/verify', { 
      walletAddress: wallet, 
      signature,
      challenge 
    })
    return data.data // Backend wraps in { success: true, data: {...} }
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{
    token: string
    refreshToken: string
  }> => {
    const { data } = await api.post('/refresh', { refreshToken })
    return data.data // Backend wraps in { success: true, data: {...} }
  },

  // Logout (revoke refresh token)
  logout: async (token: string): Promise<void> => {
    await api.post(
      '/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
  },

  // Get current user info
  me: async (token: string): Promise<User> => {
    const { data } = await api.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return data.data // Backend wraps in { success: true, data: {...} }
  },
}
