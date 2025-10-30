/**
 * Path utilities for file system operations
 * Inspired by Solana Playground's path handling
 */

export class PathUtils {
  /**
   * Convert a relative or absolute path to a full path
   * @param path - The path to convert
   * @returns Full path starting with /
   */
  static convertToFullPath(path: string): string {
    if (!path.startsWith('/')) {
      return '/' + path
    }
    return path
  }

  /**
   * Get the item name from a path
   * @param path - The full path
   * @returns The item name (file or folder)
   */
  static getItemNameFromPath(path: string): string {
    const parts = path.split('/').filter(Boolean)
    return parts[parts.length - 1] || ''
  }

  /**
   * Get the parent path from a path
   * @param path - The full path
   * @returns The parent directory path
   */
  static getParentPathFromPath(path: string): string {
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
  }

  /**
   * Get the item type from a path
   * @param path - The full path
   * @returns Object indicating if it's a file or folder
   */
  static getItemTypeFromPath(path: string): { file: boolean; folder: boolean } {
    const hasExtension = /\.[^/.]+$/.test(path)
    const endsWithSlash = path.endsWith('/')
    
    return {
      file: hasExtension || (!endsWithSlash && !path.endsWith('/')),
      folder: endsWithSlash || (!hasExtension && !endsWithSlash)
    }
  }

  /**
   * Check if a path represents a directory
   * @param path - The path to check
   * @returns True if path is a directory
   */
  static isDirectory(path: string): boolean {
    return path.endsWith('/')
  }

  /**
   * Check if an item name is valid
   * @param name - The item name to validate
   * @returns True if valid
   */
  static isItemNameValid(name: string): boolean {
    if (!name || name.length === 0) return false
    
    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1F]/
    if (invalidChars.test(name)) return false
    
    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                          'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                          'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    
    if (reservedNames.includes(name.toUpperCase())) return false
    
    // Check for . or .. 
    if (name === '.' || name === '..') return false
    
    return true
  }

  /**
   * Check if two paths are equal (case-insensitive)
   * @param path1 - First path
   * @param path2 - Second path
   * @returns True if paths are equal
   */
  static isPathsEqual(path1: string, path2: string): boolean {
    return this.normalizePath(path1) === this.normalizePath(path2)
  }

  /**
   * Normalize a path
   * @param path - The path to normalize
   * @returns Normalized path
   */
  static normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/').toLowerCase()
  }

  /**
   * Join path segments
   * @param segments - Path segments to join
   * @returns Joined path
   */
  static joinPaths(...segments: string[]): string {
    return segments
      .map(segment => segment.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/')
  }

  /**
   * Append slash to path if not present
   * @param path - The path
   * @returns Path with trailing slash
   */
  static appendSlash(path: string): string {
    return path.endsWith('/') ? path : path + '/'
  }

  /**
   * Get file extension from path
   * @param path - The file path
   * @returns File extension (without dot)
   */
  static getExtension(path: string): string {
    const match = path.match(/\.([^/.]+)$/)
    return match ? match[1] : ''
  }

  /**
   * Check if path is a descendant of another path
   * @param path - The path to check
   * @param parentPath - The potential parent path
   * @returns True if path is descendant of parentPath
   */
  static isDescendant(path: string, parentPath: string): boolean {
    const normalizedPath = this.normalizePath(path)
    const normalizedParent = this.normalizePath(parentPath)
    return normalizedPath.startsWith(normalizedParent + '/')
  }
}
