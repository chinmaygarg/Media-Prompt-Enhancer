import { NextRequest, NextResponse } from 'next/server'
import { 
  selectOptimalModel, 
  calculateEstimatedCost,
  generateVideoSequence,
  formatForExport 
} from '@/lib/prompt-utils'
import { PromptEnhancer } from '@/lib/llm/prompt-enhancer'
import { VideoStorySegmentation } from '@/lib/video/story-segmentation'
import { ConsistencyAnchorManager } from '@/lib/video/consistency-anchors'
import { SequentialPromptGenerator } from '@/lib/video/sequential-prompts'
import { StoryIntelligenceEngine } from '@/lib/video/story-intelligence'
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
  let sessionId = 'unknown'
  
  try {
    console.log('🚀 [Enhance API] POST request received')

    const body = await request.json() as EnhanceRequest
    const { base_prompt, media_assets = [], text_elements = [], config, context_answers, session_id } = body
    
    // Enhanced Input Logging - Log sanitized request body
    console.log('📥 [Enhance API] Request Body Analysis:', {
      base_prompt: base_prompt?.substring(0, 100) + (base_prompt?.length > 100 ? '...' : ''),
      base_prompt_length: base_prompt?.length || 0,
      media_assets_count: media_assets?.length || 0,
      text_elements_count: text_elements?.length || 0,
      config: {
        outputType: config?.outputType,
        platform: config?.platform,
        style: config?.style?.substring(0, 50) + (config?.style?.length > 50 ? '...' : ''),
        duration: config?.duration,
        aspectRatio: config?.aspectRatio,
        qualityTier: config?.qualityTier
      },
      context_answers_provided: !!context_answers,
      context_answers_keys: context_answers ? Object.keys(context_answers) : [],
      has_session_id: !!session_id,
      request_timestamp: new Date().toISOString()
    })
    
    // Create sessionId after extracting session_id from request body
    sessionId = session_id || `enhance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

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
    const selectedModelCapabilities = modelSelection.selectionResult.selected_model || {
      id: selectedModel.name.toLowerCase().replace(/\s+/g, '-'),
      name: selectedModel.name,
      type: selectedModel.type,
      provider: 'Unknown',
      input_requirements: {},
      output_capabilities: {
        max_duration: selectedModel.maxDuration || 10,
        aspect_ratios: ['16:9']
      },
      pricing: {
        cost_per_image: selectedModel.costPerImage || 0,
        cost_per_second: selectedModel.costPerSecond || 0
      },
      classification: {
        quality_tier: selectedModel.qualityTier
      }
    }
    
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

    // Step 2: Initialize the LLM-powered enhancement system
    console.log('🤖 [Enhance API] Initializing LLM enhancement system...')
    const promptEnhancer = new PromptEnhancer()
    
    // Step 3: Handle video multi-clip generation for longer content
    console.log('🎬 [Enhance API] Checking for multi-clip video requirements:', {
      model_type: selectedModel.type,
      duration: config.duration,
      requires_multi_clip: (selectedModel.type === 'video' || selectedModel.type === 'video-audio') && config.duration && config.duration > 15
    })
    let videoStoryboard = undefined
    let consistencyProfile = undefined
    let enhancedClips = undefined
    let sequentialPrompts = undefined
    
    if ((selectedModel.type === 'video' || selectedModel.type === 'video-audio') && 
        config.duration && config.duration > 15) {
      
      console.log('🎬 [Enhance API] Processing multi-clip video generation')
      
      // Initialize video systems
      const storyIntelligence = new StoryIntelligenceEngine()
      const videoSegmentation = new VideoStorySegmentation()
      const consistencyManager = new ConsistencyAnchorManager()
      const sequentialGenerator = new SequentialPromptGenerator()
      
      try {
        // Analyze story structure
        const storyAnalysis = await storyIntelligence.analyzeStory({
          originalPrompt: base_prompt,
          targetDuration: config.duration,
          platform: config.platform,
          contentType: 'narrative'
        })
        
        // Segment video into clips
        videoStoryboard = await videoSegmentation.segmentVideo({
          basePrompt: base_prompt,
          totalDuration: config.duration,
          selectedModel: selectedModelCapabilities,
          platform: config.platform,
          storyType: 'narrative'
        })
        
        // Process consistency anchors
        const consistencyResult = await consistencyManager.processVideoConsistency(
          videoStoryboard,
          selectedModelCapabilities,
          base_prompt
        )
        
        consistencyProfile = consistencyResult.consistencyProfile
        enhancedClips = consistencyResult.enhancedClips
        
        // Generate sequential prompts
        sequentialPrompts = await sequentialGenerator.generateSequentialPrompts({
          storyboard: videoStoryboard,
          consistencyProfile,
          enhancedClips,
          selectedModel: selectedModelCapabilities,
          basePrompt: base_prompt,
          platform: config.platform,
          style: config.style
        })
        
        console.log('✅ [Enhance API] Multi-clip video processing completed')
        
      } catch (videoError) {
        console.warn('⚠️ [Enhance API] Multi-clip processing failed, falling back to single enhancement:', videoError)
      }
    }
    
    // Step 4: Enhance the primary prompt using LLM system
    console.log('🔄 [Enhance API] Starting LLM prompt enhancement...')
    const enhancementContext = {
      base_prompt: base_prompt,
      config: config,
      media_assets: media_assets,
      selected_model: selectedModelCapabilities,
      context_answers: context_answers
    }
    
    console.log('📝 [Enhance API] Enhancement Context:', {
      base_prompt_length: enhancementContext.base_prompt?.length || 0,
      selected_model_name: enhancementContext.selected_model?.name || 'Unknown',
      selected_model_type: enhancementContext.selected_model?.type || 'Unknown',
      has_context_answers: !!enhancementContext.context_answers
    })
    
    const promptResult = await promptEnhancer.enhancePrompt(enhancementContext)
    
    console.log('✅ [Enhance API] LLM enhancement completed:', {
      primary_prompt_length: promptResult?.primary_prompt?.length || 0,
      negative_prompt_length: promptResult?.negative_prompt?.length || 0,
      has_model_params: !!(promptResult?.model_specific_params),
      processing_time: promptResult?.processing_time || 'unknown',
      quality_score: promptResult?.quality_score || 'unknown'
    })

    // Step 5: Calculate estimated cost
    const estimatedCost = calculateEstimatedCost(config, selectedModel)

    // Step 6: Generate legacy video sequence if not using multi-clip system
    let shots = undefined
    if ((selectedModel.type === 'video' || selectedModel.type === 'video-audio') && !sequentialPrompts) {
      shots = generateVideoSequence(
        promptResult.primary_prompt,
        config,
        selectedModel
      )
    }

    // Step 7: Prepare the response with enhanced model information
    const enhancedResult = {
      primary_prompt: promptResult.primary_prompt,
      negative_prompt: promptResult.negative_prompt,
      model_selected: selectedModel.name,
      estimated_cost: estimatedCost,
      model_specific_params: promptResult.model_specific_params || {},
      ...(shots && { shots }),
      ...(sequentialPrompts && { 
        video_sequence: {
          total_clips: sequentialPrompts.totalClips,
          estimated_total_duration: sequentialPrompts.estimatedTotalDuration,
          clips: sequentialPrompts.clipPrompts,
          global_consistency_instructions: sequentialPrompts.globalConsistencyInstructions,
          sequential_flow: sequentialPrompts.sequentialFlow,
          quality_validation: sequentialPrompts.qualityValidation
        }
      }),
      ...(videoStoryboard && {
        storyboard: {
          total_clips: videoStoryboard.totalClips,
          clips: videoStoryboard.clips,
          average_clip_length: videoStoryboard.averageClipLength,
          story_arc: videoStoryboard.storyArc
        }
      }),
      ...(consistencyProfile && {
        consistency_profile: consistencyProfile
      }),
      // Add LLM enhancement insights
      enhancement_insights: {
        quality_improvements: promptResult.enhancement_insights || [],
        processing_time: promptResult.processing_time,
        quality_score: promptResult.quality_score,
        used_prompts: promptResult.used_prompts
      },
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
        processing_time: Date.now() - startTime,
        media_assets_used: media_assets.length,
        model_type: selectedModel.type,
        platform_optimized: config.platform
      }
    }

    // Enhanced Output Logging - Log final response structure
    console.log('📤 [Enhance API] Final Response Structure:', {
      success: response.success,
      data_keys: Object.keys(response.data),
      primary_prompt_length: response.data.primary_prompt?.length || 0,
      negative_prompt_length: response.data.negative_prompt?.length || 0,
      model_selected: response.data.model_selected,
      estimated_cost: response.data.estimated_cost,
      has_shots: !!(response.data as any).shots,
      has_video_sequence: !!(response.data as any).video_sequence,
      has_storyboard: !!(response.data as any).storyboard,
      has_consistency_profile: !!(response.data as any).consistency_profile,
      has_enhancement_insights: !!(response.data as any).enhancement_insights,
      processing_time_ms: response.metadata.processing_time,
      response_timestamp: new Date().toISOString()
    })

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
        has_video_sequence: !!(enhancedResult as any).video_sequence,
        video_clips_count: (enhancedResult as any).video_sequence?.total_clips || 0,
        has_storyboard: !!(enhancedResult as any).storyboard,
        has_consistency_profile: !!(enhancedResult as any).consistency_profile,
        has_enhancement_insights: !!(enhancedResult as any).enhancement_insights,
        compatibility_score: enhancedResult.model_info?.compatibility_score,
        processing_time: Date.now() - startTime
      },
      sessionId,
      debug: {
        model_info: enhancedResult.model_info,
        enhancement_insights: (enhancedResult as any).enhancement_insights,
        video_sequence: (enhancedResult as any).video_sequence,
        storyboard: (enhancedResult as any).storyboard
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