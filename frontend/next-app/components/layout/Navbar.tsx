'use client'

import React from 'react'
import Link from 'next/link'
import { WalletButton } from '../wallet/WalletButton'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { Bell, Rocket, Code2, Users } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0C0C1E]/80 backdrop-blur-lg border-b border-[#7B2FF7]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Rocket className="w-8 h-8 text-[#00FFA3] transform group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute inset-0 blur-lg bg-[#00FFA3]/30 group-hover:bg-[#00FFA3]/50 transition-all duration-300"></div>
            </div>
            <span className="text-2xl font-['Orbitron'] font-bold bg-gradient-to-r from-[#7B2FF7] to-[#00FFA3] bg-clip-text text-transparent">
              VibeAlien
            </span>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-white/80 hover:text-[#00FFA3] transition-colors duration-300"
              >
                <Code2 className="w-5 h-5" />
                <span className="font-['Inter']">Dashboard</span>
              </Link>
              <Link
                href="/projects"
                className="flex items-center space-x-2 text-white/80 hover:text-[#00FFA3] transition-colors duration-300"
              >
                <Rocket className="w-5 h-5" />
                <span className="font-['Inter']">Projects</span>
              </Link>
              <Link
                href="/community"
                className="flex items-center space-x-2 text-white/80 hover:text-[#00FFA3] transition-colors duration-300"
              >
                <Users className="w-5 h-5" />
                <span className="font-['Inter']">Community</span>
              </Link>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                {/* Notification Bell */}
                <button className="relative p-2 text-white/80 hover:text-[#00FFA3] transition-colors duration-300">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#00FFA3] rounded-full animate-pulse"></span>
                </button>

                {/* User Avatar */}
                <Link href="/profile" className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#00FFA3] flex items-center justify-center text-white font-['Orbitron'] font-bold shadow-[0_0_15px_rgba(123,47,247,0.5)]">
                    {user?.username?.[0]?.toUpperCase() || '👽'}
                  </div>
                </Link>
              </>
            )}

            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
