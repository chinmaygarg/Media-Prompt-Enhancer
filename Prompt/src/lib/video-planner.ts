// Advanced Video Scene Planning System
// Handles multi-clip video generation with visual consistency

export interface VideoScene {
  clipNumber: number
  duration: number  
  primaryFocus: 'character' | 'product' | 'environment' | 'action' | 'text'
  secondaryElements: string[]
  cameraMovement: 'static' | 'pan' | 'zoom' | 'dolly' | 'tracking'
  composition: 'close-up' | 'medium' | 'wide' | 'extreme-close' | 'establishing'
  textElements?: InVideoText[]
  transitionTo?: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom-in' | 'zoom-out'
  consistencyAnchors: ConsistencyAnchors
  mood?: 'dramatic' | 'peaceful' | 'energetic' | 'mysterious' | 'joyful'
  lighting?: 'natural' | 'dramatic' | 'soft' | 'harsh' | 'golden-hour' | 'blue-hour'
}

export interface InVideoText {
  content: string
  placement: 'sign' | 'screen' | 'document' | 'product_label' | 'overlay' | 'subtitle'
  readability: 'high' | 'medium' | 'stylistic'
  language: 'english' | 'spanish' | 'french' | 'multilingual'
  timing: {
    start: number // seconds into clip
    end: number   // seconds into clip
  }
  style: {
    font?: string
    size?: 'small' | 'medium' | 'large' | 'xl'
    color?: string
    background?: boolean
    animation?: 'static' | 'fadeIn' | 'slideUp' | 'typewriter'
  }
}

export interface ConsistencyAnchors {
  character?: string  // "same person, blue eyes, brown hair, professional attire"
  environment?: string // "same office setting, warm natural lighting from left"
  style?: string      // "professional, clean, corporate aesthetic"
  colorPalette?: string[] // ["#FF6B35", "#F7931E", "#FFD23F"]
  brandElements?: string // "company logo visible, consistent branding"
}

export interface ModelCapabilities {
  name: string
  type: 'image' | 'video' | 'video-audio'
  costPerSecond?: number
  costPerImage?: number
  maxDuration: number
  minDuration: number
  qualityTier: 'draft' | 'social' | 'production'
  
  // Text handling capabilities
  textQuality: 'poor' | 'good' | 'excellent'
  supportedLanguages: string[]
  maxTextLength: number
  textPlacement: ('sign' | 'screen' | 'document' | 'product_label')[]
  
  // Consistency capabilities  
  characterConsistency: 'poor' | 'good' | 'excellent'
  styleConsistency: 'poor' | 'good' | 'excellent'
  colorConsistency: 'poor' | 'good' | 'excellent'
  environmentConsistency: 'poor' | 'good' | 'excellent'
  
  // Multi-clip support
  supportsReferenceFrames: boolean
  maxConsistentClips: number
  optimalClipsPerModel: number
  
  // Technical specifications
  maxResolution: '480p' | '720p' | '1080p' | '1440p' | '2160p'
  supportedAspectRatios: ('1:1' | '9:16' | '16:9' | '4:5')[]
  frameRates: ('24' | '30' | '60')[]
}

// Enhanced model configurations with advanced capabilities
export const ENHANCED_MODEL_CONFIGS: Record<string, ModelCapabilities> = {
  'veo-3': {
    name: 'Veo 3',
    type: 'video-audio',
    costPerSecond: 0.12,
    maxDuration: 8,
    minDuration: 2,
    qualityTier: 'production',
    
    // Text capabilities
    textQuality: 'excellent',
    supportedLanguages: ['english', 'spanish', 'french'],
    maxTextLength: 200,
    textPlacement: ['sign', 'screen', 'document', 'product_label'],
    
    // Consistency capabilities
    characterConsistency: 'excellent',
    styleConsistency: 'excellent', 
    colorConsistency: 'excellent',
    environmentConsistency: 'excellent',
    
    // Multi-clip support
    supportsReferenceFrames: true,
    maxConsistentClips: 6,
    optimalClipsPerModel: 4,
    
    // Technical specs
    maxResolution: '2160p',
    supportedAspectRatios: ['1:1', '9:16', '16:9', '4:5'],
    frameRates: ['24', '30', '60']
  },
  
  'runway-gen4': {
    name: 'Runway Gen-4',
    type: 'video',
    costPerSecond: 0.16,
    maxDuration: 10,
    minDuration: 2,
    qualityTier: 'production',
    
    // Text capabilities  
    textQuality: 'good',
    supportedLanguages: ['english'],
    maxTextLength: 100,
    textPlacement: ['sign', 'screen'],
    
    // Consistency capabilities
    characterConsistency: 'excellent',
    styleConsistency: 'excellent',
    colorConsistency: 'excellent', 
    environmentConsistency: 'excellent',
    
    // Multi-clip support
    supportsReferenceFrames: true,
    maxConsistentClips: 8,
    optimalClipsPerModel: 5,
    
    // Technical specs
    maxResolution: '1080p',
    supportedAspectRatios: ['9:16', '16:9', '1:1'],
    frameRates: ['24', '30']
  },
  
  'runway-gen4-turbo': {
    name: 'Runway Gen-4 Turbo',
    type: 'video',
    costPerSecond: 0.067,
    maxDuration: 10,
    minDuration: 2,
    qualityTier: 'production',
    
    // Text capabilities
    textQuality: 'good',
    supportedLanguages: ['english'],
    maxTextLength: 80,
    textPlacement: ['sign', 'screen'],
    
    // Consistency capabilities
    characterConsistency: 'excellent',
    styleConsistency: 'good',
    colorConsistency: 'excellent',
    environmentConsistency: 'good',
    
    // Multi-clip support
    supportsReferenceFrames: true,
    maxConsistentClips: 6,
    optimalClipsPerModel: 4,
    
    // Technical specs
    maxResolution: '1080p',
    supportedAspectRatios: ['9:16', '16:9', '1:1'],
    frameRates: ['24', '30']
  },

  'kling-2.1': {
    name: 'Kling 2.1 Master',
    type: 'video',
    costPerSecond: 0.25,
    maxDuration: 10,
    minDuration: 3,
    qualityTier: 'production',
    
    // Text capabilities  
    textQuality: 'good',
    supportedLanguages: ['english'],
    maxTextLength: 100,
    textPlacement: ['sign', 'screen'],
    
    // Consistency capabilities
    characterConsistency: 'excellent',
    styleConsistency: 'good',
    colorConsistency: 'excellent', 
    environmentConsistency: 'good',
    
    // Multi-clip support
    supportsReferenceFrames: true,
    maxConsistentClips: 4,
    optimalClipsPerModel: 3,
    
    // Technical specs
    maxResolution: '1080p',
    supportedAspectRatios: ['9:16', '16:9'],
    frameRates: ['24', '30']
  },
  
  'wan-2.2-t2v-1080p': {
    name: 'Wan 2.2 T2V 1080p',
    type: 'video',
    costPerSecond: 0.10,
    maxDuration: 5,
    minDuration: 2,
    qualityTier: 'social',
    
    // Text capabilities
    textQuality: 'good',
    supportedLanguages: ['english', 'spanish'],
    maxTextLength: 60,
    textPlacement: ['sign', 'screen'],
    
    // Consistency capabilities
    characterConsistency: 'good',
    styleConsistency: 'good',
    colorConsistency: 'good',
    environmentConsistency: 'good',
    
    // Multi-clip support  
    supportsReferenceFrames: false,
    maxConsistentClips: 3,
    optimalClipsPerModel: 2,
    
    // Technical specs
    maxResolution: '1080p',
    supportedAspectRatios: ['9:16', '16:9', '1:1'],
    frameRates: ['30']
  },

  'wan-2.2-t2v': {
    name: 'Wan 2.2 Text-to-Video',
    type: 'video',
    costPerSecond: 0.02,
    maxDuration: 5,
    minDuration: 2,
    qualityTier: 'draft',
    
    // Text capabilities
    textQuality: 'poor', // Recommend overlays instead
    supportedLanguages: [],
    maxTextLength: 0,
    textPlacement: [],
    
    // Consistency capabilities
    characterConsistency: 'good',
    styleConsistency: 'good',
    colorConsistency: 'good',
    environmentConsistency: 'poor',
    
    // Multi-clip support  
    supportsReferenceFrames: false,
    maxConsistentClips: 2,
    optimalClipsPerModel: 2,
    
    // Technical specs
    maxResolution: '720p',
    supportedAspectRatios: ['9:16', '16:9'],
    frameRates: ['30']
  }
}

/**
 * Plans optimal video scenes based on total duration and model capabilities
 */
export function planVideoScenes(
  totalDuration: number,
  basePrompt: string,
  selectedModel: ModelCapabilities,
  config: {
    platform: string
    style?: string
    primaryFocus?: VideoScene['primaryFocus']
    textElements?: InVideoText[]
    consistencyRequirements?: Partial<ConsistencyAnchors>
  }
): VideoScene[] {
  const { maxDuration } = selectedModel
  const optimalClipLength = Math.min(maxDuration, Math.max(selectedModel.minDuration, 5))
  
  // If total duration fits in one clip, return single scene
  if (totalDuration <= maxDuration) {
    return createSingleScene(totalDuration, basePrompt, selectedModel, config)
  }

  // Calculate optimal number of clips
  const idealClips = Math.ceil(totalDuration / optimalClipLength)
  const actualClips = Math.min(idealClips, selectedModel.maxConsistentClips)
  const clipDuration = Math.floor(totalDuration / actualClips)
  const lastClipDuration = totalDuration - (clipDuration * (actualClips - 1))

  const scenes: VideoScene[] = []
  const transitions = ['cut', 'fade', 'dissolve', 'wipe'] as const
  const compositions = ['wide', 'medium', 'close-up', 'wide', 'medium'] as const
  const cameraMovements = ['static', 'pan', 'zoom', 'dolly', 'tracking'] as const

  for (let i = 0; i < actualClips; i++) {
    const isFirst = i === 0
    const isLast = i === actualClips - 1
    const duration = isLast ? lastClipDuration : clipDuration
    
    // Determine scene role
    let sceneRole: 'opening' | 'development' | 'climax' | 'closing'
    if (isFirst) sceneRole = 'opening'
    else if (isLast) sceneRole = 'closing'  
    else if (i === Math.floor(actualClips * 0.7)) sceneRole = 'climax'
    else sceneRole = 'development'

    const scene: VideoScene = {
      clipNumber: i + 1,
      duration,
      primaryFocus: config.primaryFocus || determinePrimaryFocus(sceneRole, basePrompt),
      secondaryElements: generateSecondaryElements(sceneRole, basePrompt, config),
      cameraMovement: cameraMovements[i % cameraMovements.length],
      composition: compositions[i % compositions.length],
      transitionTo: isFirst ? undefined : transitions[i % transitions.length],
      consistencyAnchors: buildConsistencyAnchors(config, isFirst),
      mood: determineMood(sceneRole, config.style),
      lighting: determineLighting(sceneRole, config.platform),
      textElements: distributeTextElements(config.textElements, i, actualClips)
    }

    scenes.push(scene)
  }

  return scenes
}

function createSingleScene(
  duration: number,
  basePrompt: string, 
  selectedModel: ModelCapabilities,
  config: any
): VideoScene[] {
  return [{
    clipNumber: 1,
    duration,
    primaryFocus: config.primaryFocus || 'environment',
    secondaryElements: [basePrompt],
    cameraMovement: 'static',
    composition: 'medium',
    consistencyAnchors: buildConsistencyAnchors(config, true),
    mood: determineMood('opening', config.style),
    lighting: determineLighting('opening', config.platform),
    textElements: config.textElements || []
  }]
}

function determinePrimaryFocus(sceneRole: string, basePrompt: string): VideoScene['primaryFocus'] {
  // Analyze prompt content for focus hints
  const prompt = basePrompt.toLowerCase()
  
  if (prompt.includes('person') || prompt.includes('character') || prompt.includes('man') || prompt.includes('woman')) {
    return 'character'
  }
  if (prompt.includes('product') || prompt.includes('item') || prompt.includes('object')) {
    return 'product'
  }
  if (prompt.includes('text') || prompt.includes('sign') || prompt.includes('title')) {
    return 'text'
  }
  if (prompt.includes('action') || prompt.includes('movement') || prompt.includes('running') || prompt.includes('dancing')) {
    return 'action'
  }
  
  // Default based on scene role
  switch (sceneRole) {
    case 'opening': return 'environment'
    case 'climax': return 'action'
    case 'closing': return 'character'
    default: return 'environment'
  }
}

function generateSecondaryElements(sceneRole: string, basePrompt: string, config: any): string[] {
  const elements: string[] = []
  
  // Add consistency requirements
  if (config.consistencyRequirements?.character) {
    elements.push('consistent character appearance')
  }
  if (config.consistencyRequirements?.environment) {
    elements.push('same environmental setting')
  }
  
  // Scene-specific elements
  switch (sceneRole) {
    case 'opening':
      elements.push('establishing atmosphere', 'clear composition')
      break
    case 'development':
      elements.push('narrative progression', 'visual interest')
      break
    case 'climax':
      elements.push('dynamic energy', 'emotional peak')
      break
    case 'closing':
      elements.push('satisfying resolution', 'memorable ending')
      break
  }
  
  return elements
}

function buildConsistencyAnchors(config: any, isFirst: boolean): ConsistencyAnchors {
  const anchors: ConsistencyAnchors = {}
  
  if (config.consistencyRequirements) {
    if (config.consistencyRequirements.character) {
      anchors.character = isFirst 
        ? config.consistencyRequirements.character
        : `maintain ${config.consistencyRequirements.character}`
    }
    
    if (config.consistencyRequirements.environment) {
      anchors.environment = isFirst
        ? config.consistencyRequirements.environment  
        : `consistent with ${config.consistencyRequirements.environment}`
    }
    
    if (config.consistencyRequirements.style) {
      anchors.style = config.consistencyRequirements.style
    }
    
    if (config.consistencyRequirements.colorPalette) {
      anchors.colorPalette = config.consistencyRequirements.colorPalette
    }
  }
  
  // Default professional consistency
  if (!anchors.style && config.platform === 'linkedin') {
    anchors.style = 'professional, clean, corporate aesthetic'
  }
  
  return anchors
}

function determineMood(sceneRole: string, style?: string): VideoScene['mood'] {
  if (style) {
    if (style.includes('dramatic') || style.includes('cinematic')) return 'dramatic'
    if (style.includes('peaceful') || style.includes('calm')) return 'peaceful'
    if (style.includes('energetic') || style.includes('dynamic')) return 'energetic'
    if (style.includes('mysterious') || style.includes('dark')) return 'mysterious'
    if (style.includes('joyful') || style.includes('happy')) return 'joyful'
  }
  
  // Default based on scene role
  switch (sceneRole) {
    case 'opening': return 'peaceful'
    case 'climax': return 'dramatic'
    case 'closing': return 'joyful'
    default: return 'energetic'
  }
}

function determineLighting(sceneRole: string, platform: string): VideoScene['lighting'] {
  // Platform-specific lighting preferences
  switch (platform) {
    case 'instagram':
    case 'tiktok':
      return 'natural'
    case 'youtube':
      return 'dramatic'
    case 'linkedin':
      return 'soft'
    default:
      return sceneRole === 'climax' ? 'dramatic' : 'natural'
  }
}

function distributeTextElements(textElements: InVideoText[] = [], clipIndex: number, totalClips: number): InVideoText[] {
  if (!textElements.length) return []
  
  // Distribute text elements across clips
  return textElements.filter((_, index) => {
    const assignedClip = index % totalClips
    return assignedClip === clipIndex
  })
}

/**
 * Generates consistent prompts for each scene
 */
export function generateConsistentPrompts(
  scenes: VideoScene[],
  basePrompt: string,
  selectedModel: ModelCapabilities
): Array<{
  clipNumber: number
  prompt: string
  duration: number
  transition: string
  metadata: {
    focus: string
    composition: string
    mood: string
    textOptimization?: string
  }
}> {
  return scenes.map((scene, index) => {
    const isFirst = index === 0
    let prompt = basePrompt
    
    // Add scene-specific enhancements
    prompt += `, ${scene.composition} shot`
    prompt += `, ${scene.cameraMovement} camera movement`
    
    if (scene.mood) {
      prompt += `, ${scene.mood} mood`
    }
    
    if (scene.lighting) {
      prompt += `, ${scene.lighting} lighting`
    }
    
    // Add consistency anchors
    if (scene.consistencyAnchors.character) {
      prompt += `, ${scene.consistencyAnchors.character}`
    }
    
    if (scene.consistencyAnchors.environment) {
      prompt += `, ${scene.consistencyAnchors.environment}`
    }
    
    if (scene.consistencyAnchors.style) {
      prompt += `, ${scene.consistencyAnchors.style}`
    }
    
    // Add primary focus
    prompt += `, focus on ${scene.primaryFocus}`
    
    // Add secondary elements
    if (scene.secondaryElements.length) {
      prompt += `, ${scene.secondaryElements.join(', ')}`
    }
    
    // Add continuity for non-first scenes
    if (!isFirst) {
      prompt += `, maintain visual consistency with previous clip`
      if (scene.transitionTo) {
        prompt += `, smooth ${scene.transitionTo} transition from previous scene`
      }
    }
    
    // Handle text elements
    let textOptimization = ''
    if (scene.textElements && scene.textElements.length > 0) {
      textOptimization = optimizeTextForModel(scene.textElements, selectedModel)
      if (textOptimization) {
        prompt += `, ${textOptimization}`
      }
    }
    
    return {
      clipNumber: scene.clipNumber,
      prompt,
      duration: scene.duration,
      transition: scene.transitionTo || 'none',
      metadata: {
        focus: scene.primaryFocus,
        composition: scene.composition,
        mood: scene.mood || 'neutral',
        textOptimization: textOptimization || undefined
      }
    }
  })
}

function optimizeTextForModel(textElements: InVideoText[], model: ModelCapabilities): string {
  if (!textElements.length) return ''
  
  let optimization = ""
  
  for (const text of textElements) {
    if (model.textQuality === 'excellent') {
      // Can handle complex text scenarios
      optimization += `"${text.content}" text clearly visible on ${text.placement}, `
      optimization += `${text.readability} readability, sharp typography, `
      optimization += `high contrast, professional text rendering, `
      
    } else if (model.textQuality === 'good') {
      // Needs simpler, clearer text
      optimization += `"${text.content}" in bold clear font on ${text.placement}, `
      optimization += `high contrast, simple typography, easy to read, `
      
    } else {
      // Poor text quality - recommend overlays
      optimization += `avoid complex text in scene, use post-generation overlay instead, `
    }
  }
  
  return optimization.trim().replace(/,\s*$/, '')
}

/**
 * Calculates total cost for multi-clip video generation
 */
export function calculateMultiClipCost(scenes: VideoScene[], selectedModel: ModelCapabilities): {
  totalCost: number
  costBreakdown: Array<{
    clip: number
    duration: number
    cost: number
  }>
  estimatedGenerationTime: string
} {
  const costBreakdown = scenes.map(scene => ({
    clip: scene.clipNumber,
    duration: scene.duration,
    cost: (selectedModel.costPerSecond || 0) * scene.duration
  }))
  
  const totalCost = costBreakdown.reduce((sum, clip) => sum + clip.cost, 0)
  
  // Estimate generation time (roughly 30-60 seconds per clip)
  const avgTimePerClip = 45
  const totalMinutes = Math.ceil(scenes.length * avgTimePerClip / 60)
  const estimatedGenerationTime = totalMinutes === 1 ? '~1 minute' : `~${totalMinutes} minutes`
  
  return {
    totalCost,
    costBreakdown,
    estimatedGenerationTime
  }
}