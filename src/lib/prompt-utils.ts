import { ModelSelector, ModelSelectionCriteria, ModelSelectionResult } from './model-selection'
import { ModelCapabilities, getModelById } from './model-capabilities'
import { QuestionAnswers } from '@/types/context-questions'

interface MediaAsset {
  id: string
  filename: string
  file_type: 'image' | 'video' | 'audio'
  storage_path: string
  mime_type: string
  file_size_bytes: number
  description?: {
    userDescription?: string
    aiAnalysis?: any
    tags: string[]
    category: 'character' | 'environment' | 'object' | 'style' | 'reference' | 'general'
  }
}

interface EnhancementConfig {
  outputType: 'text-to-image' | 'image-text-to-image' | 'text-to-video' | 'image-text-to-video' | 'text-to-video-audio' | 'image-text-to-video-audio'
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
  style: string
  duration?: number
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5'
  qualityTier: 'draft' | 'social' | 'production'
}

interface ModelConfig {
  name: string
  type: 'image' | 'video' | 'video-audio'
  costPerSecond?: number
  costPerImage?: number
  maxDuration?: number
  qualityTier: 'draft' | 'social' | 'production'
}

// Legacy configurations - moved to model-capabilities.ts and system-prompts.ts
// These are maintained here only for backward compatibility with existing functions

// Enhanced model selection with compatibility checking
export function selectOptimalModel(
  config: EnhancementConfig, 
  mediaAssets: MediaAsset[],
  basePrompt: string = ''
): {
  model: ModelConfig
  selectionResult: ModelSelectionResult
  compatibilityWarnings: string[]
} {
  // Create selection criteria from enhancement config
  const criteria: ModelSelectionCriteria = {
    outputType: config.outputType,
    qualityTier: config.qualityTier,
    platform: config.platform,
    generation_speed_priority: 'balanced',
    budget: {
      prefer_cost_effective: config.qualityTier === 'draft'
    }
  }
  
  try {
    // Use the smart model selector
    const selectionResult = ModelSelector.selectOptimalModel(
      basePrompt,
      mediaAssets,
      criteria
    )
    
    // Validate the selection
    const validation = ModelSelector.validateSelection(selectionResult)
    
    if (!validation.valid) {
      console.warn('[Model Selection] Validation failed:', validation.user_message)
      // Fall back to legacy selection if new system fails
      return {
        model: legacyModelSelection(config, mediaAssets),
        selectionResult,
        compatibilityWarnings: [validation.user_message]
      }
    }
    
    // Convert enhanced model to legacy ModelConfig format for backward compatibility
    const qualityTierMapping: Record<string, 'draft' | 'social' | 'production'> = {
      'draft': 'draft',
      'social': 'social',
      'production': 'production',
      'professional': 'production' // Map professional to production for backward compatibility
    }
    
    const legacyModel: ModelConfig = {
      name: selectionResult.selected_model.name,
      type: selectionResult.selected_model.type,
      costPerImage: selectionResult.selected_model.pricing.cost_per_image,
      costPerSecond: selectionResult.selected_model.pricing.cost_per_second,
      maxDuration: selectionResult.selected_model.output_capabilities.max_duration,
      qualityTier: qualityTierMapping[selectionResult.selected_model.classification.quality_tier] || 'social'
    }
    
    const warnings = [
      ...selectionResult.compatibility.warnings,
      ...selectionResult.compatibility.issues
        .filter(issue => issue.type === 'warning')
        .map(issue => issue.message)
    ]
    
    console.log(`[Model Selection] Selected: ${selectionResult.selected_model.name}`, {
      compatibility_score: selectionResult.compatibility.compatibility_score,
      estimated_cost: selectionResult.estimated_cost,
      reasoning: selectionResult.reasoning
    })
    
    return {
      model: legacyModel,
      selectionResult,
      compatibilityWarnings: warnings
    }
    
  } catch (error) {
    console.error('[Model Selection] Smart selection failed:', error)
    // Fall back to legacy selection
    return {
      model: legacyModelSelection(config, mediaAssets),
      selectionResult: {} as ModelSelectionResult, // Empty result
      compatibilityWarnings: ['Using fallback model selection due to smart selection failure']
    }
  }
}

// Legacy model selection for fallback compatibility
function legacyModelSelection(config: EnhancementConfig, mediaAssets: MediaAsset[]): ModelConfig {
  // Simplified fallback - returns basic model configuration
  // Full model selection is now handled by ModelSelector in model-selection.ts
  return {
    name: 'Qwen Image',
    type: 'image',
    costPerImage: 0.012,
    qualityTier: 'social'
  }
}

// Legacy function - replaced by new LLM-powered system in PromptEnhancer
// This function is kept for reference and fallback compatibility
// New implementations should use: import { PromptEnhancer } from '@/lib/llm/prompt-enhancer'

// DEPRECATED: Legacy function - replaced by new LLM-powered system
// Use: import { PromptEnhancer } from '@/lib/llm/prompt-enhancer'
// This function generated duplicate quality terms and basic concatenation
// New system provides intelligent enhancement with context understanding
export function enhancePromptForModel(
  basePrompt: string,
  config: EnhancementConfig,
  mediaAssets: MediaAsset[],
  selectedModel: ModelConfig,
  contextAnswers?: QuestionAnswers
): {
  primary_prompt: string
  negative_prompt: string
  model_specific_params: Record<string, any>
  media_insights?: string[]
  context_insights?: string[]
} {
  // This is a deprecated legacy function
  // For new implementations, use the LLM-powered PromptEnhancer:
  // const enhancer = new PromptEnhancer()
  // const result = await enhancer.enhancePrompt(context)
  
  console.warn('⚠️ Using deprecated enhancePromptForModel function. Please migrate to PromptEnhancer.')
  
  return {
    primary_prompt: basePrompt + ', high quality, detailed',
    negative_prompt: 'low quality, blurry, distorted',
    model_specific_params: { aspect_ratio: config.aspectRatio },
    media_insights: ['Legacy function - limited enhancement capabilities'],
    context_insights: ['Please migrate to new LLM-powered system for better results']
  }
}

// Text Engine Integration
interface TextElement {
  id: string
  text: string
  type: 'overlay' | 'in-video'
  position?: { x: number; y: number; anchor: string }
  timing?: { startTime: number; endTime: number }
  context?: 'sign' | 'screen' | 'paper' | 'billboard' | 'book' | 'laptop' | 'phone'
  style?: any
}

// DEPRECATED: Legacy function - replaced by new LLM-powered system
// Use: import { PromptEnhancer } from '@/lib/llm/prompt-enhancer'
export function enhancePromptWithText(
  basePrompt: string,
  config: EnhancementConfig,
  mediaAssets: MediaAsset[],
  selectedModel: ModelConfig,
  textElements: TextElement[] = [],
  contextAnswers?: QuestionAnswers
): {
  primary_prompt: string
  negative_prompt: string
  model_specific_params: Record<string, any>
  text_instructions: string[]
  text_warnings: string[]
  media_insights: string[]
  context_insights?: string[]
} {
  console.warn('⚠️ Using deprecated enhancePromptWithText function. Please migrate to PromptEnhancer.')
  
  return {
    primary_prompt: basePrompt + ', high quality, detailed',
    negative_prompt: 'low quality, blurry, distorted',
    model_specific_params: { aspect_ratio: config.aspectRatio },
    text_instructions: ['Legacy function - limited text processing'],
    text_warnings: ['Please migrate to new LLM-powered system'],
    media_insights: ['Legacy function - limited enhancement capabilities']
  }
}

// Legacy helper functions - removed for code cleanup
// These functions have been replaced by the new LLM-powered system
// which provides more intelligent media analysis and processing

export function calculateEstimatedCost(
  config: EnhancementConfig,
  selectedModel: ModelConfig
): number {
  if (selectedModel.type === 'image') {
    return selectedModel.costPerImage || 0.01
  } else {
    const duration = config.duration || 5
    return (selectedModel.costPerSecond || 0.05) * duration
  }
}

export function generateVideoSequence(
  basePrompt: string,
  config: EnhancementConfig,
  selectedModel: ModelConfig,
  consistencyProfiles: any[] = []
): Array<{
  prompt: string
  duration: number
  transition: string
  metadata: {
    focus: string
    composition: string
    mood: string
    clipNumber: number
    textOptimization?: string
  }
}> {
  const totalDuration = config.duration || 5
  const maxClipLength = selectedModel.maxDuration || 5
  
  // For simple videos, use basic approach
  if (totalDuration <= maxClipLength) {
    return [{
      prompt: basePrompt + ', professional quality, cinematic',
      duration: totalDuration,
      transition: 'none',
      metadata: {
        focus: 'environment',
        composition: 'medium',
        mood: 'neutral',
        clipNumber: 1
      }
    }]
  }

  // For complex videos, use advanced scene planning
  return generateAdvancedVideoSequence(basePrompt, config, selectedModel, consistencyProfiles)
}

function generateAdvancedVideoSequence(
  basePrompt: string,
  config: EnhancementConfig,
  selectedModel: ModelConfig,
  consistencyProfiles: any[]
): Array<{
  prompt: string
  duration: number
  transition: string
  metadata: any
}> {
  const totalDuration = config.duration || 5
  const maxClipLength = selectedModel.maxDuration || 5
  
  // Calculate optimal clips
  const optimalClips = Math.ceil(totalDuration / Math.min(maxClipLength, 8))
  const clipDuration = Math.floor(totalDuration / optimalClips)
  
  const clips = []
  const transitions = ['cut', 'fade', 'dissolve', 'wipe', 'zoom-in']
  const compositions = ['wide', 'medium', 'close-up', 'medium', 'wide']
  const focuses = ['environment', 'character', 'product', 'action', 'environment']
  const moods = ['establishing', 'engaging', 'dynamic', 'climactic', 'resolving']
  
  // Build consistency anchors
  const consistencyAnchors = buildConsistencyFromProfiles(consistencyProfiles)
  
  for (let i = 0; i < optimalClips; i++) {
    const isFirst = i === 0
    const isLast = i === optimalClips - 1
    const duration = isLast ? totalDuration - (clipDuration * i) : clipDuration
    
    let clipPrompt = basePrompt
    
    // Add composition and camera work
    const composition = compositions[i % compositions.length]
    const focus = focuses[i % focuses.length]
    const mood = moods[i % moods.length]
    
    clipPrompt += `, ${composition} shot`
    clipPrompt += `, focus on ${focus}`
    clipPrompt += `, ${mood} mood`
    
    // Add consistency anchors
    if (consistencyAnchors.character) {
      clipPrompt += `, ${consistencyAnchors.character}`
    }
    if (consistencyAnchors.environment) {
      clipPrompt += `, ${consistencyAnchors.environment}`
    }
    if (consistencyAnchors.style) {
      clipPrompt += `, ${consistencyAnchors.style}`
    }
    
    // Add scene-specific enhancements
    if (isFirst) {
      clipPrompt += ', establishing shot, clear introduction'
    } else if (isLast) {
      clipPrompt += ', concluding shot, satisfying resolution'
    } else {
      clipPrompt += ', maintain visual consistency with previous clips'
    }
    
    // Add platform-specific optimization
    if (config.platform === 'tiktok' || config.platform === 'instagram') {
      clipPrompt += ', social media optimized, engaging visuals'
    } else if (config.platform === 'linkedin') {
      clipPrompt += ', professional presentation, corporate aesthetic'
    } else if (config.platform === 'youtube') {
      clipPrompt += ', youtube shorts style, attention-grabbing'
    }
    
    clips.push({
      prompt: clipPrompt,
      duration,
      transition: isFirst ? 'none' : transitions[i % transitions.length],
      metadata: {
        focus,
        composition,
        mood,
        clipNumber: i + 1,
        hasConsistency: consistencyAnchors.character || consistencyAnchors.environment
      }
    })
  }
  
  return clips
}

function buildConsistencyFromProfiles(profiles: any[]): {
  character?: string
  environment?: string
  style?: string
} {
  const anchors: any = {}
  
  for (const profile of profiles) {
    if (profile.type === 'character') {
      anchors.character = profile.referencePrompt || 'same character throughout'
    } else if (profile.type === 'environment') {
      anchors.environment = profile.referencePrompt || 'consistent environment'
    } else if (profile.type === 'style') {
      anchors.style = profile.referencePrompt || 'consistent visual style'
    }
  }
  
  return anchors
}

export function formatForExport(
  enhancedPrompt: any,
  originalPrompt: string,
  mediaAssets: MediaAsset[],
  config: EnhancementConfig
) {
  return {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      model: enhancedPrompt.model_selected,
      cost_estimate: enhancedPrompt.estimated_cost
    },
    input: {
      original_prompt: originalPrompt,
      media_references: mediaAssets.length,
      configuration: config
    },
    output: enhancedPrompt,
    usage_notes: [
      'Copy the primary_prompt to your AI generation tool',
      'Use the negative_prompt to avoid unwanted elements',
      'Model-specific parameters may need adjustment based on your platform',
      'For video sequences, process each shot separately and stitch together'
    ]
  }
}