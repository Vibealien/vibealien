'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Users2, Rocket, Zap, Shield, Globe } from 'lucide-react'

const features = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: 'AI-Powered Intelligence',
    description: 'Get smart code completions, error detection, and optimization suggestions tailored for Solana development.',
    color: '#7B2FF7',
  },
  {
    icon: <Users2 className="w-8 h-8" />,
    title: 'Real-Time Collaboration',
    description: 'Code together with your team in real-time using conflict-free CRDT technology and live cursors.',
    color: '#00FFA3',
  },
  {
    icon: <Rocket className="w-8 h-8" />,
    title: 'One-Click Deployment',
    description: 'Deploy your Solana programs directly from the IDE to devnet or mainnet with automated builds.',
    color: '#7B2FF7',
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Lightning Fast',
    description: 'Built on cutting-edge technology for blazing-fast code editing, compilation, and deployment.',
    color: '#00FFA3',
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Secure by Default',
    description: 'Wallet-based authentication, encrypted connections, and secure code storage keep your work safe.',
    color: '#7B2FF7',
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: 'Community Driven',
    description: 'Share projects, fork repos, and learn from the vibrant Solana developer community.',
    color: '#00FFA3',
  },
]

export const Features: React.FC = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7B2FF7]/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-['Orbitron'] font-bold mb-4">
            <span className="bg-gradient-to-r from-[#7B2FF7] to-[#00FFA3] bg-clip-text text-transparent">
              Why VibeAlien?
            </span>
          </h2>
          <p className="text-xl text-white/60 font-['Inter'] max-w-2xl mx-auto">
            Everything you need to build, deploy, and scale Solana programs in one cosmic workspace.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
            >
              <div className="relative h-full p-8 rounded-2xl bg-[#1E1E3F]/50 border border-[#7B2FF7]/20 hover:border-[#00FFA3]/50 transition-all duration-300 overflow-hidden">
                {/* Icon */}
                <div
                  className="mb-4 text-[#00FFA3] relative z-10"
                  style={{ color: feature.color }}
                >
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-['Orbitron'] font-semibold mb-3 relative z-10">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-white/60 font-['Inter'] leading-relaxed relative z-10">
                  {feature.description}
                </p>

                {/* Hover Glow Effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                  style={{
                    background: `radial-gradient(circle at center, ${feature.color}15, transparent 70%)`,
                  }}
                ></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
