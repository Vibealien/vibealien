// API Gateway base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// WebSocket URLs
export const WS_COLLABORATION_URL = process.env.NEXT_PUBLIC_WS_COLLAB_URL || 'ws://localhost:8005/ws'
export const WS_NOTIFICATION_URL = process.env.NEXT_PUBLIC_WS_NOTIF_URL || 'ws://localhost:8006/ws'

// Solana Network
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'

// Brand colors (from designguild.txt)
export const COLORS = {
  cosmicViolet: '#7B2FF7',
  neonMint: '#00FFA3',
  deepSpaceBlack: '#0C0C1E',
  orbitGray: '#3A3A5A',
  voidBlue: '#1E1E3F',
} as const

// File size limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_FILES_PER_PROJECT = 100

// Pagination
export const PROJECTS_PER_PAGE = 12
export const NOTIFICATIONS_PER_PAGE = 50

// Session Management
export const SESSION_CONFIG = {
  // How often to check session validity (in milliseconds)
  CHECK_INTERVAL: 60000, // 60 seconds
  
  // Refresh token when this much time remains until expiry (in milliseconds)
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  
  // Enable/disable automatic session monitoring
  ENABLE_AUTO_MONITORING: true,
} as const
