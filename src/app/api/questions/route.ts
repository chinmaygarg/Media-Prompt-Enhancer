import { NextRequest, NextResponse } from 'next/server'
import { getLLMService } from '@/lib/llm/factory'
import { configurableRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const questionsRequestSchema = z.object({
  analysis: z.string().min(10, 'Analysis is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Get user identifier
    const identifier = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Apply configurable rate limiting
    const rateLimitResult = await configurableRateLimit(identifier, 'questions')
    
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
    const validationResult = questionsRequestSchema.safeParse(body)
    
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

    const { analysis } = validationResult.data
    
    // Initialize LLM service (automatically chooses real or mock)
    const llmService = await getLLMService()
    
    // Track processing time
    const startTime = Date.now()
    
    // Generate intelligent questions
    const questionsResponse = await llmService.generateQuestions(analysis)
    
    const processingTime = Date.now() - startTime

    // Validate that we got an array of questions
    if (!questionsResponse.questions || !Array.isArray(questionsResponse.questions)) {
      throw new Error('Invalid questions format from LLM')
    }

    // Limit to maximum 5 questions
    const questions = questionsResponse.questions.slice(0, 5)

    return NextResponse.json(
      {
        success: true,
        data: {
          questions,
          metadata: {
            processing_time_ms: processingTime,
            total_questions: questions.length,
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
    console.error('Questions API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate questions. Please try again.' 
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