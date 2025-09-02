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

// Model configurations based on research and project specification
const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Text-to-Image Models
  'qwen-image': { name: 'Qwen Image', type: 'image', costPerImage: 0.012, qualityTier: 'social' },
  'ideogram-v3': { name: 'Ideogram v3', type: 'image', costPerImage: 0.008, qualityTier: 'social' },
  'imagen-4': { name: 'Imagen 4', type: 'image', costPerImage: 0.025, qualityTier: 'production' },
  
  // NEW: Alibaba Cloud Wan 2.2 Image Models
  'wan-2.2-flash': { name: 'Wan 2.2 Flash', type: 'image', costPerImage: 0.025, qualityTier: 'social' },
  'wan-2.2-plus': { name: 'Wan 2.2 Plus', type: 'image', costPerImage: 0.05, qualityTier: 'production' },
  
  // NEW: Google Imagen 4 Models  
  'imagen-4-fast': { name: 'Imagen 4 Fast', type: 'image', costPerImage: 0.04, qualityTier: 'production' },
  'imagen-4-ultra': { name: 'Imagen 4 Ultra', type: 'image', costPerImage: 0.08, qualityTier: 'production' },
  
  // Image+Text-to-Image Models
  'minimax-image-01': { name: 'Minimax Image-01', type: 'image', costPerImage: 0.015, qualityTier: 'social' },
  'flux-kontext': { name: 'FLUX.1 Kontext', type: 'image', costPerImage: 0.018, qualityTier: 'social' },
  
  // Text-to-Video Models
  'seedance-1.0': { name: 'Seedance 1.0', type: 'video', costPerSecond: 0.05, maxDuration: 10, qualityTier: 'social' },
  'veo-3': { name: 'Veo 3', type: 'video-audio', costPerSecond: 0.12, maxDuration: 8, qualityTier: 'production' },
  'kling-2.1': { name: 'Kling 2.1 Master', type: 'video', costPerSecond: 0.25, maxDuration: 10, qualityTier: 'production' },
  
  // NEW: Alibaba Cloud Video Models
  'wan-2.2-t2v': { name: 'Wan 2.2 Text-to-Video', type: 'video', costPerSecond: 0.02, maxDuration: 5, qualityTier: 'draft' },
  'wan-2.2-t2v-1080p': { name: 'Wan 2.2 T2V 1080p', type: 'video', costPerSecond: 0.10, maxDuration: 5, qualityTier: 'social' },
  
  // NEW: RunwayML Gen-4 Models
  'runway-gen4-turbo': { name: 'Runway Gen-4 Turbo', type: 'video', costPerSecond: 0.067, maxDuration: 10, qualityTier: 'production' },
  'runway-gen4': { name: 'Runway Gen-4', type: 'video', costPerSecond: 0.16, maxDuration: 10, qualityTier: 'production' },
  
  // Image+Text-to-Video Models
  'hailuo-02': { name: 'Hailuo 02', type: 'video', costPerSecond: 0.08, maxDuration: 6, qualityTier: 'social' },
  'wan-2.2-i2v': { name: 'Wan 2.2 Image-to-Video', type: 'video', costPerSecond: 0.015, maxDuration: 5, qualityTier: 'draft' },
  'pixverse-v4.5': { name: 'PixVerse v4.5', type: 'video', costPerSecond: 0.06, maxDuration: 4, qualityTier: 'social' },
}

// Platform-specific optimizations
const PLATFORM_CONFIGS = {
  instagram: {
    preferredAspectRatio: ['1:1', '4:5'],
    maxDuration: 60,
    styleKeywords: ['vibrant', 'engaging', 'social-media-friendly'],
    hashtagSupport: true
  },
  tiktok: {
    preferredAspectRatio: ['9:16'],
    maxDuration: 60,
    styleKeywords: ['dynamic', 'trendy', 'fast-paced'],
    verticalOptimized: true
  },
  youtube: {
    preferredAspectRatio: ['9:16', '16:9'],
    maxDuration: 60,
    styleKeywords: ['professional', 'engaging', 'high-quality'],
    thumbnailOptimized: true
  },
  linkedin: {
    preferredAspectRatio: ['16:9', '1:1'],
    maxDuration: 30,
    styleKeywords: ['professional', 'corporate', 'clean'],
    businessFocused: true
  },
  general: {
    preferredAspectRatio: ['16:9', '1:1', '9:16'],
    maxDuration: 120,
    styleKeywords: ['high-quality', 'detailed'],
    flexible: true
  }
}

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
  const hasImages = mediaAssets.some(asset => asset.file_type === 'image')
  const { outputType, qualityTier } = config

  let candidateModels: ModelConfig[] = []

  // Filter models based on output type
  switch (outputType) {
    case 'text-to-image':
      candidateModels = [
        MODEL_CONFIGS['ideogram-v3'], // Most cost-effective
        MODEL_CONFIGS['qwen-image'], // Good balance
        MODEL_CONFIGS['wan-2.2-flash'], // Good value
        MODEL_CONFIGS['imagen-4'] // Original premium
      ]
      break
    case 'image-text-to-image':
      // Only use models that actually support images
      candidateModels = hasImages ? [
        MODEL_CONFIGS['minimax-image-01'],
        MODEL_CONFIGS['flux-kontext']
      ] : [
        MODEL_CONFIGS['ideogram-v3'], // Fallback to text-only
        MODEL_CONFIGS['qwen-image']
      ]
      break
    case 'text-to-video':
      candidateModels = [
        MODEL_CONFIGS['wan-2.2-t2v'], // Cheapest at $0.02/sec
        MODEL_CONFIGS['seedance-1.0'], // Good balance
        MODEL_CONFIGS['veo-3'] // Audio support
      ]
      break
    case 'image-text-to-video':
      candidateModels = hasImages ? [
        MODEL_CONFIGS['wan-2.2-i2v'], // Cheapest image-to-video
        MODEL_CONFIGS['hailuo-02']
      ] : [
        MODEL_CONFIGS['wan-2.2-t2v'], // Fallback to text-only
        MODEL_CONFIGS['seedance-1.0']
      ]
      break
    case 'text-to-video-audio':
    case 'image-text-to-video-audio':
      candidateModels = [MODEL_CONFIGS['veo-3']] // Only Veo 3 supports native audio
      break
  }

  // Filter by quality tier
  const tierFiltered = candidateModels.filter(model => 
    qualityTier === 'draft' ? model.qualityTier !== 'production' :
    qualityTier === 'production' ? model.qualityTier === 'production' :
    true // social accepts all
  )

  // Return the best match or fallback
  return tierFiltered[0] || candidateModels[0] || MODEL_CONFIGS['qwen-image']
}

// Process context answers into prompt enhancements using intelligent mapping
function processContextAnswers(
  contextAnswers: QuestionAnswers,
  basePrompt: string,
  config: EnhancementConfig
): {
  promptEnhancements: string[]
  negativePromptEnhancements: string[]
  styleModifications: string[]
  insights: string[]
} {
  const promptEnhancements: string[] = []
  const negativePromptEnhancements: string[] = []
  const styleModifications: string[] = []
  const insights: string[] = []

  // Comprehensive answer mapping system
  const answerMappings: Record<string, { positive: string[]; negative?: string[]; insight: string }> = {
    // Environment Settings
    'Indoor Studio': { 
      positive: ['studio lighting', 'controlled environment', 'professional backdrop', 'clean background'],
      negative: ['outdoor elements', 'natural lighting variations', 'weather effects'],
      insight: 'Applied studio environment with controlled lighting'
    },
    'Natural Outdoor': { 
      positive: ['natural outdoor setting', 'environmental lighting', 'organic atmosphere', 'landscape elements'],
      negative: ['artificial lighting', 'indoor constraints'],
      insight: 'Enhanced with natural outdoor environment'
    },
    'Urban Environment': { 
      positive: ['urban cityscape', 'architectural elements', 'modern environment', 'street atmosphere'],
      insight: 'Added urban environmental context'
    },
    'Abstract Background': { 
      positive: ['abstract background', 'artistic backdrop', 'non-literal environment', 'creative composition'],
      negative: ['realistic background', 'literal setting'],
      insight: 'Applied abstract artistic background'
    },
    'Contextual Setting': { 
      positive: ['contextually relevant environment', 'thematic background', 'story-appropriate setting'],
      insight: 'Enhanced with contextually appropriate setting'
    },

    // Visual Styles
    'Photorealistic': { 
      positive: ['photorealistic rendering', 'lifelike details', 'realistic textures', 'natural appearance'],
      negative: ['stylized', 'cartoonish', 'abstract'],
      insight: 'Enhanced for photorealistic quality'
    },
    'Artistic & Stylized': { 
      positive: ['artistic stylization', 'creative interpretation', 'stylized rendering', 'artistic flair'],
      negative: ['photorealistic', 'literal representation'],
      insight: 'Applied artistic stylization'
    },
    'Cinematic': { 
      positive: ['cinematic lighting', 'film-quality rendering', 'movie-like composition', 'dramatic cinematography'],
      insight: 'Enhanced with cinematic quality'
    },
    'Clean & Modern': { 
      positive: ['clean modern aesthetic', 'minimalist design', 'contemporary styling', 'sleek appearance'],
      negative: ['cluttered', 'vintage', 'ornate'],
      insight: 'Applied clean modern aesthetic'
    },
    'Dramatic & Moody': { 
      positive: ['dramatic lighting', 'moody atmosphere', 'intense shadows', 'emotional depth', 'high contrast'],
      negative: ['bright cheerful', 'flat lighting', 'low contrast'],
      insight: 'Enhanced with dramatic moody atmosphere'
    },

    // Portrait Moods
    'Professional & Confident': { 
      positive: ['professional confident expression', 'executive presence', 'business-appropriate styling', 'authoritative pose'],
      negative: ['casual', 'unprofessional', 'amateur'],
      insight: 'Applied professional confident styling'
    },
    'Warm & Approachable': { 
      positive: ['warm friendly expression', 'soft natural lighting', 'approachable demeanor', 'welcoming atmosphere'],
      negative: ['cold', 'distant', 'intimidating'],
      insight: 'Enhanced with warm approachable mood'
    },
    'Artistic & Creative': { 
      positive: ['creative artistic expression', 'unique styling', 'innovative composition', 'artistic interpretation'],
      insight: 'Applied creative artistic direction'
    },
    'Dramatic & Intense': { 
      positive: ['dramatic intense expression', 'powerful lighting', 'emotional depth', 'striking composition'],
      insight: 'Enhanced with dramatic intensity'
    },
    'Natural & Candid': { 
      positive: ['natural candid expression', 'authentic moment', 'unposed appearance', 'genuine emotion'],
      negative: ['overly posed', 'artificial'],
      insight: 'Applied natural candid styling'
    },

    // Color Preferences
    'Warm Tones': { 
      positive: ['warm color palette', 'golden tones', 'orange and red hues', 'cozy atmosphere'],
      negative: ['cool colors', 'blue tones'],
      insight: 'Enhanced with warm color palette'
    },
    'Cool Tones': { 
      positive: ['cool color palette', 'blue and teal tones', 'crisp colors', 'fresh atmosphere'],
      negative: ['warm colors', 'orange tones'],
      insight: 'Applied cool color palette'
    },
    'Vibrant & Saturated': { 
      positive: ['vibrant saturated colors', 'bold color choices', 'high saturation', 'vivid appearance'],
      negative: ['muted colors', 'desaturated'],
      insight: 'Enhanced with vibrant saturated colors'
    },
    'Muted & Subtle': { 
      positive: ['muted subtle colors', 'soft color palette', 'understated tones', 'gentle hues'],
      negative: ['vibrant', 'oversaturated'],
      insight: 'Applied muted subtle color scheme'
    },
    'Monochrome': { 
      positive: ['monochrome aesthetic', 'black and white', 'grayscale tones', 'timeless appearance'],
      negative: ['colorful', 'vivid colors', 'saturated'],
      insight: 'Enhanced with monochrome treatment'
    },
    'Natural Colors': { 
      positive: ['natural color palette', 'realistic coloring', 'authentic tones', 'true-to-life colors'],
      insight: 'Applied natural realistic coloring'
    },

    // Composition Focus
    'Center Subject': { 
      positive: ['centered composition', 'subject as focal point', 'symmetrical framing', 'balanced layout'],
      insight: 'Applied centered subject composition'
    },
    'Rule of Thirds': { 
      positive: ['rule of thirds composition', 'dynamic framing', 'balanced asymmetry', 'professional composition'],
      insight: 'Enhanced with rule of thirds composition'
    },
    'Dynamic Diagonal': { 
      positive: ['dynamic diagonal composition', 'energetic framing', 'movement-oriented layout', 'action-focused'],
      insight: 'Applied dynamic diagonal composition'
    },
    'Leading Lines': { 
      positive: ['leading lines composition', 'directional flow', 'guided visual path', 'structured framing'],
      insight: 'Enhanced with leading lines composition'
    },
    'Symmetrical Balance': { 
      positive: ['symmetrical balanced composition', 'harmonious framing', 'perfect balance', 'ordered layout'],
      insight: 'Applied symmetrical balanced composition'
    },

    // Product Presentation
    'Clean & Minimal': { 
      positive: ['clean minimal presentation', 'uncluttered composition', 'simple elegant styling', 'focus on product'],
      negative: ['cluttered', 'busy background', 'distracting elements'],
      insight: 'Applied clean minimal product presentation'
    },
    'Lifestyle & Contextual': { 
      positive: ['lifestyle contextual presentation', 'real-world usage', 'environmental context', 'practical setting'],
      insight: 'Enhanced with lifestyle contextual presentation'
    },
    'Dramatic & Premium': { 
      positive: ['dramatic premium presentation', 'luxury aesthetic', 'high-end styling', 'sophisticated lighting'],
      insight: 'Applied dramatic premium presentation'
    },
    'Technical & Detailed': { 
      positive: ['technical detailed presentation', 'precise documentation', 'feature highlighting', 'specification focus'],
      insight: 'Enhanced with technical detailed approach'
    },
    'Creative & Artistic': { 
      positive: ['creative artistic presentation', 'innovative styling', 'unique perspective', 'artistic interpretation'],
      insight: 'Applied creative artistic presentation'
    },

    // Atmosphere Types
    'Peaceful & Serene': { 
      positive: ['peaceful serene atmosphere', 'calm environment', 'tranquil mood', 'gentle lighting'],
      negative: ['chaotic', 'aggressive', 'harsh'],
      insight: 'Enhanced with peaceful serene atmosphere'
    },
    'Vibrant & Energetic': { 
      positive: ['vibrant energetic atmosphere', 'dynamic energy', 'lively mood', 'active environment'],
      negative: ['dull', 'lifeless', 'static'],
      insight: 'Applied vibrant energetic atmosphere'
    },
    'Mysterious & Dark': { 
      positive: ['mysterious dark atmosphere', 'enigmatic mood', 'shadow-rich environment', 'dramatic darkness'],
      insight: 'Enhanced with mysterious dark atmosphere'
    },
    'Bright & Cheerful': { 
      positive: ['bright cheerful atmosphere', 'uplifting mood', 'positive energy', 'light-filled environment'],
      negative: ['dark', 'moody', 'depressing'],
      insight: 'Applied bright cheerful atmosphere'
    },

    // Additional Elements  
    'Dramatic Lighting': { 
      positive: ['dramatic lighting effects', 'strong light contrast', 'mood lighting', 'theatrical illumination'],
      insight: 'Enhanced with dramatic lighting effects'
    },
    'Interesting Textures': { 
      positive: ['rich interesting textures', 'tactile surfaces', 'material depth', 'textural variety'],
      insight: 'Added interesting textural elements'
    },
    'Dynamic Movement': { 
      positive: ['dynamic movement', 'action elements', 'kinetic energy', 'motion blur effects'],
      insight: 'Enhanced with dynamic movement'
    },
    'Complementary Objects': { 
      positive: ['complementary supporting objects', 'contextual props', 'scene enhancement', 'environmental details'],
      insight: 'Added complementary supporting elements'
    },
    'Atmospheric Effects': { 
      positive: ['atmospheric effects', 'environmental ambiance', 'mood enhancement', 'atmospheric depth'],
      insight: 'Enhanced with atmospheric effects'
    }
  }

  for (const [questionId, answer] of Object.entries(contextAnswers)) {
    const answers = Array.isArray(answer) ? answer : [answer]
    
    answers.forEach(singleAnswer => {
      const mapping = answerMappings[singleAnswer]
      if (mapping) {
        promptEnhancements.push(...mapping.positive)
        if (mapping.negative) {
          negativePromptEnhancements.push(...mapping.negative)
        }
        insights.push(mapping.insight)
      } else {
        // Fallback to basic keyword matching for unmapped answers
        const lowerAnswer = singleAnswer.toLowerCase()
        if (lowerAnswer.includes('dramatic')) {
          promptEnhancements.push('dramatic lighting', 'high contrast', 'moody atmosphere')
          insights.push('Applied dramatic enhancement based on keyword matching')
        } else if (lowerAnswer.includes('professional')) {
          promptEnhancements.push('professional quality', 'business appropriate', 'polished appearance')
          insights.push('Applied professional enhancement based on keyword matching')
        } else if (lowerAnswer.includes('creative')) {
          promptEnhancements.push('creative interpretation', 'artistic flair', 'innovative approach')
          insights.push('Applied creative enhancement based on keyword matching')
        } else {
          // For completely unmapped answers, add them as descriptive terms
          promptEnhancements.push(singleAnswer.toLowerCase())
          insights.push(`Applied user preference: ${singleAnswer}`)
        }
      }
    })
  }

  return {
    promptEnhancements,
    negativePromptEnhancements,
    styleModifications,
    insights
  }
}

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
  const platformConfig = PLATFORM_CONFIGS[config.platform]
  let enhanced = basePrompt
  let contextInsights: string[] = []

  // Process context answers if provided
  if (contextAnswers && Object.keys(contextAnswers).length > 0) {
    const contextEnhancements = processContextAnswers(contextAnswers, basePrompt, config)
    if (contextEnhancements.promptEnhancements.length > 0) {
      enhanced += `, ${contextEnhancements.promptEnhancements.join(', ')}`
    }
    contextInsights = contextEnhancements.insights
  }

  // Add style enhancements
  if (config.style) {
    enhanced += `, ${config.style} style`
  }

  // Add platform-specific keywords
  if (platformConfig.styleKeywords) {
    enhanced += `, ${platformConfig.styleKeywords.join(', ')}`
  }

  // Add quality descriptors based on tier
  const qualityDescriptors = {
    draft: 'good quality',
    social: 'high quality, detailed',
    production: 'ultra high quality, professional, detailed, masterpiece'
  }
  enhanced += `, ${qualityDescriptors[config.qualityTier]}`

  // Add technical specifications
  if (selectedModel.type === 'video' || selectedModel.type === 'video-audio') {
    enhanced += `, cinematic, smooth motion`
    if (config.duration && config.duration > 5) {
      enhanced += `, extended sequence, narrative flow`
    }
  }

  // Model-specific optimizations
  const modelParams: Record<string, any> = {
    aspect_ratio: config.aspectRatio
  }

  // Model-specific optimizations based on strengths
  if (selectedModel.name.includes('Ideogram')) {
    enhanced += `, typography-friendly, text-readable`
  } else if (selectedModel.name.includes('Imagen')) {
    enhanced += `, photorealistic, commercial grade`
    if (selectedModel.name.includes('Ultra')) {
      enhanced += `, ultra-high-definition, premium quality`
    }
  } else if (selectedModel.name.includes('Veo')) {
    enhanced += `, professional cinematography`
    if (config.outputType.includes('audio')) {
      modelParams.audio_enabled = true
    }
  } else if (selectedModel.name.includes('Wan 2.2')) {
    enhanced += `, detailed rendering, cost-effective quality`
    if (selectedModel.name.includes('Plus')) {
      enhanced += `, rich details, enhanced textures`
    }
  } else if (selectedModel.name.includes('Runway Gen-4')) {
    enhanced += `, cinematic physics, character consistency`
    if (selectedModel.name.includes('Turbo')) {
      enhanced += `, optimized for speed and quality balance`
    } else {
      enhanced += `, maximum quality, world-class consistency`
    }
  } else if (selectedModel.name.includes('Kling')) {
    enhanced += `, premium cinematic quality, master-level rendering`
  }

  // Process media descriptions
  const mediaInsights: string[] = []
  const mediaWithDescriptions = mediaAssets.filter(asset => asset.description)
  if (mediaWithDescriptions.length > 0) {
    const mediaEnhancements = processMediaDescriptions(mediaWithDescriptions, config.outputType)
    enhanced += mediaEnhancements.promptAdditions.length > 0 
      ? `, ${mediaEnhancements.promptAdditions.join(', ')}` 
      : ''
    mediaInsights.push(...mediaEnhancements.insights)
  }

  // Generate negative prompt
  let negativePrompt = generateNegativePrompt(config, selectedModel)
  
  // Add context-based negative prompts if available
  if (contextAnswers && Object.keys(contextAnswers).length > 0) {
    const contextEnhancements = processContextAnswers(contextAnswers, basePrompt, config)
    if (contextEnhancements.negativePromptEnhancements.length > 0) {
      negativePrompt += `, ${contextEnhancements.negativePromptEnhancements.join(', ')}`
    }
  }

  return {
    primary_prompt: enhanced,
    negative_prompt: negativePrompt,
    model_specific_params: modelParams,
    ...(mediaInsights.length > 0 && { media_insights: mediaInsights }),
    ...(contextInsights.length > 0 && { context_insights: contextInsights })
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
  // Get base enhancement with context
  const baseResult = enhancePromptForModel(basePrompt, config, mediaAssets, selectedModel, contextAnswers)
  
  const mediaInsights: string[] = []
  
  // Process media descriptions
  const mediaWithDescriptions = mediaAssets.filter(asset => asset.description)
  if (mediaWithDescriptions.length > 0) {
    const mediaEnhancements = processMediaDescriptions(mediaWithDescriptions, config.outputType)
    baseResult.primary_prompt += mediaEnhancements.promptAdditions.length > 0 
      ? `, ${mediaEnhancements.promptAdditions.join(', ')}` 
      : ''
    baseResult.negative_prompt += mediaEnhancements.negativePrompts.length > 0
      ? `, ${mediaEnhancements.negativePrompts.join(', ')}`
      : ''
    mediaInsights.push(...mediaEnhancements.insights)
  }

  if (textElements.length === 0) {
    return {
      ...baseResult,
      text_instructions: [],
      text_warnings: [],
      media_insights: mediaInsights
    }
  }

  // Model text capabilities (simplified version from text-engine)
  const modelTextCapabilities: Record<string, any> = {
    'qwen-image': { inVideoSupport: true, overlaySupport: false, multilingual: true, quality: 'excellent' },
    'ideogram-v3': { inVideoSupport: true, overlaySupport: false, multilingual: false, quality: 'excellent' },
    'imagen-4': { inVideoSupport: true, overlaySupport: false, multilingual: false, quality: 'good' },
    'imagen-4-fast': { inVideoSupport: true, overlaySupport: false, multilingual: false, quality: 'good' },
    'imagen-4-ultra': { inVideoSupport: true, overlaySupport: false, multilingual: false, quality: 'excellent' },
    'seedance-1.0': { inVideoSupport: true, overlaySupport: true, multilingual: false, quality: 'fair' },
    'veo-3': { inVideoSupport: true, overlaySupport: true, multilingual: true, quality: 'excellent' },
    'kling-2.1': { inVideoSupport: true, overlaySupport: true, multilingual: true, quality: 'excellent' },
    'hailuo-02': { inVideoSupport: true, overlaySupport: false, multilingual: true, quality: 'good' }
  }

  const capabilities = modelTextCapabilities[selectedModel.name.toLowerCase().replace(/\s/g, '-')] || 
                      { inVideoSupport: true, overlaySupport: false, multilingual: false, quality: 'fair' }

  let enhancedPrompt = baseResult.primary_prompt
  let negativePrompt = baseResult.negative_prompt
  const textInstructions: string[] = []
  const textWarnings: string[] = []

  // Process text elements
  const overlayElements = textElements.filter(el => el.type === 'overlay')
  const inVideoElements = textElements.filter(el => el.type === 'in-video')

  // Handle in-video text
  if (inVideoElements.length > 0) {
    if (capabilities.inVideoSupport) {
      const textDescriptions = inVideoElements.map(text => {
        const contextDesc = getContextDescription(text.context || 'custom')
        return `${contextDesc} displaying "${text.text}"`
      })
      
      enhancedPrompt += `, ${textDescriptions.join(', ')}`
      textInstructions.push(...textDescriptions)
      
      // Add quality modifiers
      if (capabilities.quality === 'excellent') {
        enhancedPrompt += ', crisp readable text, professional typography'
      }
      
      // Add negative prompts for text quality
      negativePrompt += ', blurry text, unreadable text, garbled text'
    } else {
      textWarnings.push(`Model ${selectedModel.name} may not support in-video text generation`)
    }
  }

  // Handle overlay text
  if (overlayElements.length > 0) {
    if (capabilities.overlaySupport) {
      textInstructions.push('Overlay text will be processed separately for video editing')
      // For video models that support overlays, we can hint at text placement
      if (selectedModel.type === 'video' || selectedModel.type === 'video-audio') {
        const overlayHints = overlayElements.map(overlay => {
          const pos = getPositionHint(overlay.position?.anchor || 'center')
          return `space for text overlay ${pos}`
        })
        enhancedPrompt += `, ${overlayHints.join(', ')}`
      }
    } else {
      // Convert overlays to in-video text descriptions for models that don't support overlays
      const overlayAsInVideo = overlayElements.map(overlay => {
        const pos = getPositionHint(overlay.position?.anchor || 'center')
        return `text "${overlay.text}" visible ${pos}`
      })
      enhancedPrompt += `, ${overlayAsInVideo.join(', ')}`
      textWarnings.push('Overlay text converted to in-video text for this model')
    }
  }

  // Check for non-Latin characters
  const hasNonLatin = textElements.some(el => /[^\u0000-\u007F]/.test(el.text))
  if (hasNonLatin && !capabilities.multilingual) {
    textWarnings.push('Model may have issues with non-Latin characters. Consider Qwen Image, Veo 3, or Kling 2.1 for multilingual text.')
  }

  // Model-specific text optimizations
  if (selectedModel.name.includes('Ideogram')) {
    enhancedPrompt += ', typography excellence, perfect text rendering'
  } else if (selectedModel.name.includes('Qwen')) {
    enhancedPrompt += ', bilingual text support, complex typography'
  } else if (selectedModel.name.includes('Veo')) {
    enhancedPrompt += ', professional text integration, readable typography'
  }

  return {
    primary_prompt: enhancedPrompt,
    negative_prompt: negativePrompt,
    model_specific_params: {
      ...baseResult.model_specific_params,
      text_elements: textElements.length,
      overlay_count: overlayElements.length,
      in_video_text_count: inVideoElements.length
    },
    text_instructions: textInstructions,
    text_warnings: textWarnings,
    media_insights: mediaInsights,
    ...(baseResult.context_insights && { context_insights: baseResult.context_insights })
  }
}

function getContextDescription(context: string): string {
  const descriptions: Record<string, string> = {
    'sign': 'a visible sign or signage',
    'screen': 'a digital screen or monitor',
    'paper': 'paper or document',
    'billboard': 'a large billboard or advertisement',
    'book': 'an open book or magazine',
    'laptop': 'a laptop or computer screen',
    'phone': 'a smartphone or mobile device screen',
    'custom': 'visible text element'
  }
  return descriptions[context] || descriptions.custom
}

function getPositionHint(anchor: string): string {
  const positions: Record<string, string> = {
    'top-left': 'in the top left area',
    'top-center': 'at the top center',
    'top-right': 'in the top right area',
    'center-left': 'on the left side',
    'center': 'in the center',
    'center-right': 'on the right side', 
    'bottom-left': 'in the bottom left area',
    'bottom-center': 'at the bottom center',
    'bottom-right': 'in the bottom right area'
  }
  return positions[anchor] || 'positioned appropriately'
}

function processMediaDescriptions(
  mediaAssets: MediaAsset[],
  outputType: string
): {
  promptAdditions: string[]
  negativePrompts: string[]
  insights: string[]
} {
  const promptAdditions: string[] = []
  const negativePrompts: string[] = []
  const insights: string[] = []

  for (const asset of mediaAssets) {
    if (!asset.description) continue

    const desc = asset.description
    
    // Add user descriptions
    if (desc.userDescription) {
      const contextualizedDesc = contextualizeMediaDescription(
        desc.userDescription,
        desc.category,
        outputType
      )
      promptAdditions.push(contextualizedDesc)
      insights.push(`Using "${desc.category}" reference: ${desc.userDescription}`)
    }

    // Add AI analysis insights
    if (desc.aiAnalysis) {
      const aiInsights = extractAIMediaInsights(desc.aiAnalysis, desc.category)
      promptAdditions.push(...aiInsights.prompts)
      negativePrompts.push(...aiInsights.negatives)
      insights.push(`AI analysis: ${aiInsights.summary}`)
    }

    // Add category-specific enhancements
    const categoryEnhancements = getMediaCategoryEnhancements(desc.category, outputType)
    promptAdditions.push(...categoryEnhancements.prompts)
    
    // Add tags as keywords
    if (desc.tags && desc.tags.length > 0) {
      promptAdditions.push(...desc.tags)
      insights.push(`Tags applied: ${desc.tags.join(', ')}`)
    }
  }

  return {
    promptAdditions: Array.from(new Set(promptAdditions)), // Remove duplicates
    negativePrompts: Array.from(new Set(negativePrompts)),
    insights
  }
}

function contextualizeMediaDescription(
  description: string,
  category: string,
  outputType: string
): string {
  const isVideo = outputType.includes('video')
  
  switch (category) {
    case 'character':
      return isVideo 
        ? `featuring character similar to: ${description}`
        : `character reference: ${description}`
    case 'environment':
      return isVideo
        ? `set in environment like: ${description}`
        : `environment reference: ${description}`
    case 'style':
      return `in the style of: ${description}`
    case 'object':
      return `featuring object: ${description}`
    case 'reference':
      return `inspired by reference: ${description}`
    default:
      return `reference material: ${description}`
  }
}

function extractAIMediaInsights(
  aiAnalysis: any,
  category: string
): {
  prompts: string[]
  negatives: string[]
  summary: string
} {
  const prompts: string[] = []
  const negatives: string[] = []
  
  if (aiAnalysis.visual) {
    if (aiAnalysis.visual.style && aiAnalysis.visual.style !== 'unknown') {
      prompts.push(`${aiAnalysis.visual.style} style`)
    }
    if (aiAnalysis.visual.mood && aiAnalysis.visual.mood !== 'neutral') {
      prompts.push(`${aiAnalysis.visual.mood} mood`)
    }
    if (aiAnalysis.visual.lighting && aiAnalysis.visual.lighting !== 'unknown') {
      prompts.push(`${aiAnalysis.visual.lighting}`)
    }
  }

  if (aiAnalysis.content) {
    if (category === 'environment' && aiAnalysis.content.setting) {
      prompts.push(`${aiAnalysis.content.setting} setting`)
    }
    if (aiAnalysis.content.subjects && aiAnalysis.content.subjects.length > 0) {
      prompts.push(...aiAnalysis.content.subjects)
    }
  }

  if (aiAnalysis.technical?.quality === 'low') {
    negatives.push('low quality', 'blurry', 'pixelated')
  }

  const summary = `${aiAnalysis.visual?.style || 'style'} with ${aiAnalysis.visual?.mood || 'neutral'} mood`
  
  return { prompts, negatives, summary }
}

function getMediaCategoryEnhancements(
  category: string,
  outputType: string
): {
  prompts: string[]
} {
  const prompts: string[] = []
  const isVideo = outputType.includes('video')

  switch (category) {
    case 'character':
      prompts.push('character consistency')
      if (isVideo) prompts.push('same character throughout')
      break
    case 'environment':
      prompts.push('environmental consistency')
      if (isVideo) prompts.push('consistent setting')
      break
    case 'style':
      prompts.push('style consistency', 'aesthetic reference')
      break
    case 'object':
      prompts.push('object reference', 'design consistency')
      break
  }

  return { prompts }
}

function generateNegativePrompt(config: EnhancementConfig, model: ModelConfig): string {
  const baseNegative = [
    'low quality',
    'blurry',
    'distorted',
    'artifacts',
    'watermark'
  ]

  // Platform-specific negative prompts
  const platformNegatives: Record<string, string[]> = {
    instagram: ['inappropriate content', 'low engagement'],
    tiktok: ['static', 'boring', 'slow'],
    youtube: ['unprofessional', 'poor audio'],
    linkedin: ['casual', 'unprofessional', 'inappropriate'],
    general: []
  }

  // Model-specific negative prompts
  if (model.type === 'video' || model.type === 'video-audio') {
    baseNegative.push('choppy motion', 'frame drops', 'inconsistent')
  }

  const combined = [
    ...baseNegative,
    ...(platformNegatives[config.platform] || [])
  ]

  return combined.join(', ')
}

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