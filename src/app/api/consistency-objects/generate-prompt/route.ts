import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { consistencyObjectService } from '@/lib/storage'

// POST - Generate consistency prompt for enhancement
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
    const { object_ids } = body

    // Validate required fields
    if (!object_ids || !Array.isArray(object_ids) || object_ids.length === 0) {
      return NextResponse.json(
        { error: 'object_ids array is required and must not be empty' },
        { status: 400 }
      )
    }

    const result = await consistencyObjectService.generateConsistencyPrompt(object_ids, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Generate consistency prompt error:', error)
    return NextResponse.json(
      { error: 'Failed to generate consistency prompt' },
      { status: 500 }
    )
  }
}