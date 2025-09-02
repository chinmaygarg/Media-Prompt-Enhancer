import { NextRequest, NextResponse } from 'next/server'
import { localFileService } from '@/lib/storage/local'
import { FileUploadResponse, MediaAsset } from '@/types'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Upload API] POST request received')

    // Parse multipart form data
    console.log('📦 [Upload API] Parsing form data...')
    const formData = await request.formData()
    
    // Extract files and options
    const files: File[] = []
    const fileEntries = formData.getAll('files') as File[]
    console.log('📁 [Upload API] File entries found:', fileEntries.length)
    
    const sessionId = formData.get('session_id') as string || undefined

    console.log('⚙️ [Upload API] Upload options:', { sessionId })

    // Validate that files were provided
    if (!fileEntries || fileEntries.length === 0) {
      console.log('❌ [Upload API] No files provided in request')
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

    // Upload files using local storage
    const uploaded = []
    const failed = []
    let totalSizeBytes = 0

    for (const file of files) {
      try {
        const uploadResult = await localFileService.uploadFile(
          file,
          sessionId
        )

        if (uploadResult.success && uploadResult.data) {
          // Convert local upload result to MediaAsset format
          const mediaAsset: MediaAsset = {
            id: uploadResult.data.id,
            user_id: 'local',
            filename: uploadResult.data.filename,
            original_filename: uploadResult.data.originalFilename,
            file_type: uploadResult.data.fileType as 'image' | 'video' | 'audio',
            mime_type: uploadResult.data.mimeType,
            file_size_bytes: uploadResult.data.size,
            storage_path: uploadResult.data.url,
            storage_bucket: 'local',
            upload_session_id: sessionId,
            created_at: new Date().toISOString(),
          }
          uploaded.push(mediaAsset)
          totalSizeBytes += file.size
          console.log(`File ${file.name}: success`)
        } else {
          failed.push({ file: file.name, error: uploadResult.error || 'Unknown error' })
          console.log(`File ${file.name}: failed`, uploadResult.error)
        }
      } catch (error) {
        failed.push({ file: file.name, error: error instanceof Error ? error.message : 'Unknown error' })
        console.log(`File ${file.name}: failed`, error)
      }
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All files failed to upload', failed_uploads: failed },
        { status: 400 }
      )
    }

    const response: FileUploadResponse = {
      success: true,
      data: {
        uploaded_assets: uploaded,
        total_size_bytes: totalSizeBytes,
        quota_remaining: { files: 999, storage_mb: 999 } // Unlimited for development
      }
    }

    // Include failed uploads in response if any
    if (failed.length > 0) {
      console.warn('Some files failed to upload:', failed)
    }

    console.log('✅ [Upload API] Upload completed successfully')
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