'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, Sparkles, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(123,47,247,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(123,47,247,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7B2FF7]/30 rounded-full blur-[100px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00FFA3]/20 rounded-full blur-[100px]"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Alien Icon */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative">
            <motion.div
              className="text-8xl"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              👽
            </motion.div>
            <motion.div
              className="absolute inset-0 blur-2xl bg-[#00FFA3]/50"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-6xl md:text-7xl lg:text-8xl font-['Orbitron'] font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className="bg-gradient-to-r from-[#7B2FF7] via-[#9A4EFF] to-[#00FFA3] bg-clip-text text-transparent">
            Code Beyond
          </span>
          <br />
          <span className="text-white">Earth</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-xl md:text-2xl text-white/70 font-['Inter'] mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Build Solana programs with <span className="text-[#00FFA3]">AI-powered intelligence</span> and{' '}
          <span className="text-[#7B2FF7]">real-time collaboration</span>. Your cosmic coding journey starts here.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <Link href="/dashboard">
            <Button variant="cosmic" size="lg" className="group">
              <Rocket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Start Vibing
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="lg">
              Explore Docs
            </Button>
          </Link>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <FeaturePill icon={<Sparkles className="w-4 h-4" />} text="AI Code Completion" />
          <FeaturePill icon={<Users className="w-4 h-4" />} text="Live Collaboration" />
          <FeaturePill icon={<Zap className="w-4 h-4" />} text="One-Click Deploy" />
          <FeaturePill icon={<Rocket className="w-4 h-4" />} text="Solana-First" />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-[#7B2FF7]/50 flex justify-center pt-2">
          <motion.div
            className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}

// Feature Pill Component
const FeaturePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#1E1E3F] border border-[#7B2FF7]/30 hover:border-[#00FFA3]/50 transition-colors duration-300">
    <div className="text-[#00FFA3]">{icon}</div>
    <span className="text-sm font-['Inter'] text-white/80">{text}</span>
  </div>
)
