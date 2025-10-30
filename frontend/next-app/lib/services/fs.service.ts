/**
 * File System Service using @isomorphic-git/lightning-fs
 * Based on Solana Playground's PgFs architecture
 */

import FS from '@isomorphic-git/lightning-fs'
import { PathUtils } from '../utils/path'

interface FileSystemStats {
  type: 'file' | 'dir'
  size: number
  mtimeMs: number
  isFile(): boolean
  isDirectory(): boolean
}

class FsService {
  private _fs = new FS('vibingalien-playground').promises

  /**
   * Write a file
   * @param path - File path
   * @param data - File content
   * @param opts - Options
   */
  async writeFile(
    path: string,
    data: string,
    opts?: { createParents?: boolean }
  ): Promise<void> {
    path = PathUtils.convertToFullPath(path)

    if (opts?.createParents) {
      const parentFolder = PathUtils.getParentPathFromPath(path)
      await this.createDir(parentFolder, opts)
    }

    await this._fs.writeFile(path, data)
  }

  /**
   * Read a file as string
   * @param path - File path
   * @returns File content
   */
  async readToString(path: string): Promise<string> {
    path = PathUtils.convertToFullPath(path)
    return (await this._fs.readFile(path, { encoding: 'utf8' })) as string
  }

  /**
   * Read a file and parse as JSON
   * @param path - File path
   * @returns Parsed JSON
   */
  async readToJSON<T>(path: string): Promise<T> {
    const data = await this.readToString(path)
    return JSON.parse(data)
  }

  /**
   * Read a file as JSON with default fallback
   * @param path - File path
   * @param defaultValue - Default value if file doesn't exist
   * @returns Parsed JSON or default value
   */
  async readToJSONOrDefault<T>(path: string, defaultValue: T): Promise<T> {
    try {
      return await this.readToJSON<T>(path)
    } catch {
      return defaultValue
    }
  }

  /**
   * Rename an item (file or folder)
   * @param oldPath - Old path
   * @param newPath - New path
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    oldPath = PathUtils.convertToFullPath(oldPath)
    newPath = PathUtils.convertToFullPath(newPath)
    await this._fs.rename(oldPath, newPath)
  }

  /**
   * Remove a file
   * @param path - File path
   */
  async removeFile(path: string): Promise<void> {
    path = PathUtils.convertToFullPath(path)
    await this._fs.unlink(path)
  }

  /**
   * Create a directory
   * @param path - Directory path
   * @param opts - Options
   */
  async createDir(
    path: string,
    opts?: { createParents?: boolean }
  ): Promise<void> {
    path = PathUtils.convertToFullPath(path)

    if (opts?.createParents) {
      const folders = path.split('/').filter(Boolean)
      let currentPath = ''
      for (let i = 0; i < folders.length; i++) {
        currentPath += '/' + folders[i]
        const exists = await this.exists(currentPath)
        if (!exists) {
          try {
            await this._fs.mkdir(currentPath)
          } catch (e: any) {
            // Ignore if already exists
            if (e.code !== 'EEXIST') throw e
          }
        }
      }
    } else {
      await this._fs.mkdir(path)
    }
  }

  /**
   * Read a directory
   * @param path - Directory path
   * @returns Array of item names
   */
  async readDir(path: string): Promise<string[]> {
    path = PathUtils.convertToFullPath(path)
    return await this._fs.readdir(path)
  }

  /**
   * Remove a directory
   * @param path - Directory path
   * @param opts - Options
   */
  async removeDir(
    path: string,
    opts?: { recursive?: boolean }
  ): Promise<void> {
    path = PathUtils.convertToFullPath(path)

    if (opts?.recursive) {
      const recursivelyRmdir = async (dir: string[], currentPath: string) => {
        if (!dir.length) {
          await this._fs.rmdir(currentPath)
          return
        }

        for (const childName of dir) {
          const childPath = currentPath + '/' + childName
          const metadata = await this.getMetadata(childPath)
          if (metadata.isDirectory()) {
            const childDir = await this.readDir(childPath)
            if (childDir.length) {
              await recursivelyRmdir(childDir, childPath)
            } else {
              await this._fs.rmdir(childPath)
            }
          } else {
            await this.removeFile(childPath)
          }
        }

        const _dir = await this.readDir(currentPath)
        if (!_dir.length) await this._fs.rmdir(currentPath)
      }

      const dir = await this.readDir(path)
      await recursivelyRmdir(dir, path)
    } else {
      await this._fs.rmdir(path)
    }
  }

  /**
   * Get file/directory metadata
   * @param path - Item path
   * @returns File stats
   */
  async getMetadata(path: string): Promise<FileSystemStats> {
    path = PathUtils.convertToFullPath(path)
    const stats = await this._fs.stat(path)

    return {
      type: stats.isFile() ? 'file' : 'dir',
      size: stats.size || 0,
      mtimeMs: stats.mtimeMs || Date.now(),
      isFile: () => stats.isFile(),
      isDirectory: () => stats.isDirectory()
    }
  }

  /**
   * Check if an item exists
   * @param path - Item path
   * @returns True if exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      path = PathUtils.convertToFullPath(path)
      await this._fs.stat(path)
      return true
    } catch (e: any) {
      if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return false
      throw e
    }
  }
}

export const fsService = new FsService()
