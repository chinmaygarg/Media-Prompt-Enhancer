// Media Description Engine
// Manages user descriptions and AI analysis for media files

export interface MediaDescription {
  id: string
  mediaAssetId: string
  userDescription?: string
  aiAnalysis?: AIAnalysis
  tags: string[]
  category: 'character' | 'environment' | 'object' | 'style' | 'reference' | 'general'
  metadata: {
    createdAt: string
    lastUpdated: string
    aiAnalysisEnabled: boolean
    aiAnalysisCost?: number
  }
}

export interface AIAnalysis {
  visual: {
    colors: string[] // dominant colors
    composition: string // rule of thirds, centered, etc.
    lighting: string // natural, studio, dramatic, etc.
    style: string // photographic, artistic, minimalist, etc.
    mood: string // happy, serious, energetic, etc.
  }
  content: {
    subjects: string[] // person, car, building, etc.
    setting: string // indoor, outdoor, studio, etc.
    actions: string[] // running, sitting, flying, etc.
    objects: string[] // table, phone, tree, etc.
  }
  technical: {
    quality: 'low' | 'medium' | 'high' | 'professional'
    resolution: string
    aspectRatio: string
    estimatedQuality: number // 0-100
  }
  recommendations: {
    bestUseCase: string[] // reference image, style guide, character consistency, etc.
    promptSuggestions: string[]
    compatibleModels: string[]
  }
  confidence: number // 0-100, AI confidence in analysis
}

// Cost structure for AI analysis
export const AI_ANALYSIS_COSTS = {
  'basic': 0.002, // Basic visual analysis
  'detailed': 0.008, // Detailed content analysis
  'premium': 0.015  // Full analysis with recommendations
} as const

export type AnalysisLevel = keyof typeof AI_ANALYSIS_COSTS

/**
 * Creates a media description entry
 */
export function createMediaDescription(
  mediaAssetId: string,
  userDescription?: string,
  category: MediaDescription['category'] = 'general',
  tags: string[] = []
): MediaDescription {
  return {
    id: `desc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mediaAssetId,
    userDescription,
    tags,
    category,
    metadata: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      aiAnalysisEnabled: false
    }
  }
}

/**
 * Updates user description for a media asset
 */
export function updateMediaDescription(
  description: MediaDescription,
  updates: {
    userDescription?: string
    tags?: string[]
    category?: MediaDescription['category']
  }
): MediaDescription {
  return {
    ...description,
    ...updates,
    metadata: {
      ...description.metadata,
      lastUpdated: new Date().toISOString()
    }
  }
}

/**
 * Generates prompt enhancement text from media descriptions
 */
export function generateMediaPromptEnhancements(
  descriptions: MediaDescription[],
  context: 'style-reference' | 'character-consistency' | 'environment-reference' | 'general-reference'
): {
  promptAdditions: string[]
  styleModifiers: string[]
  negativePrompts: string[]
  instructions: string[]
} {
  const promptAdditions: string[] = []
  const styleModifiers: string[] = []
  const negativePrompts: string[] = []
  const instructions: string[] = []

  for (const desc of descriptions) {
    // Add user descriptions
    if (desc.userDescription) {
      const contextualDescription = contextualizeDescription(desc.userDescription, context, desc.category)
      promptAdditions.push(contextualDescription)
    }

    // Add AI analysis insights
    if (desc.aiAnalysis) {
      const aiEnhancements = extractAIEnhancements(desc.aiAnalysis, context, desc.category)
      promptAdditions.push(...aiEnhancements.prompts)
      styleModifiers.push(...aiEnhancements.styles)
      negativePrompts.push(...aiEnhancements.negatives)
    }

    // Add category-specific enhancements
    const categoryEnhancements = getCategoryEnhancements(desc.category, context)
    promptAdditions.push(...categoryEnhancements.prompts)
    instructions.push(...categoryEnhancements.instructions)
  }

  return {
    promptAdditions: Array.from(new Set(promptAdditions)), // Remove duplicates
    styleModifiers: Array.from(new Set(styleModifiers)),
    negativePrompts: Array.from(new Set(negativePrompts)),
    instructions
  }
}

function contextualizeDescription(
  description: string,
  context: string,
  category: MediaDescription['category']
): string {
  const contextPrefixes = {
    'style-reference': 'in the style of',
    'character-consistency': 'featuring the same character as',
    'environment-reference': 'in a similar environment to',
    'general-reference': 'similar to'
  }

  const categoryModifiers = {
    'character': 'character',
    'environment': 'setting',
    'object': 'object',
    'style': 'artistic style',
    'reference': 'reference',
    'general': 'content'
  }

  const prefix = (contextPrefixes as any)[context] || contextPrefixes['general-reference']
  const modifier = (categoryModifiers as any)[category]

  return `${prefix} the ${modifier}: ${description}`
}

function extractAIEnhancements(
  analysis: AIAnalysis,
  context: string,
  category: MediaDescription['category']
): {
  prompts: string[]
  styles: string[]
  negatives: string[]
} {
  const prompts: string[] = []
  const styles: string[] = []
  const negatives: string[] = []

  // Visual enhancements
  if (analysis.visual.lighting !== 'unknown') {
    prompts.push(`${analysis.visual.lighting} lighting`)
  }

  if (analysis.visual.composition !== 'unknown') {
    styles.push(`${analysis.visual.composition} composition`)
  }

  if (analysis.visual.mood !== 'neutral') {
    prompts.push(`${analysis.visual.mood} mood`)
  }

  // Content enhancements
  if (context === 'character-consistency' && analysis.content.subjects.length > 0) {
    prompts.push(...analysis.content.subjects.map(subject => `consistent ${subject}`))
  }

  if (context === 'environment-reference' && analysis.content.setting !== 'unknown') {
    prompts.push(`${analysis.content.setting} setting`)
  }

  // Quality-based negatives
  if (analysis.technical.quality === 'low') {
    negatives.push('low quality', 'blurry', 'pixelated')
  }

  // Style enhancements
  if (analysis.visual.style !== 'unknown') {
    styles.push(`${analysis.visual.style} style`)
  }

  return { prompts, styles, negatives }
}

function getCategoryEnhancements(
  category: MediaDescription['category'],
  context: string
): {
  prompts: string[]
  instructions: string[]
} {
  const prompts: string[] = []
  const instructions: string[] = []

  switch (category) {
    case 'character':
      if (context === 'character-consistency') {
        prompts.push('same character', 'consistent appearance', 'character continuity')
        instructions.push('Use this reference to maintain character consistency across scenes')
      }
      break

    case 'environment':
      if (context === 'environment-reference') {
        prompts.push('similar environment', 'consistent setting', 'matching atmosphere')
        instructions.push('Use this reference to create a similar environmental setting')
      }
      break

    case 'style':
      if (context === 'style-reference') {
        prompts.push('same artistic style', 'consistent aesthetic', 'matching visual approach')
        instructions.push('Apply the visual style and aesthetic from this reference')
      }
      break

    case 'object':
      prompts.push('similar object', 'consistent design')
      instructions.push('Reference this object for design consistency')
      break

    case 'reference':
      prompts.push('reference-based', 'inspired by reference')
      instructions.push('Use as general creative reference')
      break

    default:
      // general category
      instructions.push('Use as additional context for generation')
      break
  }

  return { prompts, instructions }
}

/**
 * Simulates AI analysis of media (placeholder for actual AI integration)
 */
export async function simulateAIAnalysis(
  mediaAsset: any,
  level: AnalysisLevel = 'basic'
): Promise<{
  analysis: AIAnalysis
  cost: number
}> {
  // This would integrate with actual AI vision models in production
  // For now, we'll simulate analysis based on file type and name
  
  const cost = AI_ANALYSIS_COSTS[level]
  
  const analysis: AIAnalysis = {
    visual: {
      colors: ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#118AB2'],
      composition: inferComposition(mediaAsset.filename),
      lighting: inferLighting(mediaAsset.filename),
      style: inferStyle(mediaAsset.filename),
      mood: inferMood(mediaAsset.filename)
    },
    content: {
      subjects: inferSubjects(mediaAsset.filename),
      setting: inferSetting(mediaAsset.filename),
      actions: inferActions(mediaAsset.filename),
      objects: inferObjects(mediaAsset.filename)
    },
    technical: {
      quality: inferQuality(mediaAsset.file_size_bytes),
      resolution: '1920x1080', // Would be detected from actual file
      aspectRatio: '16:9',
      estimatedQuality: Math.floor(Math.random() * 40) + 60 // 60-100
    },
    recommendations: generateRecommendations(mediaAsset, level),
    confidence: level === 'basic' ? 75 : level === 'detailed' ? 85 : 95
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  return { analysis, cost }
}

function inferComposition(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('portrait') || lower.includes('headshot')) return 'portrait'
  if (lower.includes('landscape') || lower.includes('wide')) return 'landscape'
  if (lower.includes('center')) return 'centered'
  return 'balanced'
}

function inferLighting(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('studio')) return 'studio lighting'
  if (lower.includes('natural') || lower.includes('outdoor')) return 'natural lighting'
  if (lower.includes('dramatic')) return 'dramatic lighting'
  if (lower.includes('soft')) return 'soft lighting'
  return 'balanced lighting'
}

function inferStyle(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('photo')) return 'photographic'
  if (lower.includes('art') || lower.includes('painting')) return 'artistic'
  if (lower.includes('minimal')) return 'minimalist'
  if (lower.includes('professional')) return 'professional'
  return 'realistic'
}

function inferMood(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('happy') || lower.includes('bright')) return 'upbeat'
  if (lower.includes('serious') || lower.includes('professional')) return 'serious'
  if (lower.includes('dramatic')) return 'dramatic'
  if (lower.includes('calm')) return 'peaceful'
  return 'neutral'
}

function inferSubjects(filename: string): string[] {
  const lower = filename.toLowerCase()
  const subjects: string[] = []
  
  if (lower.includes('person') || lower.includes('people')) subjects.push('person')
  if (lower.includes('car') || lower.includes('vehicle')) subjects.push('vehicle')
  if (lower.includes('building') || lower.includes('architecture')) subjects.push('building')
  if (lower.includes('nature') || lower.includes('landscape')) subjects.push('natural elements')
  if (lower.includes('product')) subjects.push('product')
  
  return subjects.length > 0 ? subjects : ['general subject']
}

function inferSetting(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('indoor') || lower.includes('interior')) return 'indoor'
  if (lower.includes('outdoor') || lower.includes('exterior')) return 'outdoor'
  if (lower.includes('studio')) return 'studio'
  if (lower.includes('office')) return 'office'
  return 'general setting'
}

function inferActions(filename: string): string[] {
  const lower = filename.toLowerCase()
  const actions: string[] = []
  
  if (lower.includes('running')) actions.push('running')
  if (lower.includes('sitting')) actions.push('sitting')
  if (lower.includes('standing')) actions.push('standing')
  if (lower.includes('working')) actions.push('working')
  
  return actions
}

function inferObjects(filename: string): string[] {
  const lower = filename.toLowerCase()
  const objects: string[] = []
  
  if (lower.includes('table')) objects.push('table')
  if (lower.includes('computer') || lower.includes('laptop')) objects.push('computer')
  if (lower.includes('phone')) objects.push('phone')
  if (lower.includes('book')) objects.push('book')
  
  return objects
}

function inferQuality(fileSize: number): AIAnalysis['technical']['quality'] {
  // Simple heuristic based on file size
  if (fileSize < 100000) return 'low' // < 100KB
  if (fileSize < 1000000) return 'medium' // < 1MB
  if (fileSize < 5000000) return 'high' // < 5MB
  return 'professional' // >= 5MB
}

function generateRecommendations(mediaAsset: any, level: AnalysisLevel): AIAnalysis['recommendations'] {
  const baseRecommendations = {
    bestUseCase: ['general reference'],
    promptSuggestions: ['high quality', 'detailed'],
    compatibleModels: ['qwen-image', 'ideogram-v3', 'imagen-4']
  }

  if (level === 'basic') return baseRecommendations

  // Enhanced recommendations for detailed/premium analysis
  const filename = mediaAsset.filename.toLowerCase()
  
  if (filename.includes('portrait') || filename.includes('person')) {
    baseRecommendations.bestUseCase.push('character consistency', 'portrait reference')
    baseRecommendations.promptSuggestions.push('professional portrait', 'character focus')
    baseRecommendations.compatibleModels.push('veo-3', 'kling-2.1')
  }

  if (filename.includes('landscape') || filename.includes('environment')) {
    baseRecommendations.bestUseCase.push('environment reference', 'setting guide')
    baseRecommendations.promptSuggestions.push('scenic view', 'environmental detail')
  }

  if (filename.includes('product')) {
    baseRecommendations.bestUseCase.push('product consistency', 'commercial reference')
    baseRecommendations.promptSuggestions.push('product photography', 'commercial quality')
  }

  return baseRecommendations
}

/**
 * Validates media description data
 */
export function validateMediaDescription(description: Partial<MediaDescription>): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!description.mediaAssetId) {
    errors.push('Media asset ID is required')
  }

  if (description.userDescription && description.userDescription.length > 500) {
    errors.push('User description must be 500 characters or less')
  }

  if (description.tags && description.tags.length > 10) {
    warnings.push('More than 10 tags may affect performance')
  }

  if (description.tags) {
    for (const tag of description.tags) {
      if (tag.length > 50) {
        errors.push(`Tag "${tag}" is too long (max 50 characters)`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Calculates total cost for AI analysis of multiple media assets
 */
export function calculateAnalysisCost(
  mediaAssets: any[],
  level: AnalysisLevel
): {
  totalCost: number
  perAssetCost: number
  breakdown: Array<{
    assetId: string
    filename: string
    cost: number
  }>
} {
  const perAssetCost = AI_ANALYSIS_COSTS[level]
  const breakdown = mediaAssets.map(asset => ({
    assetId: asset.id,
    filename: asset.filename,
    cost: perAssetCost
  }))

  return {
    totalCost: mediaAssets.length * perAssetCost,
    perAssetCost,
    breakdown
  }
}