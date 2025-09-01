import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { productService } from '@/lib/storage'

// POST - Add asset to product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

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
    const { media_asset_id, asset_type, display_order } = body

    // Validate required fields
    if (!media_asset_id || !asset_type) {
      return NextResponse.json(
        { error: 'media_asset_id and asset_type are required' },
        { status: 400 }
      )
    }

    // Validate asset_type
    const validAssetTypes = ['reference_image', 'logo', 'brand_asset']
    if (!validAssetTypes.includes(asset_type)) {
      return NextResponse.json(
        { error: `Invalid asset_type. Must be one of: ${validAssetTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await productService.addAssetToProduct(
      productId,
      media_asset_id,
      user.id,
      asset_type,
      display_order
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
    console.error('Product asset POST error:', error)
    return NextResponse.json(
      { error: 'Failed to add asset to product' },
      { status: 500 }
    )
  }
}

// DELETE - Remove asset from product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
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

    const result = await productService.removeAssetFromProduct(
      productId,
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
      message: 'Asset removed from product'
    })

  } catch (error) {
    console.error('Product asset DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove asset from product' },
      { status: 500 }
    )
  }
}

// PUT - Reorder product assets
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

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
    const { asset_orders } = body

    // Validate asset_orders format
    if (!Array.isArray(asset_orders)) {
      return NextResponse.json(
        { error: 'asset_orders must be an array' },
        { status: 400 }
      )
    }

    // Validate each asset order item
    for (const item of asset_orders) {
      if (!item.mediaAssetId || typeof item.displayOrder !== 'number') {
        return NextResponse.json(
          { error: 'Each asset order must have mediaAssetId and displayOrder' },
          { status: 400 }
        )
      }
    }

    const result = await productService.reorderAssets(productId, user.id, asset_orders)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product assets reordered successfully'
    })

  } catch (error) {
    console.error('Product asset PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to reorder product assets' },
      { status: 500 }
    )
  }
}