import { create } from 'zustand'
import type { Project, ProjectFile } from '../types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  currentFiles: ProjectFile[]
  activeFile: ProjectFile | null
  isLoading: boolean
  
  // Actions
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  removeProject: (projectId: string) => void
  setCurrentProject: (project: Project | null) => void
  setCurrentFiles: (files: ProjectFile[] | ((prev: ProjectFile[]) => ProjectFile[])) => void
  setActiveFile: (file: ProjectFile | null) => void
  updateFile: (fileId: string, updates: Partial<ProjectFile>) => void
  addFile: (file: ProjectFile) => void
  removeFile: (fileId: string) => void
  setLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  currentFiles: [],
  activeFile: null,
  isLoading: false,

  setProjects: (projects) => set({ projects }),

  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects],
  })),

  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, ...updates } : p
    ),
    currentProject:
      state.currentProject?.id === projectId
        ? { ...state.currentProject, ...updates }
        : state.currentProject,
  })),

  removeProject: (projectId) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== projectId),
    currentProject:
      state.currentProject?.id === projectId ? null : state.currentProject,
  })),

  setCurrentProject: (project) => set({ currentProject: project }),

  setCurrentFiles: (files) => set((state) => ({
    currentFiles: typeof files === 'function' ? files(state.currentFiles) : files
  })),

  setActiveFile: (file) => set({ activeFile: file }),

  updateFile: (fileId, updates) => set((state) => ({
    currentFiles: state.currentFiles.map((f) =>
      f.id === fileId ? { ...f, ...updates } : f
    ),
    activeFile:
      state.activeFile?.id === fileId
        ? { ...state.activeFile, ...updates }
        : state.activeFile,
  })),

  addFile: (file) => set((state) => ({
    currentFiles: [...state.currentFiles, file],
  })),

  removeFile: (fileId) => set((state) => ({
    currentFiles: state.currentFiles.filter((f) => f.id !== fileId),
    activeFile: state.activeFile?.id === fileId ? null : state.activeFile,
  })),

  setLoading: (loading) => set({ isLoading: loading }),
}))
