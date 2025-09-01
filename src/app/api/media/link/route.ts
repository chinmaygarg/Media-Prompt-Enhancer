import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// POST - Link media assets to enhancement sessions
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
    const { session_id, media_asset_ids, asset_roles } = body

    // Validate required fields
    if (!session_id || !media_asset_ids || !Array.isArray(media_asset_ids)) {
      return NextResponse.json(
        { error: 'session_id and media_asset_ids array are required' },
        { status: 400 }
      )
    }

    // Verify session ownership
    const { data: session } = await supabase
      .from('enhancement_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json(
        { error: 'Enhancement session not found or access denied' },
        { status: 404 }
      )
    }

    // Verify all media assets belong to user
    const { data: assets } = await supabase
      .from('media_assets')
      .select('id, file_type')
      .in('id', media_asset_ids)
      .eq('user_id', user.id)

    if (!assets || assets.length !== media_asset_ids.length) {
      return NextResponse.json(
        { error: 'Some media assets not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare session asset links
    const sessionAssets = media_asset_ids.map((assetId: string, index: number) => {
      const asset = assets.find(a => a.id === assetId)
      let assetRole = 'reference_image' // default

      // Auto-determine role from file type if not specified
      if (asset) {
        if (asset.file_type === 'video') {
          assetRole = 'reference_video'
        } else if (asset.file_type === 'audio') {
          assetRole = 'audio_style'
        }
      }

      // Override with provided role if specified
      if (asset_roles && asset_roles[index]) {
        assetRole = asset_roles[index]
      }

      return {
        session_id,
        media_asset_id: assetId,
        asset_role: assetRole
      }
    })

    // Create the links (upsert to handle duplicates)
    const { data: linkedAssets, error: linkError } = await supabase
      .from('session_assets')
      .upsert(sessionAssets, { 
        onConflict: 'session_id,media_asset_id',
        ignoreDuplicates: false 
      })
      .select()

    if (linkError) {
      return NextResponse.json(
        { error: `Failed to link assets: ${linkError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        linked_assets: linkedAssets,
        session_id,
        total_linked: linkedAssets?.length || 0
      }
    })

  } catch (error) {
    console.error('Media link error:', error)
    return NextResponse.json(
      { error: 'Failed to link media assets' },
      { status: 500 }
    )
  }
}

// GET - Get media assets linked to a session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
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

    // Verify session ownership
    const { data: session } = await supabase
      .from('enhancement_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json(
        { error: 'Enhancement session not found or access denied' },
        { status: 404 }
      )
    }

    // Get linked assets
    const { data: sessionAssets, error } = await supabase
      .from('session_assets')
      .select(`
        *,
        media_asset:media_assets(*)
      `)
      .eq('session_id', sessionId)
      .order('created_at')

    if (error) {
      return NextResponse.json(
        { error: `Failed to get linked assets: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id: sessionId,
        linked_assets: sessionAssets || []
      }
    })

  } catch (error) {
    console.error('Media link GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve linked media assets' },
      { status: 500 }
    )
  }
}