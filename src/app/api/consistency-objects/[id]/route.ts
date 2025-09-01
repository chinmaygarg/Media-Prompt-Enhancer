import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { consistencyObjectService } from '@/lib/storage'

// GET - Get single consistency object with assets
export async function GET(
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

    const result = await consistencyObjectService.getConsistencyObject(objectId, user.id)

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
    console.error('Consistency object GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve consistency object' },
      { status: 500 }
    )
  }
}

// PUT - Update consistency object
export async function PUT(
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

    // Remove fields that shouldn't be updated
    const { id, user_id, created_at, updated_at, ...updates } = body

    // Validate object_type if provided
    if (updates.object_type) {
      const validTypes = ['character', 'scene', 'style']
      if (!validTypes.includes(updates.object_type)) {
        return NextResponse.json(
          { error: `Invalid object_type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const result = await consistencyObjectService.updateConsistencyObject(objectId, user.id, updates)

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
    console.error('Consistency object PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update consistency object' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete consistency object
export async function DELETE(
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

    const result = await consistencyObjectService.deleteConsistencyObject(objectId, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Consistency object deleted'
    })

  } catch (error) {
    console.error('Consistency object DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete consistency object' },
      { status: 500 }
    )
  }
}