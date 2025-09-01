import { createClient } from '@supabase/supabase-js'
import { createClientSupabase, createServiceSupabase } from '../supabase'

export class StorageClient {
  private supabase = createClientSupabase()
  private serviceSupabase = createServiceSupabase()

  // Get file from storage with proper access control
  async getFile(bucket: string, path: string, userId?: string): Promise<{
    data: Blob | null
    error: Error | null
  }> {
    try {
      // For private buckets, verify user access
      if (bucket === 'user-uploads' && userId) {
        if (!path.startsWith(`${userId}/`)) {
          return { data: null, error: new Error('Access denied') }
        }
      }

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path)

      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get public URL for file (for system bucket)
  getPublicUrl(bucket: string, path: string): {
    data: { publicUrl: string }
  } {
    return this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)
  }

  // Get signed URL for private files with expiration
  async getSignedUrl(
    bucket: string, 
    path: string, 
    expiresIn: number = 3600, // 1 hour default
    userId?: string
  ): Promise<{
    data: { signedUrl: string } | null
    error: Error | null
  }> {
    try {
      // Verify user access for private buckets
      if (bucket === 'user-uploads' && userId) {
        if (!path.startsWith(`${userId}/`)) {
          return { data: null, error: new Error('Access denied') }
        }
      }

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Upload file to storage
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: {
      contentType?: string
      metadata?: Record<string, any>
      upsert?: boolean
    }
  ): Promise<{
    data: { path: string } | null
    error: Error | null
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: options?.contentType,
          metadata: options?.metadata,
          upsert: options?.upsert || false
        })

      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Delete file from storage
  async deleteFile(
    bucket: string, 
    paths: string | string[],
    userId?: string
  ): Promise<{
    data: { message: string } | null
    error: Error | null
  }> {
    try {
      const pathArray = Array.isArray(paths) ? paths : [paths]

      // Verify user access for private buckets
      if (bucket === 'user-uploads' && userId) {
        for (const path of pathArray) {
          if (!path.startsWith(`${userId}/`)) {
            return { data: null, error: new Error('Access denied') }
          }
        }
      }

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .remove(pathArray)

      return { 
        data: data ? { message: 'Files deleted successfully' } : null, 
        error 
      }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // List files in a directory
  async listFiles(
    bucket: string, 
    folder?: string,
    options?: {
      limit?: number
      offset?: number
      sortBy?: { column: string; order: 'asc' | 'desc' }
    }
  ): Promise<{
    data: any[] | null
    error: Error | null
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder, {
          limit: options?.limit,
          offset: options?.offset,
          sortBy: options?.sortBy
        })

      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Create bucket (admin function)
  async createBucket(
    bucketId: string,
    options?: {
      public?: boolean
      allowedMimeTypes?: string[]
      fileSizeLimit?: number
    }
  ): Promise<{
    data: { name: string } | null
    error: Error | null
  }> {
    try {
      const { data, error } = await this.serviceSupabase.storage
        .createBucket(bucketId, {
          public: options?.public || false,
          allowedMimeTypes: options?.allowedMimeTypes,
          fileSizeLimit: options?.fileSizeLimit
        })

      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Generate unique file path
  generateFilePath(userId: string, fileType: 'image' | 'video' | 'audio', filename: string): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    const typeFolder = fileType === 'image' ? 'reference-images' 
                    : fileType === 'video' ? 'reference-videos' 
                    : 'audio-styles'

    return `${userId}/${typeFolder}/${timestamp}_${randomId}_${sanitizedFilename}`
  }

  // Generate temporary upload path
  generateTempPath(uploadSessionId: string, filename: string): string {
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `temp/${uploadSessionId}/${sanitizedFilename}`
  }
}

// Export singleton instance
export const storageClient = new StorageClient()