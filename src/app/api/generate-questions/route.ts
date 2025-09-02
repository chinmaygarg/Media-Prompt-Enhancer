import { NextRequest, NextResponse } from 'next/server'
import { QuestionGenerator } from '@/lib/question-generator'
import { LLMQuestionGenerator } from '@/lib/llm-question-generator'
import { QuestionGenerationRequest, QuestionGenerationResponse } from '@/types/context-questions'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const sessionId = `generate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const body: QuestionGenerationRequest = await request.json()
    
    // Log incoming request
    logger.logGenerateQuestions('INFO', 'request_received', {
      input: {
        base_prompt_length: body.base_prompt?.length || 0,
        config: body.config,
        media_assets_count: body.media_assets?.length || 0,
        text_elements_count: body.text_elements?.length || 0,
        selected_model: body.selected_model,
        has_session_id: !!body.session_id
      },
      sessionId,
      debug: {
        request_headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString()
      }
    })
    
    // Validate required fields
    if (!body.base_prompt || !body.config) {
      const error = 'Missing required fields: base_prompt and config are required'
      logger.logGenerateQuestions('ERROR', 'validation_failed', {
        input: body,
        error,
        sessionId
      })
      return NextResponse.json({
        success: false,
        error
      } as QuestionGenerationResponse, { status: 400 })
    }

    // Validate config object - allow empty strings for style
    const { outputType, platform, style, aspectRatio, qualityTier } = body.config
    if (!outputType || !platform || style === undefined || style === null || !aspectRatio || !qualityTier) {
      const error = 'Missing required config fields'
      logger.logGenerateQuestions('ERROR', 'config_validation_failed', {
        input: { 
          config: body.config, 
          missing_fields: { 
            outputType: !outputType, 
            platform: !platform, 
            style: style === undefined || style === null, 
            aspectRatio: !aspectRatio, 
            qualityTier: !qualityTier 
          } 
        },
        error,
        sessionId
      })
      return NextResponse.json({
        success: false,
        error
      } as QuestionGenerationResponse, { status: 400 })
    }

    // Log question generation start
    logger.logGenerateQuestions('DEBUG', 'question_generation_start', {
      input: {
        base_prompt: body.base_prompt,
        config: body.config,
        media_assets: body.media_assets,
        text_elements: body.text_elements
      },
      sessionId
    })

    // Check if LLM generation is requested via header or use smart generation
    const useLLM = request.headers.get('X-Use-LLM') === 'true' || 
                   request.headers.get('X-Generation-Method') === 'llm'
    
    let result: any
    let generationMethod: string
    
    if (useLLM) {
      // Use LLM-powered generation
      console.log(`🧠 [Generate Questions API] ${sessionId} - Using LLM-powered question generation`)
      const llmGenerator = new LLMQuestionGenerator()
      const llmResult = await llmGenerator.generateQuestions(body)
      
      result = {
        questions: llmResult.questions,
        reasoning: llmResult.reasoning,
        estimated_improvement: llmResult.estimated_improvement
      }
      generationMethod = llmResult.generation_method
      
      console.log(`✅ [Generate Questions API] ${sessionId} - LLM generation completed:`, {
        method: generationMethod,
        confidence_score: llmResult.confidence_score,
        questions_count: llmResult.questions.length
      })
    } else {
      // Use smart hybrid generation (recommended)
      console.log(`🤖 [Generate Questions API] ${sessionId} - Using smart hybrid question generation`)
      const smartResult = await LLMQuestionGenerator.generateSmartQuestions(body)
      
      result = {
        questions: smartResult.questions,
        reasoning: smartResult.reasoning,
        estimated_improvement: smartResult.estimated_improvement
      }
      generationMethod = smartResult.generation_method
      
      console.log(`✅ [Generate Questions API] ${sessionId} - Smart generation completed:`, {
        method: generationMethod,
        confidence_score: smartResult.confidence_score,
        questions_count: smartResult.questions.length
      })
    }
    
    const processingTime = Date.now() - startTime

    // Log successful generation
    logger.logGenerateQuestions('INFO', 'questions_generated_successfully', {
      input: {
        base_prompt_length: body.base_prompt.length,
        config: body.config
      },
      output: {
        questions_count: result.questions.length,
        question_categories: result.questions.map(q => q.category),
        reasoning_count: result.reasoning.length,
        estimated_improvement: result.estimated_improvement,
        processing_time: processingTime,
        generation_method: generationMethod
      },
      sessionId,
      debug: {
        questions: result.questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options_count: q.options.length,
          category: q.category,
          importance: q.importance
        }))
      }
    })

    const response = {
      success: true,
      data: {
        questions: result.questions,
        reasoning: result.reasoning,
        estimated_improvement: result.estimated_improvement,
        processing_time: processingTime,
        generation_method: generationMethod
      }
    } as QuestionGenerationResponse

    return NextResponse.json(response)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    // Log the error
    logger.logGenerateQuestions('ERROR', 'question_generation_failed', {
      error: errorMessage,
      sessionId,
      debug: {
        error_stack: error instanceof Error ? error.stack : undefined,
        processing_time: Date.now() - startTime
      }
    })
    
    console.error('Question generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    } as QuestionGenerationResponse, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to generate questions.'
  }, { status: 405 })
}