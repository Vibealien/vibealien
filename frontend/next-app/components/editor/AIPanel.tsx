'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, AlertCircle, Lightbulb, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AISuggestion {
  text: string
  confidence: number
}

interface CodeError {
  message: string
  severity: 'error' | 'warning' | 'info'
  line: number
  column: number
}

interface Optimization {
  title: string
  description: string
  code: string
  impact: 'high' | 'medium' | 'low'
}

interface AIPanelProps {
  code: string
  language: string
  onApplySuggestion?: (code: string) => void
}

export const AIPanel: React.FC<AIPanelProps> = ({ code, language, onApplySuggestion }) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'errors' | 'optimizations'>('suggestions')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [errors, setErrors] = useState<CodeError[]>([])
  const [optimizations, setOptimizations] = useState<Optimization[]>([])

  // Simulate AI analysis (replace with actual API calls)
  useEffect(() => {
    if (code.length > 10) {
      // Mock suggestions
      setSuggestions([
        { text: 'use anchor_lang::prelude::*;', confidence: 0.95 },
        { text: 'pub fn initialize(ctx: Context<Initialize>) -> Result<()>', confidence: 0.88 },
      ])

      // Mock errors
      if (code.includes('unwrap()')) {
        setErrors([
          {
            message: 'Avoid using unwrap() in production code. Use proper error handling.',
            severity: 'warning',
            line: 10,
            column: 15,
          },
        ])
      } else {
        setErrors([])
      }

      // Mock optimizations
      setOptimizations([
        {
          title: 'Use Vec::with_capacity',
          description: 'Pre-allocate vector capacity to avoid reallocation',
          code: 'let mut vec = Vec::with_capacity(10);',
          impact: 'medium',
        },
      ])
    }
  }, [code])

  const analyzeCode = async () => {
    setIsLoading(true)
    // TODO: Call AI service API
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="h-full flex flex-col bg-[#0C0C1E] border-l border-[#7B2FF7]/20">
      {/* Header */}
      <div className="p-4 border-b border-[#7B2FF7]/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00FFA3]" />
            <span className="font-['Orbitron'] font-semibold text-white">AI Assistant</span>
          </div>
          <Button
            size="sm"
            variant="cosmic"
            onClick={analyzeCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 mr-1" />
                Analyze
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['suggestions', 'errors', 'optimizations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Inter'] transition-colors ${
                activeTab === tab
                  ? 'bg-[#7B2FF7]/20 text-[#00FFA3]'
                  : 'text-white/60 hover:text-white hover:bg-[#1E1E3F]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'errors' && errors.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                  {errors.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {activeTab === 'suggestions' && (
          <>
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onApply={() => onApplySuggestion?.(suggestion.text)}
                />
              ))
            ) : (
              <EmptyState
                icon={<Sparkles className="w-8 h-8" />}
                message="Start typing to get AI suggestions"
              />
            )}
          </>
        )}

        {activeTab === 'errors' && (
          <>
            {errors.length > 0 ? (
              errors.map((error, index) => (
                <ErrorCard key={index} error={error} />
              ))
            ) : (
              <EmptyState
                icon={<AlertCircle className="w-8 h-8 text-[#00FFA3]" />}
                message="No errors detected! 🎉"
              />
            )}
          </>
        )}

        {activeTab === 'optimizations' && (
          <>
            {optimizations.length > 0 ? (
              optimizations.map((opt, index) => (
                <OptimizationCard
                  key={index}
                  optimization={opt}
                  onApply={() => onApplySuggestion?.(opt.code)}
                />
              ))
            ) : (
              <EmptyState
                icon={<Lightbulb className="w-8 h-8" />}
                message="Code looks optimal!"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Suggestion Card
const SuggestionCard: React.FC<{ suggestion: AISuggestion; onApply: () => void }> = ({
  suggestion,
  onApply,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-3 rounded-lg bg-[#1E1E3F]/50 border border-[#7B2FF7]/20 hover:border-[#00FFA3]/50 transition-colors"
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <code className="text-xs text-[#00FFA3] font-mono flex-grow">{suggestion.text}</code>
      <div className="text-xs text-white/40">{Math.round(suggestion.confidence * 100)}%</div>
    </div>
    <button
      onClick={onApply}
      className="text-xs text-[#7B2FF7] hover:text-[#00FFA3] transition-colors"
    >
      Apply suggestion →
    </button>
  </motion.div>
)

// Error Card
const ErrorCard: React.FC<{ error: CodeError }> = ({ error }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-3 rounded-lg border ${
      error.severity === 'error'
        ? 'bg-red-500/10 border-red-500/30'
        : error.severity === 'warning'
        ? 'bg-yellow-500/10 border-yellow-500/30'
        : 'bg-blue-500/10 border-blue-500/30'
    }`}
  >
    <div className="flex items-start gap-2">
      <AlertCircle className={`w-4 h-4 mt-0.5 ${
        error.severity === 'error' ? 'text-red-400' :
        error.severity === 'warning' ? 'text-yellow-400' :
        'text-blue-400'
      }`} />
      <div className="flex-grow">
        <p className="text-sm text-white/90 font-['Inter'] mb-1">{error.message}</p>
        <p className="text-xs text-white/40">
          Line {error.line}, Column {error.column}
        </p>
      </div>
    </div>
  </motion.div>
)

// Optimization Card
const OptimizationCard: React.FC<{ optimization: Optimization; onApply: () => void }> = ({
  optimization,
  onApply,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-3 rounded-lg bg-[#1E1E3F]/50 border border-[#7B2FF7]/20 hover:border-[#00FFA3]/50 transition-colors"
  >
    <div className="flex items-start justify-between mb-2">
      <h4 className="text-sm font-['Orbitron'] font-semibold text-white">{optimization.title}</h4>
      <span className={`px-2 py-0.5 rounded text-xs ${
        optimization.impact === 'high' ? 'bg-[#00FFA3]/20 text-[#00FFA3]' :
        optimization.impact === 'medium' ? 'bg-[#7B2FF7]/20 text-[#7B2FF7]' :
        'bg-white/10 text-white/60'
      }`}>
        {optimization.impact}
      </span>
    </div>
    <p className="text-xs text-white/60 mb-2 font-['Inter']">{optimization.description}</p>
    <code className="block p-2 rounded bg-[#0C0C1E] text-xs text-[#00FFA3] font-mono mb-2">
      {optimization.code}
    </code>
    <button
      onClick={onApply}
      className="text-xs text-[#7B2FF7] hover:text-[#00FFA3] transition-colors"
    >
      Apply optimization →
    </button>
  </motion.div>
)

// Empty State
const EmptyState: React.FC<{ icon: React.ReactNode; message: string }> = ({ icon, message }) => (
  <div className="text-center py-8">
    <div className="text-white/20 mb-2">{icon}</div>
    <p className="text-sm text-white/40 font-['Inter']">{message}</p>
  </div>
)
