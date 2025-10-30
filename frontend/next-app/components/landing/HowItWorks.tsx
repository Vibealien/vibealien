'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Wallet, FolderPlus, Code2, Rocket } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: <Wallet className="w-8 h-8" />,
    title: 'Connect Wallet',
    description: 'Link your Solana wallet (Phantom, Backpack, or Solflare) to get started instantly.',
  },
  {
    number: '02',
    icon: <FolderPlus className="w-8 h-8" />,
    title: 'Create Project',
    description: 'Choose a template or start from scratch. Import from GitHub or use our starter kits.',
  },
  {
    number: '03',
    icon: <Code2 className="w-8 h-8" />,
    title: 'Code with AI',
    description: 'Write Rust code with intelligent completions, error detection, and real-time suggestions.',
  },
  {
    number: '04',
    icon: <Rocket className="w-8 h-8" />,
    title: 'Deploy to Solana',
    description: 'Build and deploy your program to Solana devnet or mainnet with one click.',
  },
]

export const HowItWorks: React.FC = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,163,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,163,0.05)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-['Orbitron'] font-bold mb-4">
            <span className="text-white">How It</span>{' '}
            <span className="bg-gradient-to-r from-[#7B2FF7] to-[#00FFA3] bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-white/60 font-['Inter'] max-w-2xl mx-auto">
            From zero to deployed Solana program in minutes.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col md:flex-row items-start gap-8"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
            >
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#00FFA3] flex items-center justify-center">
                  <span className="text-3xl font-['Orbitron'] font-bold">{step.number}</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#00FFA3] blur-xl opacity-50"></div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-[#00FFA3]">{step.icon}</div>
                  <h3 className="text-2xl font-['Orbitron'] font-semibold">{step.title}</h3>
                </div>
                <p className="text-lg text-white/60 font-['Inter'] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-10 mt-24 w-0.5 h-12 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
