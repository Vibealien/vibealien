'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, File, Folder, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'

interface CreateFileModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (path: string, isFolder: boolean) => Promise<void>
  existingPaths: string[]
}

export const CreateFileModal: React.FC<CreateFileModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingPaths,
}) => {
  const [path, setPath] = useState('')
  const [isFolder, setIsFolder] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setError('')

    // Validation
    if (!path.trim()) {
      setError('Path is required')
      return
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9/_.-]+$/.test(path)) {
      setError('Path contains invalid characters')
      return
    }

    // Check if path already exists
    if (existingPaths.includes(path)) {
      setError('A file or folder with this path already exists')
      return
    }

    // For files, ensure it has an extension
    if (!isFolder && !path.includes('.')) {
      setError('File must have an extension (e.g., .rs, .toml)')
      return
    }

    setIsCreating(true)
    try {
      await onCreate(path, isFolder)
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setPath('')
    setIsFolder(false)
    setError('')
    setIsCreating(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div
              className="bg-[#1E1E3F] rounded-2xl border border-[#7B2FF7]/30 w-full max-w-md shadow-[0_0_50px_rgba(123,47,247,0.3)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#7B2FF7]/20">
                <h2 className="text-xl font-['Orbitron'] font-bold text-white">
                  Create {isFolder ? 'Folder' : 'File'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-[#7B2FF7]/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={!isFolder ? 'cosmic' : 'outline'}
                    onClick={() => setIsFolder(false)}
                    className="flex-1"
                  >
                    <File className="w-4 h-4 mr-2" />
                    File
                  </Button>
                  <Button
                    variant={isFolder ? 'cosmic' : 'outline'}
                    onClick={() => setIsFolder(true)}
                    className="flex-1"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    Folder
                  </Button>
                </div>

                {/* Path Input */}
                <div>
                  <label className="block text-sm font-['Inter'] text-white/80 mb-2">
                    {isFolder ? 'Folder Path' : 'File Path'}
                  </label>
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => {
                      setPath(e.target.value)
                      setError('')
                    }}
                    placeholder={isFolder ? 'e.g., src/utils' : 'e.g., src/lib.rs'}
                    className="w-full px-4 py-3 rounded-lg bg-[#0C0C1E] border border-[#7B2FF7]/30 focus:border-[#00FFA3] focus:outline-none text-white placeholder-white/40 transition-colors font-['Courier_New']"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isCreating) {
                        handleCreate()
                      }
                    }}
                  />
                  <p className="mt-2 text-xs text-white/40 font-['Inter']">
                    {isFolder
                      ? 'Use "/" to create nested folders (e.g., src/utils)'
                      : 'Include extension (.rs, .toml, .json, etc.)'}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 font-['Inter']">{error}</p>
                  </motion.div>
                )}

                {/* Quick Templates */}
                {!isFolder && (
                  <div>
                    <p className="text-xs text-white/60 font-['Inter'] mb-2">Quick templates:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'lib.rs', path: 'src/lib.rs' },
                        { label: 'main.rs', path: 'src/main.rs' },
                        { label: 'Cargo.toml', path: 'Cargo.toml' },
                        { label: 'README.md', path: 'README.md' },
                      ].map((template) => (
                        <button
                          key={template.path}
                          onClick={() => setPath(template.path)}
                          className="px-3 py-1 text-xs rounded-lg bg-[#7B2FF7]/10 border border-[#7B2FF7]/30 text-white/70 hover:bg-[#7B2FF7]/20 hover:text-white transition-colors font-['Inter']"
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-[#7B2FF7]/20">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="cosmic"
                  onClick={handleCreate}
                  disabled={isCreating || !path.trim()}
                  className="flex-1"
                >
                  {isCreating ? 'Creating...' : `Create ${isFolder ? 'Folder' : 'File'}`}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
