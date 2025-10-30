/**
 * File Operations Service
 * Handles all file CRUD operations with offline support
 * Separates file management logic from UI components
 */

import { projectsApi } from '../api/projects'
import type { ProjectFile } from '../types'
import { offlineStorageService } from './offline-storage.service'
import { toast } from 'react-hot-toast'

interface CreateFileOptions {
  path: string
  content: string
  language: string
  isFolder?: boolean
}

interface FileOperationResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

class FileOperationsService {
  /**
   * Create a new file or folder
   */
  async createFile(
    projectId: string,
    options: CreateFileOptions,
    token: string | null,
    isOnline: boolean
  ): Promise<FileOperationResult<ProjectFile>> {
    try {
      const { path, content, language, isFolder } = options

      if (isFolder) {
        // Folders are tracked client-side only
        return { success: true }
      }

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`
      const tempFile: ProjectFile = {
        id: tempId,
        projectId,
        path,
        content,
        language,
        size: content.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save to offline storage first
      await offlineStorageService.saveFileCreate(projectId, tempId, path, content, language)

      // If online, create on server
      if (isOnline && token) {
        try {
          const file = await projectsApi.createFile(token, projectId, {
            path,
            content,
            language,
          })
          return { success: true, data: file }
        } catch (error) {
          console.error('Failed to create file on server:', error)
          toast('⚠️ File saved locally - will sync when online', { icon: '💾' })
          return { success: true, data: tempFile }
        }
      } else {
        toast.success('📄 File saved locally (offline)')
        return { success: true, data: tempFile }
      }
    } catch (error: any) {
      console.error('Failed to create file:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Rename a file
   */
  async renameFile(
    projectId: string,
    fileId: string,
    oldPath: string,
    newPath: string,
    token: string | null,
    isOnline: boolean
  ): Promise<FileOperationResult> {
    try {
      // Save to offline storage first
      await offlineStorageService.saveFileRename(projectId, fileId, oldPath, newPath)

      // If online, rename on server
      if (isOnline && token) {
        try {
          await projectsApi.updateFile(token, projectId, fileId, { path: newPath })
          toast.success('File renamed successfully! ✏️')
        } catch (error) {
          console.error('Failed to rename on server:', error)
          toast('⚠️ Rename saved locally - will sync when online', { icon: '💾' })
        }
      } else {
        toast.success('✏️ Rename saved locally (offline)')
      }

      return { success: true }
    } catch (error: any) {
      console.error('Failed to rename file:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Move a file to a new location
   */
  async moveFile(
    projectId: string,
    fileId: string,
    oldPath: string,
    newPath: string,
    token: string | null,
    isOnline: boolean
  ): Promise<FileOperationResult> {
    try {
      // Save to offline storage first
      await offlineStorageService.saveFileMove(projectId, fileId, oldPath, newPath)

      // If online, move on server
      if (isOnline && token) {
        try {
          await projectsApi.updateFile(token, projectId, fileId, { path: newPath })
          toast.success('File moved successfully! 📁')
        } catch (error) {
          console.error('Failed to move on server:', error)
          toast('⚠️ Move saved locally - will sync when online', { icon: '💾' })
        }
      } else {
        toast.success('📁 Move saved locally (offline)')
      }

      return { success: true }
    } catch (error: any) {
      console.error('Failed to move file:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(
    projectId: string,
    fileId: string,
    filePath: string,
    token: string | null,
    isOnline: boolean
  ): Promise<FileOperationResult> {
    try {
      // Save to offline storage first
      await offlineStorageService.saveFileDelete(projectId, fileId, filePath)

      // If online, delete on server
      if (isOnline && token) {
        try {
          await projectsApi.deleteFile(token, projectId, fileId)
          toast.success('File deleted! 🗑️')
        } catch (error) {
          console.error('Failed to delete on server:', error)
          toast('⚠️ Delete saved locally - will sync when online', { icon: '💾' })
        }
      } else {
        toast.success('🗑️ Delete saved locally (offline)')
      }

      return { success: true }
    } catch (error: any) {
      console.error('Failed to delete file:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Duplicate a file
   */
  async duplicateFile(
    projectId: string,
    file: ProjectFile,
    token: string | null,
    isOnline: boolean
  ): Promise<FileOperationResult<ProjectFile>> {
    try {
      // Generate new path
      const pathParts = file.path.split('/')
      const fileName = pathParts.pop() || ''
      const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : ''
      const baseName = fileName.replace(ext, '')
      const newFileName = `${baseName}_copy${ext}`
      const newPath = pathParts.length > 0 
        ? `${pathParts.join('/')}/${newFileName}`
        : newFileName

      // Create the duplicate using createFile
      return this.createFile(
        projectId,
        {
          path: newPath,
          content: file.content,
          language: file.language,
        },
        token,
        isOnline
      )
    } catch (error: any) {
      console.error('Failed to duplicate file:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update file content
   */
  async updateFileContent(
    projectId: string,
    fileId: string,
    filePath: string,
    content: string,
    language: string,
    token: string | null,
    isOnline: boolean
  ): Promise<FileOperationResult> {
    try {
      // Save to offline storage first
      await offlineStorageService.saveFileChange(
        projectId,
        fileId,
        filePath,
        content,
        language
      )

      // If online, save to server
      if (isOnline && token) {
        try {
          await projectsApi.updateFile(token, projectId, fileId, { content })
        } catch (error) {
          console.error('Failed to save to server:', error)
          // Don't show error - it's already saved locally
        }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Failed to update file:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get file template based on filename and language
   */
  getFileTemplate(path: string, language: string, projectName?: string): string {
    const filename = path.split('/').pop() || ''
    
    if (filename === 'Cargo.toml') {
      return `[package]
name = "${projectName || 'my-project'}"
version = "0.1.0"
edition = "2021"

[dependencies]
`
    }
    
    if (filename === 'lib.rs') {
      return `// ${projectName || 'Library'} - Main library file

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
`
    }
    
    if (filename === 'main.rs') {
      return `// ${projectName || 'Project'} - Main entry point

fn main() {
    println!("Hello, Solana! 🚀");
}
`
    }
    
    if (filename === 'README.md') {
      return `# ${projectName || 'Project'}

A Solana smart contract project

## Building

\`\`\`bash
cargo build-bpf
\`\`\`

## Testing

\`\`\`bash
cargo test
\`\`\`
`
    }
    
    return '' // Empty content for other files
  }
}

export const fileOperationsService = new FileOperationsService()
