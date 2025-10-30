// User types
export interface User {
  id: string
  wallet: string
  username?: string
  displayName?: string
  avatar?: string
  bio?: string
  followersCount: number
  followingCount: number
  projectsCount: number
  createdAt: string
}

// Project types
export interface Project {
  id: string
  name: string
  description?: string
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  ownerId: string
  ownerWallet: string
  ownerUsername?: string
  starCount: number
  forkCount: number
  filesCount: number
  createdAt: string
  updatedAt: string
}

export interface ProjectFile {
  id: string
  projectId: string
  path: string
  content: string
  language: string
  size: number
  createdAt: string
  updatedAt: string
}

// Build types
export interface Build {
  id: string
  projectId: string
  buildNumber: number
  status: 'PENDING' | 'BUILDING' | 'SUCCESS' | 'FAILED'
  triggeredBy: 'MANUAL' | 'WEBHOOK'
  logs?: string
  artifacts?: string[]
  createdAt: string
  completedAt?: string
}

// Notification types
export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
  readAt?: string
}

// AI Suggestion types
export interface CodeSuggestion {
  text: string
  confidence: number
  range?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface CodeAnalysis {
  errors: Array<{
    message: string
    severity: 'error' | 'warning' | 'info'
    line: number
    column: number
  }>
  suggestions: string[]
}

export interface Optimization {
  title: string
  description: string
  code: string
  impact: 'high' | 'medium' | 'low'
}

// Collaboration types
export interface CollaborationSession {
  id: string
  projectId: string
  fileId: string
  userId: string
  userWallet: string
  username: string
  joinedAt: string
}

export interface PresenceData {
  userId: string
  username: string
  userWallet: string
  cursor?: {
    line: number
    column: number
  }
  lastSeen: number
}

// Auth types
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}
