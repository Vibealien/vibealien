'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star, GitFork, FileCode, Calendar, MoreVertical, Trash2, Edit, Eye } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/lib/types'

// Simple time ago formatter
const formatTimeAgo = (date: string) => {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

interface ProjectCardProps {
  project: Project
  onStar?: (projectId: string) => void
  onDelete?: (projectId: string) => void
  onEdit?: (projectId: string) => void
  isStarred?: boolean
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onStar,
  onDelete,
  onEdit,
  isStarred = false,
}) => {
  const [showMenu, setShowMenu] = React.useState(false)

  return (
    <motion.div
      className="group relative h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-full p-6 rounded-2xl bg-[#1E1E3F]/50 border border-[#7B2FF7]/20 hover:border-[#00FFA3]/50 transition-all duration-300 overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-br from-[#7B2FF7]/20 to-[#00FFA3]/20 pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <Link
              href={`/editor/${project.id}`}
              className="flex-grow"
            >
              <h3 className="text-xl font-['Orbitron'] font-semibold mb-2 text-white hover:text-[#00FFA3] transition-colors">
                {project.name}
              </h3>
            </Link>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-[#7B2FF7]/20 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-white/60" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#1E1E3F] border border-[#7B2FF7]/30 shadow-xl z-20">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(project.id)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Project
                    </button>
                  )}
                  <Link
                    href={`/editor/${project.id}`}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-[#7B2FF7]/20 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Project
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(project.id)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-white/60 text-sm mb-4 line-clamp-2 font-['Inter']">
            {project.description || 'No description provided'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <button
              onClick={() => onStar?.(project.id)}
              className="flex items-center gap-1 text-white/60 hover:text-[#00FFA3] transition-colors"
            >
              <Star
                className={`w-4 h-4 ${isStarred ? 'fill-[#00FFA3] text-[#00FFA3]' : ''}`}
              />
              <span>{project.starCount}</span>
            </button>

            <div className="flex items-center gap-1 text-white/60">
              <GitFork className="w-4 h-4" />
              <span>{project.forkCount}</span>
            </div>

            <div className="flex items-center gap-1 text-white/60">
              <FileCode className="w-4 h-4" />
              <span>{project.filesCount}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#7B2FF7]/10">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Calendar className="w-3 h-3" />
              <span>
                Updated {formatTimeAgo(project.updatedAt)}
              </span>
            </div>

            {/* Visibility Badge */}
            <div className={`px-2 py-1 rounded text-xs font-['Inter'] ${
              project.visibility === 'PUBLIC'
                ? 'bg-[#00FFA3]/20 text-[#00FFA3]'
                : project.visibility === 'PRIVATE'
                ? 'bg-[#7B2FF7]/20 text-[#7B2FF7]'
                : 'bg-white/10 text-white/60'
            }`}>
              {project.visibility}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
