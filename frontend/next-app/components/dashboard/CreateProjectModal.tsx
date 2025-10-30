'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (project: {
    name: string
    description: string
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  }) => Promise<void>
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'UNLISTED'>('PUBLIC')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      await onCreate({ name, description, visibility })
      // Reset form
      setName('')
      setDescription('')
      setVisibility('PUBLIC')
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="w-full max-w-lg bg-[#1E1E3F] rounded-2xl border border-[#7B2FF7]/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#7B2FF7]/20">
                <h2 className="text-2xl font-['Orbitron'] font-bold bg-gradient-to-r from-[#7B2FF7] to-[#00FFA3] bg-clip-text text-transparent">
                  Create New Project
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[#7B2FF7]/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-['Inter'] font-medium mb-2 text-white/80">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="my-solana-project"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#0C0C1E] border border-[#7B2FF7]/30 focus:border-[#00FFA3] focus:outline-none text-white placeholder-white/40 transition-colors font-['Inter']"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-['Inter'] font-medium mb-2 text-white/80">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of your project..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-[#0C0C1E] border border-[#7B2FF7]/30 focus:border-[#00FFA3] focus:outline-none text-white placeholder-white/40 transition-colors resize-none font-['Inter']"
                  />
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-['Inter'] font-medium mb-3 text-white/80">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['PUBLIC', 'PRIVATE', 'UNLISTED'] as const).map((vis) => (
                      <button
                        key={vis}
                        type="button"
                        onClick={() => setVisibility(vis)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all font-['Inter'] text-sm ${
                          visibility === vis
                            ? 'border-[#00FFA3] bg-[#00FFA3]/10 text-[#00FFA3]'
                            : 'border-[#7B2FF7]/30 bg-[#0C0C1E] text-white/60 hover:border-[#7B2FF7]/50'
                        }`}
                      >
                        {vis}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-white/40 font-['Inter']">
                    {visibility === 'PUBLIC' && 'Anyone can view and fork this project'}
                    {visibility === 'PRIVATE' && 'Only you can access this project'}
                    {visibility === 'UNLISTED' && 'Only people with the link can view'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="cosmic"
                    className="flex-1"
                    disabled={isLoading || !name.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
