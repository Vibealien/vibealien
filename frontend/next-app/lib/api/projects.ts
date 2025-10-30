import axios from 'axios'
import { API_BASE_URL } from '../constants'
import type { Project, ProjectFile, Build } from '../types'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/projects`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Add token to requests
const getAuthHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

// Project API functions
export const projectsApi = {
  // Get all projects (with pagination)
  getProjects: async (token: string, page = 1, limit = 20): Promise<{ projects: Project[]; total: number }> => {
    const { data } = await api.get(`?page=${page}&limit=${limit}`, getAuthHeaders(token))
    console.log('[ProjectsAPI] getProjects response:', data)
    return data.data // Backend returns { success: true, data: { projects, total } }
  },

  // Get user's projects
  getMyProjects: async (token: string): Promise<Project[]> => {
    const { data } = await api.get('/me', getAuthHeaders(token))
    console.log('[ProjectsAPI] getMyProjects response:', data)
    return data.data.projects // Backend returns { success: true, data: { projects: [...] } }
  },

  // Get single project
  getProject: async (token: string, projectId: string): Promise<Project> => {
    const { data } = await api.get(`/${projectId}`, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: project }
  },

  // Create project
  createProject: async (
    token: string,
    project: {
      name: string
      description?: string
      visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
    }
  ): Promise<Project> => {
    const { data } = await api.post('', project, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: project }
  },

  // Update project
  updateProject: async (
    token: string,
    projectId: string,
    updates: {
      name?: string
      description?: string
      visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
    }
  ): Promise<Project> => {
    const { data } = await api.put(`/${projectId}`, updates, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: project }
  },

  // Delete project
  deleteProject: async (token: string, projectId: string): Promise<void> => {
    await api.delete(`/${projectId}`, getAuthHeaders(token))
  },

  // Star project
  starProject: async (token: string, projectId: string): Promise<void> => {
    await api.post(`/${projectId}/star`, {}, getAuthHeaders(token))
  },

  // Unstar project
  unstarProject: async (token: string, projectId: string): Promise<void> => {
    await api.delete(`/${projectId}/star`, getAuthHeaders(token))
  },

  // Fork project
  forkProject: async (token: string, projectId: string): Promise<Project> => {
    const { data } = await api.post(`/${projectId}/fork`, {}, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: project }
  },

  // Get project files
  getFiles: async (token: string, projectId: string): Promise<ProjectFile[]> => {
    const { data } = await api.get(`/${projectId}/files`, getAuthHeaders(token))
    return data.data.files || data.data // Backend returns { success: true, data: { files: [...] } } or { success: true, data: [...] }
  },

  // Get single file
  getFile: async (token: string, projectId: string, fileId: string): Promise<ProjectFile> => {
    const { data } = await api.get(`/${projectId}/files/${fileId}`, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: file }
  },

  // Create file
  createFile: async (
    token: string,
    projectId: string,
    file: {
      path: string
      content: string
      language: string
    }
  ): Promise<ProjectFile> => {
    const { data } = await api.post(`/${projectId}/files`, file, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: file }
  },

  // Update file
  updateFile: async (
    token: string,
    projectId: string,
    fileId: string,
    updates: {
      content?: string
      path?: string
    }
  ): Promise<ProjectFile> => {
    const { data } = await api.put(`/${projectId}/files/${fileId}`, updates, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: file }
  },

  // Delete file
  deleteFile: async (token: string, projectId: string, fileId: string): Promise<void> => {
    await api.delete(`/${projectId}/files/${fileId}`, getAuthHeaders(token))
  },

  // Get project builds
  getBuilds: async (token: string, projectId: string): Promise<Build[]> => {
    const { data } = await api.get(`/${projectId}/builds`, getAuthHeaders(token))
    return data.data.builds || data.data // Backend returns { success: true, data: { builds: [...] } } or { success: true, data: [...] }
  },

  // Trigger new build
  triggerBuild: async (token: string, projectId: string): Promise<Build> => {
    const { data } = await api.post(`/${projectId}/builds`, {}, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: build }
  },

  // Get build details
  getBuild: async (token: string, projectId: string, buildId: string): Promise<Build> => {
    const { data } = await api.get(`/${projectId}/builds/${buildId}`, getAuthHeaders(token))
    return data.data // Backend returns { success: true, data: build }
  },
}
