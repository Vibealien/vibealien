import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { WS_COLLABORATION_URL } from '../constants'

class CollaborationService {
  private providers: Map<string, WebsocketProvider> = new Map()
  private documents: Map<string, Y.Doc> = new Map()

  /**
   * Connect to a collaboration session for a file
   */
  connect(
    projectId: string,
    fileId: string,
    token: string,
    onSync: (doc: Y.Doc) => void,
    onUpdate: (update: Uint8Array) => void,
    onPresence: (users: Map<number, any>) => void
  ): { doc: Y.Doc; provider: WebsocketProvider } {
    const roomName = `${projectId}:${fileId}`
    
    // Return existing connection if available
    if (this.providers.has(roomName)) {
      const provider = this.providers.get(roomName)!
      const doc = this.documents.get(roomName)!
      return { doc, provider }
    }

    // Create new Yjs document
    const doc = new Y.Doc()
    this.documents.set(roomName, doc)

    // Create WebSocket provider
    const provider = new WebsocketProvider(
      WS_COLLABORATION_URL,
      roomName,
      doc,
      {
        params: {
          token,
          projectId,
          fileId,
        },
      }
    )

    // Listen to sync events
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        onSync(doc)
      }
    })

    // Listen to document updates
    doc.on('update', (update: Uint8Array) => {
      onUpdate(update)
    })

    // Listen to presence updates
    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates()
      onPresence(states)
    })

    this.providers.set(roomName, provider)
    return { doc, provider }
  }

  /**
   * Disconnect from a collaboration session
   */
  disconnect(projectId: string, fileId: string) {
    const roomName = `${projectId}:${fileId}`
    const provider = this.providers.get(roomName)
    
    if (provider) {
      provider.disconnect()
      provider.destroy()
      this.providers.delete(roomName)
    }

    const doc = this.documents.get(roomName)
    if (doc) {
      doc.destroy()
      this.documents.delete(roomName)
    }
  }

  /**
   * Update local user's cursor position
   */
  updateCursor(
    projectId: string,
    fileId: string,
    cursor: { line: number; column: number }
  ) {
    const roomName = `${projectId}:${fileId}`
    const provider = this.providers.get(roomName)
    
    if (provider) {
      provider.awareness.setLocalStateField('cursor', cursor)
    }
  }

  /**
   * Update local user's information
   */
  setUserInfo(
    projectId: string,
    fileId: string,
    user: {
      userId: string
      username: string
      userWallet: string
      color: string
    }
  ) {
    const roomName = `${projectId}:${fileId}`
    const provider = this.providers.get(roomName)
    
    if (provider) {
      provider.awareness.setLocalStateField('user', user)
    }
  }

  /**
   * Get the Yjs text type for a file
   */
  getText(projectId: string, fileId: string): Y.Text | null {
    const roomName = `${projectId}:${fileId}`
    const doc = this.documents.get(roomName)
    
    if (doc) {
      return doc.getText('content')
    }
    
    return null
  }

  /**
   * Disconnect all sessions
   */
  disconnectAll() {
    this.providers.forEach((provider) => {
      provider.disconnect()
      provider.destroy()
    })
    this.providers.clear()

    this.documents.forEach((doc) => {
      doc.destroy()
    })
    this.documents.clear()
  }
}

export const collaborationService = new CollaborationService()
