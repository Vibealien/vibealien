import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  _hasHydrated: boolean
  
  // Actions
  setAuth: (user: User, token: string, refreshToken: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setAuth: (user, token, refreshToken) => set({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      }),

      clearAuth: () => set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      }),

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      setLoading: (loading) => set({ isLoading: loading }),
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'vibealien-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
