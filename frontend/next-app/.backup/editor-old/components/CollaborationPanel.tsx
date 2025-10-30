'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Wifi, WifiOff } from 'lucide-react'
import { useCollaborationStore } from '@/lib/stores/useCollaborationStore'
import type { PresenceData } from '@/lib/types'

// Predefined colors for user cursors
const USER_COLORS = [
  '#7B2FF7', // Cosmic Violet
  '#00FFA3', // Neon Mint
  '#FF6B6B', // Red
  '#4ECDC4', // Cyan
  '#FFD93D', // Yellow
  '#FF6BCB', // Pink
  '#95E1D3', // Mint Green
  '#F38181', // Salmon
]

interface CollaborationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { isConnected, activeUsers } = useCollaborationStore()
  const usersArray = Array.from(activeUsers.values())

  const getUserColor = (userId: string) => {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return USER_COLORS[hash % USER_COLORS.length]
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-80 bg-[#0C0C1E] border-l border-[#7B2FF7]/20 shadow-2xl z-50 flex flex-col"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#7B2FF7]/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#7B2FF7]" />
                  <h2 className="font-['Orbitron'] font-semibold text-white">
                    Collaborators
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded hover:bg-[#7B2FF7]/20 transition-colors"
                >
                  <span className="text-white/60">✕</span>
                </button>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-[#00FFA3]" />
                    <span className="text-sm text-[#00FFA3] font-['Inter']">
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400 font-['Inter']">
                      Disconnected
                    </span>
                  </>
                )}
                <span className="text-sm text-white/40 font-['Inter'] ml-auto">
                  {usersArray.length} online
                </span>
              </div>
            </div>

            {/* Users List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {usersArray.length > 0 ? (
                usersArray.map((user) => (
                  <UserCard
                    key={user.userId}
                    user={user}
                    color={getUserColor(user.userId)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-3 text-white/20" />
                  <p className="text-sm text-white/40 font-['Inter']">
                    {isConnected
                      ? 'No other users online'
                      : 'Connect to see collaborators'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// User Card Component
const UserCard: React.FC<{
  user: PresenceData
  color: string
}> = ({ user, color }) => {
  const isActive = user.lastSeen && Date.now() - user.lastSeen < 5000

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-[#1E1E3F]/50 border border-[#7B2FF7]/20 hover:border-[#00FFA3]/30 transition-colors"
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-['Orbitron'] font-bold text-sm relative"
        style={{ backgroundColor: color }}
      >
        {user.username?.[0]?.toUpperCase() || '?'}
        
        {/* Active Indicator */}
        {isActive && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00FFA3] rounded-full border-2 border-[#0C0C1E]"></div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-grow min-w-0">
        <p className="text-sm font-['Inter'] font-medium text-white truncate">
          {user.username || 'Anonymous'}
        </p>
        <p className="text-xs text-white/40 font-mono truncate">
          {user.userWallet.slice(0, 4)}...{user.userWallet.slice(-4)}
        </p>
        {user.cursor && (
          <p className="text-xs text-white/30 font-['Inter']">
            Line {user.cursor.line}, Col {user.cursor.column}
          </p>
        )}
      </div>
    </motion.div>
  )
}
