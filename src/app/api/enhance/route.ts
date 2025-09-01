import { NextRequest, NextResponse } from 'next/server'
import { getLLMService } from '@/lib/llm/factory'
import { createServerSupabase } from '@/lib/supabase'
import { configurableRateLimit } from '@/lib/rate-limit'
import { productService, consistencyObjectService, storageClient } from '@/lib/storage'
import { z } from 'zod'

// Enhanced request schema supporting multimodal inputs
const enhanceRequestSchema = z.object({
  original_prompt: z.string().min(5, 'Original prompt is required'),
  content_type: z.enum([
    'text_to_image', 
    'image_text_to_image', 
    'text_to_video', 
    'image_text_to_video', 
    'text_to_video_audio', 
    'image_text_to_video_audio'
  ]),
  platform: z.string().min(1, 'Platform is required'),
  analysis: z.string().min(10, 'Analysis is required').optional(),
  user_answers: z.record(z.string()).optional().default({}),
  session_id: z.string().optional(),
  
  // Multimodal inputs
  reference_images: z.array(z.string()).optional(),
  reference_video: z.string().optional(), 
  audio_style_reference: z.string().optional(),
  
  // Product/consistency references
  product_id: z.string().optional(),
  consistency_object_ids: z.array(z.string()).optional(),
  
  context: z.object({
    industry: z.string().optional(),
    target_audience: z.string().optional(),
    brand_voice: z.string().optional(),
    style_preferences: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Apply configurable rate limiting
    const rateLimitResult = await configurableRateLimit(user.id, 'enhance')
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = enhanceRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request format',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { 
      original_prompt, 
      content_type, 
      platform, 
      analysis, 
      user_answers,
      session_id,
      reference_images,
      reference_video,
      audio_style_reference,
      product_id,
      consistency_object_ids,
      context
    } = validationResult.data
    
    // Collect multimodal context
    let enhancementContext = {
      original_prompt,
      content_type,
      platform,
      analysis: analysis || '',
      user_answers,
      context: context || {}
    }

    // Process product information
    if (product_id) {
      const productResult = await productService.getProduct(product_id, user.id)
      if (productResult.success && productResult.data) {
        enhancementContext.context.product = {
          name: productResult.data.name,
          category: productResult.data.category,
          description: productResult.data.description,
          key_features: productResult.data.key_features,
          brand_voice: productResult.data.brand_voice,
          brand_colors: productResult.data.brand_colors,
          quality_tier: productResult.data.quality_tier
        }
      }
    }

    // Process consistency objects (character cards, scenes, styles)
    if (consistency_object_ids && consistency_object_ids.length > 0) {
      const consistencyResult = await consistencyObjectService.generateConsistencyPrompt(
        consistency_object_ids, 
        user.id
      )
      
      if (consistencyResult.success && consistencyResult.data) {
        enhancementContext.context.consistency_prompt = consistencyResult.data.prompt
        enhancementContext.context.consistency_objects = consistencyResult.data.objects
      }
    }

    // Process reference media (get signed URLs for LLM access)
    const mediaReferences = []
    
    if (reference_images && reference_images.length > 0) {
      for (const imageId of reference_images) {
        const { data: urlData } = await storageClient.getSignedUrl(
          'user-uploads',
          imageId, // Assuming this is the storage path, could be asset ID
          3600,
          user.id
        )
        if (urlData) {
          mediaReferences.push({
            type: 'image',
            url: urlData.signedUrl
          })
        }
      }
    }

    if (reference_video) {
      const { data: urlData } = await storageClient.getSignedUrl(
        'user-uploads',
        reference_video,
        3600,
        user.id
      )
      if (urlData) {
        mediaReferences.push({
          type: 'video', 
          url: urlData.signedUrl
        })
      }
    }

    if (audio_style_reference) {
      const { data: urlData } = await storageClient.getSignedUrl(
        'user-uploads',
        audio_style_reference,
        3600,
        user.id
      )
      if (urlData) {
        mediaReferences.push({
          type: 'audio',
          url: urlData.signedUrl
        })
      }
    }

    enhancementContext.context.media_references = mediaReferences

    // Initialize LLM service
    const llmService = await getLLMService()
    
    // Track processing time
    const startTime = Date.now()
    
    // Generate enhanced prompt with multimodal context
    const enhancementResponse = await llmService.enhancePrompt(
      original_prompt,
      content_type,
      platform,
      analysis || `Multimodal ${content_type} content for ${platform}`,
      user_answers,
      enhancementContext // Pass the enriched context
    )
    
    const processingTime = Date.now() - startTime

    // Extract enhanced prompt from response
    const enhancedPrompt = enhancementResponse.enhanced_prompt || 
                          enhancementResponse.prompt ||
                          enhancementResponse.result

    if (!enhancedPrompt) {
      throw new Error('No enhanced prompt received from LLM')
    }

    // Store the enhanced session data in database
    let sessionData = null

    try {
      if (session_id) {
        const { data } = await supabase
          .from('enhancement_sessions')
          .insert([
            {
              id: session_id,
              user_id: user.id,
              original_prompt,
              enhanced_prompt: enhancedPrompt,
              content_type,
              platform,
              questions_data: null,
              user_answers,
              processing_time_ms: processingTime,
              model_used: 'multimodal_enhanced',
              confidence_score: 0.85
            }
          ])
          .select()
          .single()

        sessionData = data

        // Link media assets to the session if any were provided
        if (reference_images || reference_video || audio_style_reference) {
          const mediaAssetIds = [
            ...(reference_images || []),
            ...(reference_video ? [reference_video] : []),
            ...(audio_style_reference ? [audio_style_reference] : [])
          ]

          if (mediaAssetIds.length > 0) {
            const sessionAssets = mediaAssetIds.map(assetId => ({
              session_id,
              media_asset_id: assetId,
              asset_role: reference_images?.includes(assetId) ? 'reference_image' :
                         reference_video === assetId ? 'reference_video' : 'audio_style'
            }))

            await supabase
              .from('session_assets')
              .upsert(sessionAssets, { 
                onConflict: 'session_id,media_asset_id',
                ignoreDuplicates: false 
              })
          }
        }
      }
    } catch (dbError) {
      console.error('Failed to save session data:', dbError)
      // Continue processing - don't fail the request for database issues
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          enhanced_prompt: enhancedPrompt,
          original_prompt,
          content_type,
          platform,
          multimodal_context: {
            has_reference_images: !!(reference_images && reference_images.length > 0),
            has_reference_video: !!reference_video,
            has_audio_reference: !!audio_style_reference,
            has_product_context: !!product_id,
            has_consistency_objects: !!(consistency_object_ids && consistency_object_ids.length > 0),
            media_references_count: mediaReferences.length
          },
          improvement_summary: {
            length_increase: enhancedPrompt.length - original_prompt.length,
            multimodal_features: mediaReferences.length,
            platform_optimized: platform,
            content_type: content_type
          },
          metadata: {
            processing_time_ms: processingTime,
            model_used: 'multimodal_enhanced',
            confidence_score: 0.85,
            session_id: sessionData?.id || session_id,
            timestamp: new Date().toISOString()
          }
        }
      },
      { 
        status: 200,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
        }
      }
    )

  } catch (error) {
    console.error('Enhancement API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to enhance prompt. Please try again.' 
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}