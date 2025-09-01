import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { consistencyObjectService } from '@/lib/storage'
import { ConsistencyObject } from '@/types'

// GET - List user's consistency objects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as 'character' | 'scene' | 'style' | null
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
      result = await consistencyObjectService.searchConsistencyObjects(user.id, search, {
        type: type || undefined,
        limit
      })
    } else {
      // Regular listing
      result = await consistencyObjectService.getUserConsistencyObjects(user.id, {
        type: type || undefined,
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
        consistency_objects: result.data || [],
        total: result.data?.length || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Consistency objects GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve consistency objects' },
      { status: 500 }
    )
  }
}

// POST - Create new consistency object
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
    if (!body.name || !body.object_type || !body.description) {
      return NextResponse.json(
        { error: 'name, object_type, and description are required' },
        { status: 400 }
      )
    }

    // Validate object_type
    const validTypes = ['character', 'scene', 'style']
    if (!validTypes.includes(body.object_type)) {
      return NextResponse.json(
        { error: `Invalid object_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Handle special character card creation
    if (body.object_type === 'character' && body.character_data) {
      const characterData = {
        name: body.name,
        description: body.description,
        appearance: Array.isArray(body.character_data.appearance) ? body.character_data.appearance : [],
        personality: body.character_data.personality || '',
        background: body.character_data.background || '',
        referenceImages: Array.isArray(body.character_data.reference_images) ? body.character_data.reference_images : []
      }

      const result = await consistencyObjectService.createCharacterCard(user.id, characterData)

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
    }

    // Create standard consistency object
    const objectData: Omit<ConsistencyObject, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      name: body.name,
      object_type: body.object_type,
      description: body.description,
      locked_attributes: Array.isArray(body.locked_attributes) ? body.locked_attributes : [],
      style_notes: body.style_notes || '',
      reference_prompt: body.reference_prompt || '',
      is_active: body.is_active !== undefined ? body.is_active : true
    }

    const result = await consistencyObjectService.createConsistencyObject(user.id, objectData)

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
    console.error('Consistency objects POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create consistency object' },
      { status: 500 }
    )
  }
}