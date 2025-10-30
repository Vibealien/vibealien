/**
 * Shared types and interfaces for Vibe Code platform
 */

// ============================================
// Event Types
// ============================================

export interface BaseEvent<T = unknown> {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  data: T;
}

export interface UserAuthenticatedEvent {
  walletAddress: string;
  timestamp: string;
}

export interface ProjectCreatedEvent {
  projectId: string;
  title: string;
  authorId: string;
  isPublic: boolean;
}

export interface ProjectUpdatedEvent {
  projectId: string;
  authorId: string;
  changes: string[];
}

export interface ProjectForkedEvent {
  originalProjectId: string;
  newProjectId: string;
  forkedBy: string;
}

export interface BuildStartedEvent {
  buildId: string;
  projectId: string;
  authorId: string;
}

export interface BuildCompletedEvent {
  buildId: string;
  projectId: string;
  authorId: string;
  programId: string;
  status: 'success' | 'failed';
  logs: string;
  errorMessage?: string;
}

export interface UserFollowedEvent {
  followerId: string;
  followingId: string;
}

export interface CollaborationSessionEvent {
  sessionId: string;
  projectId: string;
  participants: string[];
  action: 'started' | 'ended' | 'user_joined' | 'user_left';
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

// ============================================
// Domain Models
// ============================================

export interface User {
  id: string;
  walletAddress: string;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  projectCount: number;
  followerCount: number;
  followingCount: number;
  totalVibes: number;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  authorId: string;
  programId: string | null;
  isPublic: boolean;
  forkedFrom: string | null;
  forkCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  language: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface Build {
  id: string;
  projectId: string;
  authorId: string;
  status: BuildStatus;
  programId: string | null;
  logs: string;
  errorMessage: string | null;
  buildTime: number | null;
  deploymentTxId: string | null;
  network: string;
  startedAt: string;
  completedAt: string | null;
}

export enum BuildStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  BUILDING = 'BUILDING',
  DEPLOYING = 'DEPLOYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export enum NotificationType {
  BUILD_COMPLETE = 'BUILD_COMPLETE',
  BUILD_FAILED = 'BUILD_FAILED',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  PROJECT_FORKED = 'PROJECT_FORKED',
  PROJECT_REMIX = 'PROJECT_REMIX',
  COLLABORATION_INVITE = 'COLLABORATION_INVITE',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  ownerId: string;
  participants: string[];
  isActive: boolean;
  createdAt: string;
  endedAt: string | null;
}

// ============================================
// Authentication
// ============================================

export interface AuthChallenge {
  message: string;
  expiresAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  walletAddress: string;
  iat: number;
  exp: number;
}

// ============================================
// Request DTOs
// ============================================

export interface CreateProjectRequest {
  title: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface CreateBuildRequest {
  projectId: string;
  network?: 'devnet' | 'testnet' | 'mainnet';
}

export interface UpdateUserRequest {
  username?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  twitter?: string;
  github?: string;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectListQuery extends PaginationQuery {
  authorId?: string;
  tags?: string[];
  isPublic?: boolean;
  search?: string;
}

// ============================================
// WebSocket Messages
// ============================================

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

export interface CollaborationEdit {
  userId: string;
  fileId: string;
  operation: 'insert' | 'delete';
  position: number;
  content: string;
  timestamp: number;
}

export interface CursorPosition {
  userId: string;
  line: number;
  column: number;
  color: string;
}

export interface UserPresence {
  userId: string;
  username: string;
  avatar: string | null;
  cursor: {
    line: number;
    column: number;
  };
  color: string;
  lastActivity: string;
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Awaitable<T> = T | Promise<T>;
