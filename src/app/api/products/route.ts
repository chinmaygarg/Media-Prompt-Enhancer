import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { productService } from '@/lib/storage'
import { Product } from '@/types'

// GET - List user's products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || undefined
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || undefined

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

    if (search) {
      // Use search functionality
      result = await productService.searchProducts(user.id, search, {
        category: category || undefined,
        limit
      })
    } else {
      // Regular listing
      result = await productService.getUserProducts(user.id, {
        category: category || undefined,
        includeInactive,
        limit,
        offset
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        products: result.data || [],
        total: result.data?.length || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve products' },
      { status: 500 }
    )
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
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
    
    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: 'Product name and category are required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['physical_product', 'software', 'service', 'brand']
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Create product data object
    const productData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      name: body.name,
      category: body.category,
      description: body.description || '',
      key_features: Array.isArray(body.key_features) ? body.key_features : [],
      target_audience: body.target_audience || '',
      price_point: body.price_point || undefined,
      brand_colors: Array.isArray(body.brand_colors) ? body.brand_colors : [],
      brand_voice: body.brand_voice || '',
      prohibited_contexts: Array.isArray(body.prohibited_contexts) ? body.prohibited_contexts : [],
      required_disclaimers: Array.isArray(body.required_disclaimers) ? body.required_disclaimers : [],
      preferred_models: Array.isArray(body.preferred_models) ? body.preferred_models : [],
      quality_tier: body.quality_tier || 'social',
      is_active: body.is_active !== undefined ? body.is_active : true
    }

    // Create the product
    const result = await productService.createProduct(user.id, productData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 })

  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}