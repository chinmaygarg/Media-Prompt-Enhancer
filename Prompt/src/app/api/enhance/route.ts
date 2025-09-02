import { NextRequest, NextResponse } from 'next/server'
import { 
  selectOptimalModel, 
  enhancePromptForModel, 
  enhancePromptWithText,
  calculateEstimatedCost,
  generateVideoSequence,
  formatForExport 
} from '@/lib/prompt-utils'

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
  session_id?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Enhance API] POST request received')

    const body = await request.json() as EnhanceRequest
    const { base_prompt, media_assets = [], text_elements = [], config, session_id } = body

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
      platform: config.platform
    })

    // Step 1: Select optimal model based on requirements
    const selectedModel = selectOptimalModel(config, media_assets)
    console.log('🤖 [Enhance API] Selected model:', selectedModel.name)

    // Step 2: Enhance the prompt for the selected model (with text support)
    const promptResult = text_elements.length > 0 
      ? enhancePromptWithText(base_prompt, config, media_assets, selectedModel, text_elements)
      : enhancePromptForModel(base_prompt, config, media_assets, selectedModel)

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

    // Step 5: Prepare the response
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
      })
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

    console.log('✅ [Enhance API] Enhancement completed successfully')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [Enhance API] Enhancement failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
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