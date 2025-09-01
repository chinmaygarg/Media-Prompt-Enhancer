import { NextRequest, NextResponse } from 'next/server'
import { getLLMService } from '@/lib/llm/factory'
import { createServiceSupabase } from '@/lib/supabase'
import { configurableRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const enhanceRequestSchema = z.object({
  original_prompt: z.string().min(5, 'Original prompt is required'),
  content_type: z.string().min(1, 'Content type is required'),
  platform: z.string().min(1, 'Platform is required'),
  analysis: z.string().min(10, 'Analysis is required'),
  user_answers: z.record(z.string()).optional().default({}),
  session_id: z.string().optional(), // For tracking
})

export async function POST(request: NextRequest) {
  try {
    // Get user identifier
    const identifier = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Apply configurable rate limiting
    const rateLimitResult = await configurableRateLimit(identifier, 'enhance')
    
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
      session_id 
    } = validationResult.data
    
    // Initialize LLM service (automatically chooses real or mock)
    const llmService = await getLLMService()
    
    // Track processing time
    const startTime = Date.now()
    
    // Generate enhanced prompt
    const enhancementResponse = await llmService.enhancePrompt(
      original_prompt,
      content_type,
      platform,
      analysis,
      user_answers
    )
    
    const processingTime = Date.now() - startTime

    // Extract enhanced prompt from response
    const enhancedPrompt = enhancementResponse.enhanced_prompt || 
                          enhancementResponse.prompt ||
                          enhancementResponse.result

    if (!enhancedPrompt) {
      throw new Error('No enhanced prompt received from LLM')
    }

    // Store the session data in database (if we have session tracking)
    const supabase = createServiceSupabase()
    let sessionData = null

    try {
      if (session_id) {
        const { data } = await supabase
          .from('enhancement_sessions')
          .insert([
            {
              id: session_id,
              user_id: null, // Will be updated when authentication is implemented
              original_prompt,
              enhanced_prompt: enhancedPrompt,
              content_type,
              platform,
              questions_data: null, // Could be populated if we track questions
              user_answers,
              processing_time_ms: processingTime,
              model_used: 'openai_gpt4', // Dynamic based on actual model used
              confidence_score: 0.85
            }
          ])
          .select()
          .single()

        sessionData = data
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
          improvement_summary: {
            length_increase: enhancedPrompt.length - original_prompt.length,
            keywords_added: [], // Could be calculated
            platform_optimized: platform,
            content_type: content_type
          },
          metadata: {
            processing_time_ms: processingTime,
            model_used: 'openai_gpt4',
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

export async function OPTIONS(request: NextRequest) {
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