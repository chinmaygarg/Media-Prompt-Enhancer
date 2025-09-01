import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { storageClient, fileUploadService } from '@/lib/storage'

// GET - Serve media file with access control
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id
    const searchParams = request.nextUrl.searchParams
    const download = searchParams.get('download') === 'true'

    // Get authenticated user
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get media asset details
    const { data: asset } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .single()

    if (!asset) {
      return NextResponse.json(
        { error: 'Media asset not found or access denied' },
        { status: 404 }
      )
    }

    // Check if file has expired
    if (asset.expires_at && new Date(asset.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Media asset has expired' },
        { status: 410 }
      )
    }

    // Get signed URL for the file
    const { data: urlData, error: urlError } = await storageClient.getSignedUrl(
      asset.storage_bucket,
      asset.storage_path,
      3600, // 1 hour expiration
      user.id
    )

    if (urlError || !urlData) {
      return NextResponse.json(
        { error: 'Failed to generate file URL' },
        { status: 500 }
      )
    }

    // If download flag is set, redirect to signed URL
    if (download) {
      return NextResponse.redirect(urlData.signedUrl)
    }

    // Otherwise, return the signed URL as JSON
    return NextResponse.json({
      success: true,
      data: {
        id: asset.id,
        filename: asset.original_filename,
        file_type: asset.file_type,
        mime_type: asset.mime_type,
        size_bytes: asset.file_size_bytes,
        url: urlData.signedUrl,
        expires_in: 3600
      }
    })

  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve media asset' },
      { status: 500 }
    )
  }
}

// DELETE - Remove media asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id

    // Get authenticated user
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Delete using the upload service
    const deleteResult = await fileUploadService.deleteMediaAsset(mediaId, user.id)

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Media asset deleted successfully'
    })

  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media asset' },
      { status: 500 }
    )
  }
}