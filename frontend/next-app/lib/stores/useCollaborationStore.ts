import { create } from 'zustand'
import type { PresenceData } from '../types'

interface CollaborationState {
  isConnected: boolean
  activeUsers: Map<string, PresenceData>
  sessionId: string | null
  
  // Actions
  setConnected: (connected: boolean) => void
  addUser: (userId: string, presence: PresenceData) => void
  removeUser: (userId: string) => void
  updateUserCursor: (userId: string, cursor: { line: number; column: number }) => void
  setSessionId: (sessionId: string | null) => void
  clearSession: () => void
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  isConnected: false,
  activeUsers: new Map(),
  sessionId: null,

  setConnected: (connected) => set({ isConnected: connected }),

  addUser: (userId, presence) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers)
      newUsers.set(userId, presence)
      return { activeUsers: newUsers }
    }),

  removeUser: (userId) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers)
      newUsers.delete(userId)
      return { activeUsers: newUsers }
    }),

  updateUserCursor: (userId, cursor) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers)
      const user = newUsers.get(userId)
      if (user) {
        newUsers.set(userId, { ...user, cursor, lastSeen: Date.now() })
      }
      return { activeUsers: newUsers }
    }),

  setSessionId: (sessionId) => set({ sessionId }),

  clearSession: () =>
    set({
      isConnected: false,
      activeUsers: new Map(),
      sessionId: null,
    }),
}))
