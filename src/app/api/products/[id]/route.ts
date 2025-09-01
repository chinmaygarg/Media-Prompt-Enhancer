import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { productService } from '@/lib/storage'

// GET - Get single product with assets
export async function GET(
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

    const result = await productService.getProduct(productId, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve product' },
      { status: 500 }
    )
  }
}

// PUT - Update product
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

    // Remove fields that shouldn't be updated
    const { id, user_id, created_at, updated_at, ...updates } = body

    // Validate category if provided
    if (updates.category) {
      const validCategories = ['physical_product', 'software', 'service', 'brand']
      if (!validCategories.includes(updates.category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate price_point if provided
    if (updates.price_point) {
      const validPricePoints = ['budget', 'mid-range', 'premium', 'luxury']
      if (!validPricePoints.includes(updates.price_point)) {
        return NextResponse.json(
          { error: `Invalid price_point. Must be one of: ${validPricePoints.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate quality_tier if provided
    if (updates.quality_tier) {
      const validQualityTiers = ['production', 'social', 'draft']
      if (!validQualityTiers.includes(updates.quality_tier)) {
        return NextResponse.json(
          { error: `Invalid quality_tier. Must be one of: ${validQualityTiers.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const result = await productService.updateProduct(productId, user.id, updates)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Product PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    const searchParams = request.nextUrl.searchParams
    const permanent = searchParams.get('permanent') === 'true'

    // Get authenticated user
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let result
    if (permanent) {
      result = await productService.permanentDeleteProduct(productId, user.id)
    } else {
      result = await productService.deleteProduct(productId, user.id)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Product permanently deleted' : 'Product deleted'
    })

  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}