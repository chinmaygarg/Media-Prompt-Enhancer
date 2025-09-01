import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads')
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface LocalUploadResult {
  success: boolean
  data?: {
    id: string
    filename: string
    originalFilename: string
    url: string
    fileType: string
    mimeType: string
    size: number
  }
  error?: string
}

export class LocalFileService {
  // Ensure upload directories exist
  private async ensureUploadDirs() {
    const dirs = ['images', 'videos', 'audio', 'temp']
    for (const dir of dirs) {
      const dirPath = path.join(UPLOAD_DIR, dir)
      try {
        await fs.access(dirPath)
      } catch {
        await fs.mkdir(dirPath, { recursive: true })
      }
    }
  }

  // Get file type from MIME type
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'unknown'
  }

  // Get upload directory for file type
  private getUploadDir(fileType: string): string {
    switch (fileType) {
      case 'image': return 'images'
      case 'video': return 'videos'
      case 'audio': return 'audio'
      default: return 'temp'
    }
  }

  // Validate file
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}`
      }
    }

    return { valid: true }
  }

  // Upload file locally
  async uploadFile(file: File, sessionId?: string): Promise<LocalUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      await this.ensureUploadDirs()

      const fileType = this.getFileType(file.type)
      const uploadDir = this.getUploadDir(fileType)
      
      // Generate unique filename
      const fileId = uuidv4()
      const fileExtension = path.extname(file.name)
      const filename = `${fileId}${fileExtension}`
      
      const filePath = path.join(UPLOAD_DIR, uploadDir, filename)
      
      // Convert File to Buffer for Node.js fs operations
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Save file
      await fs.writeFile(filePath, buffer)
      
      return {
        success: true,
        data: {
          id: fileId,
          filename,
          originalFilename: file.name,
          url: `/uploads/${uploadDir}/${filename}`,
          fileType,
          mimeType: file.type,
          size: file.size
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Validate URL (for URL-based references)
  validateUrl(url: string): { valid: boolean; error?: string; type?: string } {
    try {
      const urlObj = new URL(url)
      
      // Check if it's a valid HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL must use HTTP or HTTPS protocol' }
      }
      
      // Try to determine file type from URL
      const pathname = urlObj.pathname.toLowerCase()
      let type = 'unknown'
      
      if (/\.(jpg|jpeg|png|webp|gif)$/i.test(pathname)) {
        type = 'image'
      } else if (/\.(mp4|webm|mov)$/i.test(pathname)) {
        type = 'video'
      } else if (/\.(mp3|wav|ogg|m4a)$/i.test(pathname)) {
        type = 'audio'
      }
      
      return { valid: true, type }
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' }
    }
  }
}

// Export singleton instance
export const localFileService = new LocalFileService()