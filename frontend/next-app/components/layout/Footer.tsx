'use client'

import React from 'react'
import Link from 'next/link'
import { Github, Twitter, BookOpen, Rocket } from 'lucide-react'
import { usePathname } from 'next/navigation'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const path = usePathname()
  if(path.startsWith('/editor')) return null;
  return (
    <footer className="bg-[#0C0C1E] border-t border-[#7B2FF7]/20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Rocket className="w-6 h-6 text-[#00FFA3]" />
              <span className="text-xl font-['Orbitron'] font-bold bg-gradient-to-r from-[#7B2FF7] to-[#00FFA3] bg-clip-text text-transparent">
                VibeAlien
              </span>
            </div>
            <p className="text-white/60 text-sm font-['Inter']">
              Build Solana programs with AI-powered intelligence and real-time collaboration.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-['Orbitron'] font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-white/60 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/60 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-white/60 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="text-white/60 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-['Orbitron'] font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-white/60 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-white/60 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-white/60 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-white/60 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-['Orbitron'] font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/vibealien"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-[#1E1E3F] flex items-center justify-center text-white/60 hover:text-[#00FFA3] hover:bg-[#7B2FF7]/20 transition-all duration-300"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/vibealien"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-[#1E1E3F] flex items-center justify-center text-white/60 hover:text-[#00FFA3] hover:bg-[#7B2FF7]/20 transition-all duration-300"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://docs.vibealien.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-[#1E1E3F] flex items-center justify-center text-white/60 hover:text-[#00FFA3] hover:bg-[#7B2FF7]/20 transition-all duration-300"
              >
                <BookOpen className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#7B2FF7]/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/40 text-sm font-['Inter']">
            © {currentYear} VibeAlien. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-white/40 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white/40 hover:text-[#00FFA3] transition-colors duration-300 text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Cosmic Glow Effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-gradient-to-t from-[#7B2FF7]/10 to-transparent blur-3xl pointer-events-none"></div>
    </footer>
  )
}
