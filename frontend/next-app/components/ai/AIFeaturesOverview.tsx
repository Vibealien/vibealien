/**
 * AI Features Overview Component
 * Shows available AI capabilities when no conversation exists
 */

'use client'

import React from 'react'
import { Bot, Sparkles, Bug, TestTube, Zap, Code2, BookOpen, MessageCircle } from 'lucide-react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}

function FeatureCard({ icon, title, description, onClick }: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        w-full p-4 rounded-lg
        bg-[#0A0A1A]/50 hover:bg-[#7B2FF7]/10
        border border-[#7B2FF7]/20 hover:border-[#7B2FF7]/40
        transition-all duration-200
        text-left group
      "
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7B2FF7]/20 to-[#00D4FF]/20 flex items-center justify-center flex-shrink-0 group-hover:from-[#7B2FF7]/30 group-hover:to-[#00D4FF]/30 transition-all">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white font-['Orbitron'] mb-1">
            {title}
          </h3>
          <p className="text-xs text-white/60 font-['Inter'] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

interface AIFeaturesOverviewProps {
  onFeatureClick: (prompt: string) => void
}

export function AIFeaturesOverview({ onFeatureClick }: AIFeaturesOverviewProps) {
  const features = [
    {
      icon: <MessageCircle className="w-5 h-5 text-[#7B2FF7]" />,
      title: 'Ask Anything',
      description: 'Get instant answers to your coding questions and general programming help',
      prompt: 'How can you help me with my code?',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-[#00D4FF]" />,
      title: 'Explain Code',
      description: 'Understand complex code with detailed explanations and documentation',
      prompt: 'Explain this code',
    },
    {
      icon: <Bug className="w-5 h-5 text-[#FF6B6B]" />,
      title: 'Find Bugs',
      description: 'Identify potential bugs, errors, and code quality issues automatically',
      prompt: 'Find bugs in my code',
    },
    {
      icon: <Zap className="w-5 h-5 text-[#FFD93D]" />,
      title: 'Optimize Performance',
      description: 'Get suggestions to improve code performance and efficiency',
      prompt: 'How can I optimize this code?',
    },
    {
      icon: <TestTube className="w-5 h-5 text-[#6BCF7F]" />,
      title: 'Generate Tests',
      description: 'Create comprehensive test cases for your functions and components',
      prompt: 'Write tests for this code',
    },
    {
      icon: <Code2 className="w-5 h-5 text-[#A78BFA]" />,
      title: 'Refactor Code',
      description: 'Improve code structure, readability, and maintainability',
      prompt: 'How should I refactor this?',
    },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#7B2FF7] to-[#00D4FF] flex items-center justify-center">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white font-['Orbitron'] mb-2">
          AI Coding Assistant
        </h2>
        <p className="text-sm text-white/60 font-['Inter'] max-w-md mx-auto">
          Your intelligent coding companion powered by advanced AI. Get instant help with code explanations, bug fixes, optimizations, and more.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            onClick={() => onFeatureClick(feature.prompt)}
          />
        ))}
      </div>

      {/* Tips */}
      <div className="p-4 rounded-lg bg-[#7B2FF7]/5 border border-[#7B2FF7]/10">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[#7B2FF7] flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white/60 font-['Inter'] leading-relaxed">
            <strong className="text-white/80">Pro Tips:</strong> Be specific with your questions, include error messages, and mention the programming language for better results.
          </div>
        </div>
      </div>
    </div>
  )
}
