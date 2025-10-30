'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal as TerminalIcon, Play, Download, Loader2, CheckCircle, XCircle, Rocket, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Build } from '@/lib/types'
import { Terminal } from '@/components/terminal/Terminal'

interface BuildPanelProps {
  projectId: string
  currentBuild: Build | null
  onTriggerBuild: () => void
  onDeploy?: () => void
}

type TabType = 'build' | 'terminal'

export const BuildPanel: React.FC<BuildPanelProps> = ({
  projectId,
  currentBuild,
  onTriggerBuild,
  onDeploy,
}) => {
  const logsRef = useRef<HTMLDivElement>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('terminal')

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [currentBuild?.logs])

  // Update building state
  useEffect(() => {
    setIsBuilding(currentBuild?.status === 'BUILDING' || currentBuild?.status === 'PENDING')
  }, [currentBuild?.status])

  // Switch to build tab when build starts
  useEffect(() => {
    if (isBuilding) {
      setActiveTab('build')
    }
  }, [isBuilding])

  const getStatusIcon = () => {
    if (!currentBuild) return <Code className="w-5 h-5 text-white/60" />
    
    switch (currentBuild.status) {
      case 'PENDING':
      case 'BUILDING':
        return <Loader2 className="w-5 h-5 text-[#7B2FF7] animate-spin" />
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-[#00FFA3]" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Code className="w-5 h-5 text-white/60" />
    }
  }

  const getStatusColor = () => {
    if (!currentBuild) return 'text-white/60'
    
    switch (currentBuild.status) {
      case 'BUILDING':
      case 'PENDING':
        return 'text-[#7B2FF7]'
      case 'SUCCESS':
        return 'text-[#00FFA3]'
      case 'FAILED':
        return 'text-red-400'
      default:
        return 'text-white/60'
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#0C0C1E] border-t border-[#7B2FF7]/20">
      {/* Tabs Header */}
      <div className="flex items-center justify-between p-2 border-b border-[#7B2FF7]/20">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'terminal'
                ? 'bg-[#7B2FF7]/20 text-white border border-[#7B2FF7]/50'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
            <span className="text-sm font-['Inter']">Terminal</span>
          </button>
          <button
            onClick={() => setActiveTab('build')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'build'
                ? 'bg-[#7B2FF7]/20 text-white border border-[#7B2FF7]/50'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {getStatusIcon()}
            <span className="text-sm font-['Inter']">Build</span>
            {currentBuild && (
              <span className={`text-xs ${getStatusColor()}`}>
                #{currentBuild.buildNumber}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'build' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="cosmic"
              onClick={onTriggerBuild}
              disabled={isBuilding}
            >
              {isBuilding ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Build
                </>
              )}
            </Button>

            {currentBuild?.status === 'SUCCESS' && onDeploy && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDeploy}
              >
                <Rocket className="w-3 h-3 mr-1" />
                Deploy
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'terminal' ? (
          <div className="h-full">
            <Terminal />
          </div>
        ) : (
          <>
            {/* Build Logs */}
            <div
              ref={logsRef}
              className="h-full overflow-y-auto p-4 font-mono text-sm bg-[#0C0C1E]"
            >
              {currentBuild?.logs ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1"
                >
                  {currentBuild.logs.split('\n').map((line, index) => (
                    <div
                      key={index}
                      className={`${
                        line.includes('error') || line.includes('ERROR')
                          ? 'text-red-400'
                          : line.includes('warning') || line.includes('WARN')
                          ? 'text-yellow-400'
                          : line.includes('success') || line.includes('SUCCESS')
                          ? 'text-[#00FFA3]'
                          : 'text-white/70'
                      }`}
                    >
                      {line || '\u00A0'}
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Code className="w-12 h-12 text-white/20 mb-3" />
                  <p className="text-white/40 font-['Inter'] mb-2">No build logs yet</p>
                  <p className="text-white/30 text-xs font-['Inter']">
                    Click "Build" to compile your Solana program
                  </p>
                </div>
              )}
            </div>

            {/* Artifacts */}
            {currentBuild?.status === 'SUCCESS' && currentBuild.artifacts && currentBuild.artifacts.length > 0 && (
              <div className="p-4 border-t border-[#7B2FF7]/20">
                <p className="text-xs text-white/60 mb-2 font-['Inter']">Build Artifacts:</p>
                <div className="flex flex-wrap gap-2">
                  {currentBuild.artifacts.map((artifact, index) => (
                    <a
                      key={index}
                      href={artifact}
                      download
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E1E3F] border border-[#7B2FF7]/30 hover:border-[#00FFA3]/50 transition-colors group"
                    >
                      <Download className="w-3 h-3 text-white/60 group-hover:text-[#00FFA3] transition-colors" />
                      <span className="text-xs text-white/80 group-hover:text-white font-['Inter']">
                        {artifact.split('/').pop()}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
