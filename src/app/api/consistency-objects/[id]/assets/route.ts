import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { consistencyObjectService } from '@/lib/storage'

// POST - Add asset to consistency object
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const objectId = params.id

    // Get authenticated user
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { media_asset_id } = body

    // Validate required fields
    if (!media_asset_id) {
      return NextResponse.json(
        { error: 'media_asset_id is required' },
        { status: 400 }
      )
    }

    const result = await consistencyObjectService.addAssetToConsistencyObject(
      objectId,
      media_asset_id,
      user.id
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 })

  } catch (error) {
    console.error('Consistency object asset POST error:', error)
    return NextResponse.json(
      { error: 'Failed to add asset to consistency object' },
      { status: 500 }
    )
  }
}

// DELETE - Remove asset from consistency object
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const objectId = params.id
    const searchParams = request.nextUrl.searchParams
    const mediaAssetId = searchParams.get('media_asset_id')

    if (!mediaAssetId) {
      return NextResponse.json(
        { error: 'media_asset_id parameter is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const result = await consistencyObjectService.removeAssetFromConsistencyObject(
      objectId,
      mediaAssetId,
      user.id
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Asset removed from consistency object'
    })

  } catch (error) {
    console.error('Consistency object asset DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove asset from consistency object' },
      { status: 500 }
    )
  }
}