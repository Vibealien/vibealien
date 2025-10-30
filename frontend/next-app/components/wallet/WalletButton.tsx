'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { authApi } from '@/lib/api/auth'
import { sessionService } from '@/lib/services/session.service'
import { toast } from 'react-hot-toast'
import bs58 from 'bs58'

export const WalletButton: React.FC = () => {
  const { publicKey, signMessage, connected, disconnect } = useWallet()
  const { setAuth, clearAuth, isAuthenticated, token } = useAuthStore()
  
  // Track if authentication is in progress to prevent race conditions
  const isAuthenticating = useRef(false)
  // Track the last authenticated wallet to prevent re-auth on navigation
  const lastAuthenticatedWallet = useRef<string | null>(null)

  // Handle wallet authentication when connected
  const handleAuth = useCallback(async () => {
    if (!publicKey || !signMessage || isAuthenticating.current) return

    const wallet = publicKey.toBase58()
    
    // Skip if we've already authenticated this wallet in this session
    if (lastAuthenticatedWallet.current === wallet && isAuthenticated && token) {
      console.log('Already authenticated this wallet, skipping')
      return
    }

    try {
      isAuthenticating.current = true

      // Check if already authenticated with valid token
      if (isAuthenticated && token) {
        try {
          await authApi.me(token)
          lastAuthenticatedWallet.current = wallet
          console.log('Token still valid, skipping re-auth')
          return // Already authenticated and valid
        } catch (err) {
          console.log('Token expired, re-authenticating...')
          clearAuth()
          lastAuthenticatedWallet.current = null
        }
      }

      // Get challenge message
      const { challenge } = await authApi.getChallenge(wallet)

      // Sign the message
      console.log('Signing message:', challenge)
      const messageBytes = new TextEncoder().encode(challenge)
      const signatureBytes = await signMessage(messageBytes)
      const signature = bs58.encode(signatureBytes)

      // Verify signature and get tokens
      const { user, token: newToken, refreshToken } = await authApi.verifySignature(
        wallet, 
        signature,
        challenge // Pass the challenge back to backend
      )

      // Save auth state
      setAuth(user, newToken, refreshToken)
      lastAuthenticatedWallet.current = wallet

      toast.success(`Welcome${user.username ? `, ${user.username}` : ''}! 👽`)
    } catch (error: any) {
      console.error('Authentication error:', error)
      
      // Handle specific error cases
      if (error.message?.includes('User rejected')) {
        toast.error('Wallet signature was rejected')
      } else if (error.message?.includes('Invalid transaction')) {
        toast.error('Failed to sign message. Please try reconnecting your wallet.')
      } else if (error.code === 4001) {
        toast.error('Transaction rejected by user')
      } else if (error.code === -32603) {
        toast.error('Wallet error. Please try again.')
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to authenticate wallet')
      }
      
      disconnect()
    } finally {
      isAuthenticating.current = false
    }
  }, [publicKey, signMessage, isAuthenticated, token, setAuth, clearAuth, disconnect])

  // Handle wallet disconnection
  const handleDisconnect = useCallback(async () => {
    // Stop session monitoring
    sessionService.stop()
    
    if (token) {
      try {
        await authApi.logout(token)
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    clearAuth()
    lastAuthenticatedWallet.current = null // Reset authenticated wallet tracking
    toast.success('Wallet disconnected')
  }, [token, clearAuth])

  // Auto-authenticate when wallet connects (only once per connection)
  useEffect(() => {
    if (connected && publicKey && signMessage && !isAuthenticated && !isAuthenticating.current) {
      console.log('Wallet connected, authenticating...')
      handleAuth()
    } else if (!connected && isAuthenticated) {
      console.log('Wallet disconnected, clearing auth...')
      handleDisconnect()
    }
  }, [connected, publicKey, signMessage, isAuthenticated, handleAuth, handleDisconnect])

  return (
    <div className="wallet-button-wrapper">
      <WalletMultiButton className="!bg-gradient-to-r !from-[#7B2FF7] !to-[#9A4EFF] !rounded-lg !shadow-[0_0_20px_rgba(123,47,247,0.3)] hover:!shadow-[0_0_30px_rgba(123,47,247,0.5)] !transition-all !duration-300 !font-['Orbitron'] !text-sm" />
    </div>
  )
}
