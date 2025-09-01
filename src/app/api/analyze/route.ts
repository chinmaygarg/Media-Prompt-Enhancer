import { NextRequest, NextResponse } from 'next/server'
import { getLLMService } from '@/lib/llm/factory'
import { enhancementRequestSchema } from '@/lib/validation'
import { configurableRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Get user identifier (IP for now, later we'll use user ID)
    const identifier = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Apply configurable rate limiting
    const rateLimitResult = await configurableRateLimit(identifier, 'analyze')
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = enhancementRequestSchema.safeParse(body)
    
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

    const { original_prompt, content_type, platform } = validationResult.data
    
    // Initialize LLM service (automatically chooses real or mock)
    const llmService = await getLLMService()
    
    // Track processing time
    const startTime = Date.now()
    
    // Analyze the product/service
    const analysis = await llmService.analyzeProduct(
      original_prompt,
      content_type,
      platform
    )
    
    const processingTime = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        data: {
          analysis,
          metadata: {
            processing_time_ms: processingTime,
            model_used: 'openai_gpt4', // This would be dynamic based on which model was actually used
            confidence_score: 0.85, // This could be calculated based on the response quality
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
    console.error('Analysis API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error. Please try again later.' 
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