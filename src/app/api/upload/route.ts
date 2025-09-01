import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { fileUploadService } from '@/lib/storage'
import { FileUploadResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    
    // Extract files and options
    const files: File[] = []
    const fileEntries = formData.getAll('files') as File[]
    const sessionId = formData.get('session_id') as string || undefined
    const temporary = formData.get('temporary') === 'true'
    const expiresInHours = parseInt(formData.get('expires_in_hours') as string || '24')

    // Validate that files were provided
    if (!fileEntries || fileEntries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Convert FormData files to File array
    for (const fileEntry of fileEntries) {
      if (fileEntry instanceof File && fileEntry.size > 0) {
        files.push(fileEntry)
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid files found' },
        { status: 400 }
      )
    }

    // Upload files using the upload service
    const uploadResult = await fileUploadService.uploadFiles(
      files,
      user.id,
      {
        sessionId,
        temporary,
        expiresInHours: temporary ? expiresInHours : undefined,
        onFileComplete: (file, result, error) => {
          // Could log upload progress here
          console.log(`File ${file.name}: ${result ? 'success' : 'failed'}`, error)
        }
      }
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      )
    }

    // Get user's current quota status
    const { data: user_data } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const quotaCheck = await fileUploadService.checkStorageQuota(user.id, [])

    const response: FileUploadResponse = {
      success: true,
      data: {
        uploaded_assets: uploadResult.data!.uploaded,
        total_size_bytes: uploadResult.data!.totalSizeBytes,
        quota_remaining: quotaCheck.quotaInfo ? {
          files: quotaCheck.quotaInfo.canUpload,
          storage_mb: Math.max(0, quotaCheck.quotaInfo.maxStorageMB - quotaCheck.quotaInfo.storageUsedMB)
        } : { files: 0, storage_mb: 0 }
      }
    }

    // Include failed uploads in response if any
    if (uploadResult.data!.failed.length > 0) {
      console.warn('Some files failed to upload:', uploadResult.data!.failed)
      // Could include failed files in response for client handling
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}