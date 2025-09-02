import { NextRequest, NextResponse } from 'next/server'
import { 
  selectOptimalModel, 
  enhancePromptForModel, 
  enhancePromptWithText,
  calculateEstimatedCost,
  generateVideoSequence,
  formatForExport 
} from '@/lib/prompt-utils'
import { QuestionAnswers } from '@/types/context-questions'
import { logger } from '@/lib/logger'

interface MediaAsset {
  id: string
  filename: string
  file_type: 'image' | 'video' | 'audio'
  storage_path: string
  mime_type: string
  file_size_bytes: number
}

interface EnhancementConfig {
  outputType: 'text-to-image' | 'image-text-to-image' | 'text-to-video' | 'image-text-to-video' | 'text-to-video-audio' | 'image-text-to-video-audio'
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
  style: string
  duration?: number
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5'
  qualityTier: 'draft' | 'social' | 'production'
}

interface TextElement {
  id: string
  text: string
  type: 'overlay' | 'in-video'
  position?: { x: number; y: number; anchor: string }
  timing?: { startTime: number; endTime: number }
  context?: 'sign' | 'screen' | 'paper' | 'billboard' | 'book' | 'laptop' | 'phone'
  style?: any
}

interface EnhanceRequest {
  base_prompt: string
  media_assets?: MediaAsset[]
  text_elements?: TextElement[]
  config: EnhancementConfig
  context_answers?: QuestionAnswers
  session_id?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🚀 [Enhance API] POST request received')

    const body = await request.json() as EnhanceRequest
    const { base_prompt, media_assets = [], text_elements = [], config, context_answers, session_id } = body
    
    // Create sessionId after extracting session_id from request body
    const sessionId = session_id || `enhance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Log incoming request with detailed context answers analysis
    logger.logEnhance('INFO', 'request_received', {
      input: {
        base_prompt_length: base_prompt?.length || 0,
        media_assets_count: media_assets.length,
        text_elements_count: text_elements.length,
        config: config,
        context_answers_provided: !!context_answers,
        context_answers_count: context_answers ? Object.keys(context_answers).length : 0,
        context_answers_keys: context_answers ? Object.keys(context_answers) : [],
        has_session_id: !!session_id
      },
      sessionId,
      debug: {
        context_answers: context_answers,
        media_assets_details: media_assets.map(asset => ({
          id: asset.id,
          file_type: asset.file_type,
          has_description: !!(asset as any).description
        })),
        text_elements_details: text_elements.map(el => ({
          id: el.id,
          type: el.type,
          text_length: el.text?.length || 0
        }))
      }
    })

    // Validate required fields
    if (!base_prompt?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Base prompt is required' },
        { status: 400 }
      )
    }

    if (!config?.outputType) {
      return NextResponse.json(
        { success: false, error: 'Output type is required in config' },
        { status: 400 }
      )
    }

    console.log('📝 [Enhance API] Processing prompt enhancement', {
      promptLength: base_prompt.length,
      mediaCount: media_assets.length,
      textElementsCount: text_elements.length,
      outputType: config.outputType,
      platform: config.platform,
      hasContextAnswers: !!context_answers && Object.keys(context_answers).length > 0
    })

    // Step 1: Select optimal model based on requirements with smart compatibility checking
    const modelSelection = selectOptimalModel(config, media_assets, base_prompt)
    const selectedModel = modelSelection.model
    
    console.log('🤖 [Enhance API] Selected model:', selectedModel.name)
    
    // Log compatibility information
    if (modelSelection.selectionResult.compatibility) {
      console.log('📊 [Enhance API] Compatibility score:', modelSelection.selectionResult.compatibility.compatibility_score)
      console.log('🎯 [Enhance API] Selection reasoning:', modelSelection.selectionResult.reasoning)
    }
    
    // Log any compatibility warnings
    if (modelSelection.compatibilityWarnings.length > 0) {
      console.warn('⚠️ [Enhance API] Compatibility warnings:', modelSelection.compatibilityWarnings)
    }

    // Step 2: Enhance the prompt for the selected model (with text support and context)
    const promptResult = text_elements.length > 0 
      ? enhancePromptWithText(base_prompt, config, media_assets, selectedModel, text_elements, context_answers)
      : enhancePromptForModel(base_prompt, config, media_assets, selectedModel, context_answers)

    // Step 3: Calculate estimated cost
    const estimatedCost = calculateEstimatedCost(config, selectedModel)

    // Step 4: Generate video sequence if needed
    let shots = undefined
    if (selectedModel.type === 'video' || selectedModel.type === 'video-audio') {
      shots = generateVideoSequence(
        promptResult.primary_prompt,
        config,
        selectedModel
      )
    }

    // Step 5: Prepare the response with enhanced model information
    const enhancedResult = {
      primary_prompt: promptResult.primary_prompt,
      negative_prompt: promptResult.negative_prompt,
      model_selected: selectedModel.name,
      estimated_cost: estimatedCost,
      model_specific_params: promptResult.model_specific_params,
      ...(shots && { shots }),
      ...('text_instructions' in promptResult && { 
        text_instructions: promptResult.text_instructions,
        text_warnings: (promptResult as any).text_warnings
      }),
      ...('media_insights' in promptResult && { 
        media_insights: promptResult.media_insights
      }),
      ...('context_insights' in promptResult && { 
        context_insights: promptResult.context_insights
      }),
      // Add compatibility and selection information
      model_info: {
        compatibility_score: modelSelection.selectionResult.compatibility?.compatibility_score || 1.0,
        compatibility_warnings: modelSelection.compatibilityWarnings,
        selection_reasoning: modelSelection.selectionResult.reasoning || ['Model selected based on requirements'],
        alternatives: modelSelection.selectionResult.alternatives || {},
        estimated_generation_time: modelSelection.selectionResult.estimated_generation_time || selectedModel.maxDuration || 5
      }
    }

    const response = {
      success: true,
      data: enhancedResult,
      metadata: {
        session_id,
        processing_time: Date.now(),
        media_assets_used: media_assets.length,
        model_type: selectedModel.type,
        platform_optimized: config.platform
      }
    }

    // Log successful enhancement with comprehensive output details
    logger.logEnhance('INFO', 'enhancement_completed_successfully', {
      input: {
        base_prompt_length: base_prompt.length,
        config: config,
        context_answers_used: !!context_answers && Object.keys(context_answers).length > 0
      },
      output: {
        model_selected: enhancedResult.model_selected,
        estimated_cost: enhancedResult.estimated_cost,
        primary_prompt_length: enhancedResult.primary_prompt.length,
        negative_prompt_length: enhancedResult.negative_prompt?.length || 0,
        has_shots: !!enhancedResult.shots,
        shots_count: enhancedResult.shots?.length || 0,
        has_text_instructions: !!(enhancedResult as any).text_instructions,
        has_media_insights: !!(enhancedResult as any).media_insights,
        has_context_insights: !!(enhancedResult as any).context_insights,
        compatibility_score: enhancedResult.model_info?.compatibility_score,
        processing_time: Date.now() - startTime
      },
      sessionId,
      debug: {
        model_info: enhancedResult.model_info,
        context_insights: (enhancedResult as any).context_insights,
        media_insights: (enhancedResult as any).media_insights
      }
    })

    console.log('✅ [Enhance API] Enhancement completed successfully')
    return NextResponse.json(response)

  } catch (error) {
    const errorMessage = `Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    
    // Log the error with context
    logger.logEnhance('ERROR', 'enhancement_failed', {
      error: errorMessage,
      sessionId: sessionId,
      debug: {
        error_stack: error instanceof Error ? error.stack : undefined,
        processing_time: Date.now() - startTime,
        error_details: error
      }
    })
    
    console.error('❌ [Enhance API] Enhancement failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}