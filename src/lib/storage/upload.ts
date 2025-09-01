import { storageClient } from './client'
import { createServiceSupabase } from '../supabase'
import { 
  STORAGE_BUCKETS, 
  MIME_TYPE_MAP, 
  EXTENSION_TO_MIME,
  FileValidationResult,
  UploadProgress 
} from './types'
import { MediaAsset, UPLOAD_LIMITS } from '../../types'

export class FileUploadService {
  private supabase = createServiceSupabase()

  // Validate file before upload
  validateFile(file: File, subscriptionTier: string = 'free'): FileValidationResult {
    const limits = UPLOAD_LIMITS[subscriptionTier]
    const fileSizeMB = file.size / (1024 * 1024)

    // Check file size
    if (fileSizeMB > limits.max_size_mb) {
      return {
        valid: false,
        error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds limit of ${limits.max_size_mb}MB for ${subscriptionTier} tier`
      }
    }

    // Determine file type from MIME type
    let fileType = MIME_TYPE_MAP[file.type]
    
    // If MIME type detection fails, try file extension
    if (!fileType) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension && EXTENSION_TO_MIME[extension]) {
        const mimeType = EXTENSION_TO_MIME[extension]
        fileType = MIME_TYPE_MAP[mimeType]
      }
    }

    if (!fileType) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type || 'unknown'}`
      }
    }

    // Check if MIME type is allowed in user-uploads bucket
    const bucketConfig = STORAGE_BUCKETS['user-uploads']
    if (!bucketConfig.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      }
    }

    return {
      valid: true,
      fileType,
      mimeType: file.type,
      sizeBytes: file.size
    }
  }

  // Check user's storage quota
  async checkStorageQuota(userId: string, additionalFiles: File[]): Promise<{
    withinQuota: boolean
    error?: string
    quotaInfo?: {
      filesUsed: number
      maxFiles: number
      storageUsedMB: number
      maxStorageMB: number
      canUpload: number
    }
  }> {
    try {
      // Get user's subscription tier
      const { data: user } = await this.supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

      if (!user) {
        return { withinQuota: false, error: 'User not found' }
      }

      const limits = UPLOAD_LIMITS[user.subscription_tier]

      // Count current files
      const { count: currentFiles } = await this.supabase
        .from('media_assets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('expires_at', null) // Only count permanent files

      // Calculate current storage usage
      const { data: storageData } = await this.supabase
        .from('media_assets')
        .select('file_size_bytes')
        .eq('user_id', userId)
        .is('expires_at', null)

      const currentStorageMB = (storageData?.reduce((sum, asset) => sum + asset.file_size_bytes, 0) || 0) / (1024 * 1024)
      
      // Calculate additional storage needed
      const additionalStorageMB = additionalFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)
      
      const totalFiles = (currentFiles || 0) + additionalFiles.length
      const totalStorageMB = currentStorageMB + additionalStorageMB

      // Check quotas
      if (totalFiles > limits.max_files) {
        return {
          withinQuota: false,
          error: `Would exceed file limit (${totalFiles}/${limits.max_files})`
        }
      }

      if (totalStorageMB > limits.total_storage_mb) {
        return {
          withinQuota: false,
          error: `Would exceed storage limit (${totalStorageMB.toFixed(2)}MB/${limits.total_storage_mb}MB)`
        }
      }

      return {
        withinQuota: true,
        quotaInfo: {
          filesUsed: currentFiles || 0,
          maxFiles: limits.max_files,
          storageUsedMB: currentStorageMB,
          maxStorageMB: limits.total_storage_mb,
          canUpload: Math.min(
            limits.max_files - (currentFiles || 0),
            Math.floor((limits.total_storage_mb - currentStorageMB) / (additionalStorageMB / additionalFiles.length))
          )
        }
      }
    } catch (error) {
      return { 
        withinQuota: false, 
        error: `Failed to check quota: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  // Upload single file with progress tracking
  async uploadFile(
    file: File,
    userId: string,
    options?: {
      sessionId?: string
      temporary?: boolean
      expiresInHours?: number
      onProgress?: (progress: UploadProgress) => void
    }
  ): Promise<{
    success: boolean
    data?: MediaAsset
    error?: string
  }> {
    try {
      // Get user subscription tier for validation
      const { data: user } = await this.supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Validate file
      const validation = this.validateFile(file, user.subscription_tier)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Check quota
      const quotaCheck = await this.checkStorageQuota(userId, [file])
      if (!quotaCheck.withinQuota) {
        return { success: false, error: quotaCheck.error }
      }

      // Generate file path
      const storagePath = options?.temporary 
        ? storageClient.generateTempPath(options.sessionId || 'temp', file.name)
        : storageClient.generateFilePath(userId, validation.fileType!, file.name)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await storageClient.uploadFile(
        'user-uploads',
        storagePath,
        file,
        {
          contentType: validation.mimeType,
          metadata: {
            userId,
            sessionId: options?.sessionId,
            originalName: file.name
          }
        }
      )

      if (uploadError || !uploadData) {
        return { success: false, error: uploadError?.message || 'Upload failed' }
      }

      // Save metadata to database
      const expiresAt = options?.temporary && options?.expiresInHours
        ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000).toISOString()
        : undefined

      const { data: assetData, error: dbError } = await this.supabase
        .from('media_assets')
        .insert({
          user_id: userId,
          filename: storagePath.split('/').pop(),
          original_filename: file.name,
          file_type: validation.fileType,
          mime_type: validation.mimeType!,
          file_size_bytes: file.size,
          storage_path: storagePath,
          storage_bucket: 'user-uploads',
          upload_session_id: options?.sessionId,
          expires_at: expiresAt
        })
        .select()
        .single()

      if (dbError || !assetData) {
        // Cleanup uploaded file on database error
        await storageClient.deleteFile('user-uploads', storagePath, userId)
        return { success: false, error: dbError?.message || 'Database save failed' }
      }

      return {
        success: true,
        data: assetData as MediaAsset
      }

    } catch (error) {
      return {
        success: false,
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Upload multiple files
  async uploadFiles(
    files: File[],
    userId: string,
    options?: {
      sessionId?: string
      temporary?: boolean
      expiresInHours?: number
      onProgress?: (progress: UploadProgress) => void
      onFileComplete?: (file: File, result: MediaAsset | null, error?: string) => void
    }
  ): Promise<{
    success: boolean
    data?: {
      uploaded: MediaAsset[]
      failed: { file: File; error: string }[]
      totalSizeBytes: number
    }
    error?: string
  }> {
    try {
      // Check quota for all files
      const quotaCheck = await this.checkStorageQuota(userId, files)
      if (!quotaCheck.withinQuota) {
        return { success: false, error: quotaCheck.error }
      }

      const uploaded: MediaAsset[] = []
      const failed: { file: File; error: string }[] = []
      let totalSizeBytes = 0

      // Upload files concurrently (but respect subscription limits)
      const { data: user } = await this.supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

      const maxConcurrent = UPLOAD_LIMITS[user?.subscription_tier || 'free'].concurrent_uploads

      for (let i = 0; i < files.length; i += maxConcurrent) {
        const batch = files.slice(i, i + maxConcurrent)
        
        const batchPromises = batch.map(async (file) => {
          const result = await this.uploadFile(file, userId, {
            ...options,
            onProgress: (progress) => {
              options?.onProgress?.({
                ...progress,
                percentage: ((i + batch.indexOf(file)) / files.length) * 100
              })
            }
          })

          if (result.success && result.data) {
            uploaded.push(result.data)
            totalSizeBytes += file.size
            options?.onFileComplete?.(file, result.data)
          } else {
            failed.push({ file, error: result.error || 'Unknown error' })
            options?.onFileComplete?.(file, null, result.error)
          }
        })

        await Promise.all(batchPromises)
      }

      return {
        success: uploaded.length > 0,
        data: {
          uploaded,
          failed,
          totalSizeBytes
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Batch upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Delete media asset
  async deleteMediaAsset(assetId: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Get asset details
      const { data: asset } = await this.supabase
        .from('media_assets')
        .select('*')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single()

      if (!asset) {
        return { success: false, error: 'Asset not found or access denied' }
      }

      // Delete from storage
      const { error: storageError } = await storageClient.deleteFile(
        asset.storage_bucket,
        asset.storage_path,
        userId
      )

      if (storageError) {
        console.error('Storage deletion failed:', storageError)
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', userId)

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: `Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Cleanup expired temporary files (run as cron job)
  async cleanupExpiredFiles(): Promise<{
    success: boolean
    deletedCount: number
    error?: string
  }> {
    try {
      // Find expired files
      const { data: expiredAssets } = await this.supabase
        .from('media_assets')
        .select('*')
        .lt('expires_at', new Date().toISOString())

      if (!expiredAssets || expiredAssets.length === 0) {
        return { success: true, deletedCount: 0 }
      }

      let deletedCount = 0

      for (const asset of expiredAssets) {
        // Delete from storage
        await storageClient.deleteFile(
          asset.storage_bucket,
          asset.storage_path
        )

        // Delete from database
        await this.supabase
          .from('media_assets')
          .delete()
          .eq('id', asset.id)

        deletedCount++
      }

      return { success: true, deletedCount }

    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        error: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService()