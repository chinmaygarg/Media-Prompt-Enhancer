// Re-export types from main types file for storage-specific usage
export type {
  MediaAsset,
  FileUploadResponse
} from '../../types'

// Storage-specific types
export interface StorageError {
  message: string
  code?: string
  statusCode?: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  filename: string
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  fileType?: 'image' | 'video' | 'audio'
  mimeType?: string
  sizeBytes?: number
}

export interface StorageBucketConfig {
  name: string
  public: boolean
  allowedMimeTypes: string[]
  maxFileSizeMB: number
  description: string
}

// Predefined storage configurations
export const STORAGE_BUCKETS: Record<string, StorageBucketConfig> = {
  'user-uploads': {
    name: 'user-uploads',
    public: false,
    allowedMimeTypes: [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      // Videos
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo', // AVI
      // Audio
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg'
    ],
    maxFileSizeMB: 500, // Max per file
    description: 'Private bucket for user-uploaded reference files'
  },
  'system': {
    name: 'system',
    public: true,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ],
    maxFileSizeMB: 10,
    description: 'Public bucket for system templates and defaults'
  }
}

// File type detection mappings
export const MIME_TYPE_MAP: Record<string, 'image' | 'video' | 'audio'> = {
  // Images
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',
  
  // Videos
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'video/avi': 'video',
  'video/mov': 'video',
  
  // Audio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/aac': 'audio'
}

// File extension to MIME type mappings
export const EXTENSION_TO_MIME: Record<string, string> = {
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'tiff': 'image/tiff',
  
  // Videos
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'aac': 'audio/aac'
}