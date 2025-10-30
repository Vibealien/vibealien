'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Rocket, Star, Users, TrendingUp, Search, Filter } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useProjectStore } from '@/lib/stores/useProjectStore'
import { projectsApi } from '@/lib/api/projects'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, token, user, _hasHydrated } = useAuthStore()
  const { projects, setProjects, addProject, removeProject, setLoading, isLoading } = useProjectStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'my-projects'>('all')

  // Redirect if not authenticated (only after hydration)
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/')
      toast.error('Please connect your wallet to access the dashboard')
    }
  }, [isAuthenticated, _hasHydrated, router])

  // Fetch projects on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchProjects()
    }
  }, [isAuthenticated, token, filterType])

  const fetchProjects = async () => {
    if (!token) return

    setLoading(true)
    try {
      if (filterType === 'my-projects') {
        console.log('[Dashboard] Fetching my projects...')
        const myProjects = await projectsApi.getMyProjects(token)
        console.log('[Dashboard] My projects:', myProjects)
        setProjects(myProjects)
      } else {
        console.log('[Dashboard] Fetching all projects...')
        const { projects: allProjects } = await projectsApi.getProjects(token, 1, 50)
        console.log('[Dashboard] All projects:', allProjects)
        setProjects(allProjects)
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (project: {
    name: string
    description: string
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  }) => {
    if (!token) return

    try {
      const newProject = await projectsApi.createProject(token, project)
      addProject(newProject)
      toast.success('Project created successfully! 🚀')
      router.push(`/editor/${newProject.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
      throw error
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      await projectsApi.deleteProject(token, projectId)
      removeProject(projectId)
      toast.success('Project deleted')
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleStarProject = async (projectId: string) => {
    if (!token) return

    try {
      await projectsApi.starProject(token, projectId)
      toast.success('Project starred! ⭐')
      fetchProjects() // Refresh to update star count
    } catch (error) {
      console.error('Failed to star project:', error)
      toast.error('Failed to star project')
    }
  }

  // Filter projects by search query (with null safety)
  const filteredProjects = (projects || []).filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-['Inter']">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <motion.h1
            className="text-4xl md:text-5xl font-['Orbitron'] font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="bg-gradient-to-r from-[#7B2FF7] to-[#00FFA3] bg-clip-text text-transparent">
              Dashboard
            </span>
          </motion.h1>
          <motion.p
            className="text-white/60 font-['Inter'] text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Welcome back, {user?.username || 'Cosmic Developer'}! 👽
          </motion.p>
        </div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            icon={<Rocket className="w-6 h-6" />}
            label="Projects"
            value={user?.projectsCount || 0}
            color="#7B2FF7"
          />
          <StatCard
            icon={<Star className="w-6 h-6" />}
            label="Stars Received"
            value={42}
            color="#00FFA3"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Followers"
            value={user?.followersCount || 0}
            color="#7B2FF7"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Total Builds"
            value={128}
            color="#00FFA3"
          />
        </motion.div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#1E1E3F]/50 border border-[#7B2FF7]/30 focus:border-[#00FFA3] focus:outline-none text-white placeholder-white/40 transition-colors font-['Inter']"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'cosmic' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                <Filter className="w-4 h-4 mr-2" />
                All Projects
              </Button>
              <Button
                variant={filterType === 'my-projects' ? 'cosmic' : 'outline'}
                onClick={() => setFilterType('my-projects')}
              >
                My Projects
              </Button>
            </div>

            {/* Create Button */}
            <Button
              variant="cosmic"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-[#7B2FF7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60 font-['Inter']">Loading projects...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProjectCard
                    project={project}
                    onStar={handleStarProject}
                    onDelete={handleDeleteProject}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Rocket className="w-16 h-16 mx-auto mb-4 text-[#7B2FF7]/50" />
              <h3 className="text-2xl font-['Orbitron'] font-semibold mb-2 text-white/80">
                No projects found
              </h3>
              <p className="text-white/60 font-['Inter'] mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start your cosmic journey by creating your first project!'}
              </p>
              {!searchQuery && (
                <Button variant="cosmic" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  )
}

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: number
  color: string
}> = ({ icon, label, value, color }) => (
  <div className="p-6 rounded-2xl bg-[#1E1E3F]/50 border border-[#7B2FF7]/20 hover:border-[#00FFA3]/50 transition-all duration-300">
    <div className="flex items-center gap-4">
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-3xl font-['Orbitron'] font-bold" style={{ color }}>
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-white/60 font-['Inter']">{label}</div>
      </div>
    </div>
  </div>
)
