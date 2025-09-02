// Core types for the prompt enhancement service

// Storage and Media Types  
export interface MediaAsset {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_type: 'image' | 'video' | 'audio'
  mime_type: string
  file_size_bytes: number
  storage_path: string
  storage_bucket: string
  upload_session_id?: string
  created_at: string
  expires_at?: string
}

// File upload types
export interface FileUploadResponse {
  success: boolean
  data?: {
    uploaded_assets: MediaAsset[]
    total_size_bytes: number
    quota_remaining: {
      files: number
      storage_mb: number
    }
  }
  error?: string
}