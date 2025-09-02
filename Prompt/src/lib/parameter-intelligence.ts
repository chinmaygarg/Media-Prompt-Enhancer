// Parameter Intelligence Engine
// Automatically selects optimal parameters or provides manual override controls

export interface AutoParameterResult {
  modelRecommendation: ModelRecommendation
  platformOptimization: PlatformOptimization
  qualitySettings: QualitySettings
  costOptimization: CostOptimization
  confidenceScore: number
  reasoning: string[]
  alternativeOptions: AlternativeOption[]
}

export interface ModelRecommendation {
  primaryModel: string
  fallbackModels: string[]
  reason: string
  strengths: string[]
  limitations: string[]
  costRating: 'low' | 'medium' | 'high'
  qualityRating: 'good' | 'excellent' | 'premium'
}

export interface PlatformOptimization {
  recommendedAspectRatio: string
  recommendedDuration?: number
  styleKeywords: string[]
  technicalSpecs: {
    resolution: string
    frameRate?: number
    bitrate?: string
  }
  platformSpecificTips: string[]
}

export interface QualitySettings {
  recommendedTier: 'draft' | 'social' | 'production'
  processingPriority: 'speed' | 'balanced' | 'quality'
  enhancementLevel: 'minimal' | 'standard' | 'aggressive'
  postProcessing: string[]
}

export interface CostOptimization {
  estimatedCost: number
  budgetLevel: 'budget' | 'standard' | 'premium'
  costSavingTips: string[]
  alternativesForBudget: string[]
}

export interface AlternativeOption {
  type: 'model' | 'quality' | 'platform' | 'cost'
  title: string
  description: string
  tradeoffs: string[]
  savings?: number
  qualityImpact: 'none' | 'minimal' | 'moderate' | 'significant'
}

export interface ManualOverride {
  enabled: boolean
  overriddenParameters: Record<string, any>
  userPreferences: UserPreferences
  expertMode: boolean
}

export interface UserPreferences {
  preferredModels: string[]
  budgetPriority: 'cost' | 'quality' | 'balanced'
  speedPreference: 'fastest' | 'balanced' | 'highest_quality'
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  experienceLevel: 'beginner' | 'intermediate' | 'expert'
}

/**
 * Intelligent parameter selection based on user input and context
 */
export function selectOptimalParameters(
  input: {
    basePrompt: string
    outputType: string
    platform: string
    mediaAssets?: any[]
    textElements?: any[]
    userPreferences?: Partial<UserPreferences>
    budgetConstraints?: {
      maxCost?: number
      dailyBudget?: number
    }
  }
): AutoParameterResult {
  const preferences: UserPreferences = {
    preferredModels: [],
    budgetPriority: 'balanced' as const,
    speedPreference: 'balanced' as const,
    riskTolerance: 'moderate' as const,
    experienceLevel: 'intermediate' as const,
    ...input.userPreferences
  }

  // Analyze input complexity
  const complexity = analyzeInputComplexity(input)
  
  // Select optimal model
  const modelRecommendation = selectOptimalModel(input, complexity, preferences)
  
  // Optimize for platform
  const platformOptimization = optimizeForPlatform(input.platform, input.outputType)
  
  // Determine quality settings
  const qualitySettings = determineQualitySettings(complexity, preferences, input.outputType)
  
  // Calculate cost optimization
  const costOptimization = optimizeCosts(modelRecommendation, qualitySettings, preferences, input.budgetConstraints)
  
  // Generate alternatives
  const alternativeOptions = generateAlternatives(input, modelRecommendation, qualitySettings)
  
  // Calculate confidence
  const confidenceScore = calculateConfidenceScore(input, complexity, modelRecommendation)
  
  // Generate reasoning
  const reasoning = generateReasoning(input, complexity, modelRecommendation, qualitySettings)

  return {
    modelRecommendation,
    platformOptimization,
    qualitySettings,
    costOptimization,
    confidenceScore,
    reasoning,
    alternativeOptions
  }
}

function analyzeInputComplexity(input: any): {
  promptComplexity: 'simple' | 'moderate' | 'complex'
  mediaComplexity: 'none' | 'basic' | 'advanced'
  textComplexity: 'none' | 'basic' | 'advanced'
  overallScore: number
  factors: string[]
} {
  let score = 0
  const factors: string[] = []
  
  // Prompt analysis
  const promptLength = input.basePrompt.length
  const wordCount = input.basePrompt.split(' ').length
  
  if (wordCount > 50) {
    score += 2
    factors.push('Long, detailed prompt')
  } else if (wordCount > 20) {
    score += 1
    factors.push('Moderate prompt length')
  }
  
  if (input.basePrompt.includes(',')) {
    score += 1
    factors.push('Multiple prompt elements')
  }
  
  // Media analysis
  const mediaCount = input.mediaAssets?.length || 0
  if (mediaCount > 3) {
    score += 3
    factors.push('Multiple reference media')
  } else if (mediaCount > 1) {
    score += 2
    factors.push('Some reference media')
  } else if (mediaCount === 1) {
    score += 1
    factors.push('Single reference media')
  }
  
  // Check for AI analysis
  const hasAIAnalysis = input.mediaAssets?.some((asset: any) => asset.description?.aiAnalysis)
  if (hasAIAnalysis) {
    score += 1
    factors.push('AI-analyzed media references')
  }
  
  // Text complexity
  const textCount = input.textElements?.length || 0
  if (textCount > 3) {
    score += 2
    factors.push('Complex text overlay requirements')
  } else if (textCount > 0) {
    score += 1
    factors.push('Text overlay elements')
  }
  
  // Output type complexity
  if (input.outputType.includes('video-audio')) {
    score += 2
    factors.push('Multi-modal output (video + audio)')
  } else if (input.outputType.includes('video')) {
    score += 1
    factors.push('Video generation')
  }

  const promptComplexity = wordCount > 50 ? 'complex' : wordCount > 20 ? 'moderate' : 'simple'
  const mediaComplexity = mediaCount > 2 ? 'advanced' : mediaCount > 0 ? 'basic' : 'none'
  const textComplexity = textCount > 2 ? 'advanced' : textCount > 0 ? 'basic' : 'none'

  return {
    promptComplexity,
    mediaComplexity,
    textComplexity,
    overallScore: score,
    factors
  }
}

function selectOptimalModel(
  input: any,
  complexity: any,
  preferences: UserPreferences
): ModelRecommendation {
  const models = getAvailableModels(input.outputType)
  
  // Score models based on various factors
  const scoredModels = models.map(model => {
    let score = 0
    const strengths: string[] = []
    const limitations: string[] = []
    
    // Quality preference scoring
    if (preferences.speedPreference === 'highest_quality' && model.qualityTier === 'production') {
      score += 3
      strengths.push('Premium quality output')
    } else if (preferences.speedPreference === 'fastest' && model.processingSpeed === 'fast') {
      score += 3
      strengths.push('Fast processing')
    } else if (preferences.speedPreference === 'balanced') {
      score += model.qualityTier === 'social' ? 2 : 1
    }
    
    // Budget preference scoring
    if (preferences.budgetPriority === 'cost' && model.costLevel === 'low') {
      score += 2
      strengths.push('Cost-effective')
    } else if (preferences.budgetPriority === 'quality' && model.costLevel === 'high') {
      score += 1
      strengths.push('Premium features')
    }
    
    // Complexity handling
    if (complexity.overallScore > 6 && model.complexityHandling === 'excellent') {
      score += 2
      strengths.push('Handles complex requirements well')
    } else if (complexity.overallScore > 6 && model.complexityHandling === 'poor') {
      score -= 2
      limitations.push('May struggle with complex requirements')
    }
    
    // Text handling
    if (input.textElements?.length > 0) {
      if (model.textSupport === 'excellent') {
        score += 2
        strengths.push('Excellent text rendering')
      } else if (model.textSupport === 'poor') {
        score -= 1
        limitations.push('Limited text support')
      }
    }
    
    // Media reference support
    if (input.mediaAssets?.length > 0) {
      if (model.referenceSupport === 'excellent') {
        score += 1
        strengths.push('Great with reference media')
      }
    }
    
    // Platform optimization
    if ((model.platformSupport as any)?.[input.platform] === 'optimized') {
      score += 1
      strengths.push(`Optimized for ${input.platform}`)
    }

    return {
      ...model,
      score,
      strengths,
      limitations
    }
  })
  
  // Sort by score and select top model
  scoredModels.sort((a, b) => b.score - a.score)
  const topModel = scoredModels[0]
  const fallbackModels = scoredModels.slice(1, 4).map(m => m.name)
  
  return {
    primaryModel: topModel.name,
    fallbackModels,
    reason: generateModelSelectionReason(topModel, complexity, preferences),
    strengths: topModel.strengths,
    limitations: topModel.limitations,
    costRating: topModel.costLevel as 'low' | 'medium' | 'high',
    qualityRating: topModel.qualityTier === 'production' ? 'premium' : 
                   topModel.qualityTier === 'social' ? 'excellent' : 'good'
  }
}

function optimizeForPlatform(platform: string, outputType: string): PlatformOptimization {
  const platformSpecs: Record<string, any> = {
    instagram: {
      recommendedAspectRatio: outputType.includes('video') ? '9:16' : '1:1',
      recommendedDuration: 30,
      styleKeywords: ['vibrant', 'engaging', 'social-friendly'],
      technicalSpecs: {
        resolution: '1080x1920',
        frameRate: 30,
        bitrate: '3500k'
      },
      platformSpecificTips: [
        'Keep text large and readable on mobile',
        'Use vibrant colors for better engagement',
        'Consider Instagram Stories format'
      ]
    },
    tiktok: {
      recommendedAspectRatio: '9:16',
      recommendedDuration: 15,
      styleKeywords: ['trendy', 'dynamic', 'attention-grabbing'],
      technicalSpecs: {
        resolution: '1080x1920',
        frameRate: 30,
        bitrate: '4000k'
      },
      platformSpecificTips: [
        'Hook viewers in first 3 seconds',
        'Use trending sounds and effects',
        'Keep content fast-paced'
      ]
    },
    youtube: {
      recommendedAspectRatio: outputType.includes('shorts') ? '9:16' : '16:9',
      recommendedDuration: outputType.includes('shorts') ? 60 : 180,
      styleKeywords: ['professional', 'informative', 'engaging'],
      technicalSpecs: {
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: '5000k'
      },
      platformSpecificTips: [
        'Create compelling thumbnails',
        'Include clear call-to-actions',
        'Optimize for search keywords'
      ]
    },
    linkedin: {
      recommendedAspectRatio: outputType.includes('video') ? '16:9' : '1.91:1',
      recommendedDuration: 90,
      styleKeywords: ['professional', 'business', 'informative'],
      technicalSpecs: {
        resolution: '1920x1080',
        frameRate: 24,
        bitrate: '4000k'
      },
      platformSpecificTips: [
        'Maintain professional tone',
        'Include industry-relevant keywords',
        'Focus on business value'
      ]
    },
    general: {
      recommendedAspectRatio: '16:9',
      styleKeywords: ['high-quality', 'versatile'],
      technicalSpecs: {
        resolution: '1920x1080',
        frameRate: 30
      },
      platformSpecificTips: [
        'Create content suitable for multiple platforms',
        'Use standard formats for compatibility'
      ]
    }
  }
  
  return platformSpecs[platform] || platformSpecs.general
}

function determineQualitySettings(
  complexity: any,
  preferences: UserPreferences,
  outputType: string
): QualitySettings {
  let recommendedTier: 'draft' | 'social' | 'production' = 'social'
  let processingPriority: 'speed' | 'balanced' | 'quality' = 'balanced'
  let enhancementLevel: 'minimal' | 'standard' | 'aggressive' = 'standard'
  
  // Adjust based on preferences
  if (preferences.speedPreference === 'fastest') {
    recommendedTier = 'draft'
    processingPriority = 'speed'
    enhancementLevel = 'minimal'
  } else if (preferences.speedPreference === 'highest_quality') {
    recommendedTier = 'production'
    processingPriority = 'quality'
    enhancementLevel = 'aggressive'
  }
  
  // Adjust based on complexity
  if (complexity.overallScore > 7) {
    if (recommendedTier === 'draft') recommendedTier = 'social'
    enhancementLevel = 'aggressive'
  }
  
  // Adjust based on budget priority
  if (preferences.budgetPriority === 'cost') {
    if (recommendedTier === 'production') recommendedTier = 'social'
    processingPriority = 'speed'
  } else if (preferences.budgetPriority === 'quality') {
    if (recommendedTier === 'draft') recommendedTier = 'social'
    processingPriority = 'quality'
  }
  
  const postProcessing: string[] = []
  if (outputType.includes('video')) {
    postProcessing.push('motion smoothing')
    if (enhancementLevel === 'aggressive') {
      postProcessing.push('advanced upscaling', 'color correction')
    }
  }
  if (enhancementLevel !== 'minimal') {
    postProcessing.push('AI enhancement')
  }

  return {
    recommendedTier,
    processingPriority,
    enhancementLevel,
    postProcessing
  }
}

function optimizeCosts(
  modelRec: ModelRecommendation,
  qualitySettings: QualitySettings,
  preferences: UserPreferences,
  budgetConstraints?: any
): CostOptimization {
  // Mock cost calculation (in production, use actual model costs)
  const baseCosts: Record<string, number> = {
    'draft': 0.005,
    'social': 0.015,
    'production': 0.040
  }
  
  const estimatedCost = baseCosts[qualitySettings.recommendedTier] * 
                        (modelRec.costRating === 'high' ? 1.5 : modelRec.costRating === 'low' ? 0.7 : 1.0)
  
  const budgetLevel = estimatedCost < 0.01 ? 'budget' : estimatedCost < 0.03 ? 'standard' : 'premium'
  
  const costSavingTips: string[] = []
  const alternativesForBudget: string[] = []
  
  if (preferences.budgetPriority === 'cost') {
    costSavingTips.push('Use draft quality for faster, cheaper results')
    costSavingTips.push('Reduce video duration to save on processing costs')
    alternativesForBudget.push('Switch to a budget-friendly model')
  }
  
  if (budgetConstraints?.maxCost && estimatedCost > budgetConstraints.maxCost) {
    alternativesForBudget.push('Reduce quality tier to meet budget')
    alternativesForBudget.push('Simplify prompt to reduce complexity')
  }

  return {
    estimatedCost,
    budgetLevel,
    costSavingTips,
    alternativesForBudget
  }
}

function generateAlternatives(
  input: any,
  modelRec: ModelRecommendation,
  qualitySettings: QualitySettings
): AlternativeOption[] {
  const alternatives: AlternativeOption[] = []
  
  // Speed alternative
  if (qualitySettings.processingPriority !== 'speed') {
    alternatives.push({
      type: 'quality',
      title: 'Faster Processing',
      description: 'Switch to draft quality for 3x faster processing',
      tradeoffs: ['Lower output quality', 'Fewer enhancement features'],
      savings: 0.02,
      qualityImpact: 'moderate'
    })
  }
  
  // Budget alternative
  if (modelRec.costRating !== 'low') {
    alternatives.push({
      type: 'cost',
      title: 'Budget Option',
      description: 'Use a cost-effective model to reduce expenses',
      tradeoffs: ['Slightly lower quality', 'Fewer advanced features'],
      savings: 0.015,
      qualityImpact: 'minimal'
    })
  }
  
  // Quality alternative
  if (qualitySettings.recommendedTier !== 'production') {
    alternatives.push({
      type: 'quality',
      title: 'Premium Quality',
      description: 'Upgrade to production quality for best results',
      tradeoffs: ['Higher cost', 'Longer processing time'],
      savings: -0.025,
      qualityImpact: 'none'
    })
  }
  
  return alternatives
}

function calculateConfidenceScore(
  input: any,
  complexity: any,
  modelRec: ModelRecommendation
): number {
  let confidence = 70 // Base confidence
  
  // Increase confidence for simple inputs
  if (complexity.overallScore < 3) confidence += 15
  else if (complexity.overallScore > 7) confidence -= 10
  
  // Increase confidence if model matches well
  if (modelRec.strengths.length > modelRec.limitations.length) {
    confidence += 10
  }
  
  // Decrease confidence for untested combinations
  if (input.textElements?.length > 0 && input.mediaAssets?.length > 2) {
    confidence -= 5
  }
  
  return Math.min(95, Math.max(60, confidence))
}

function generateReasoning(
  input: any,
  complexity: any,
  modelRec: ModelRecommendation,
  qualitySettings: QualitySettings
): string[] {
  const reasoning: string[] = []
  
  reasoning.push(`Selected ${modelRec.primaryModel} based on ${modelRec.reason.toLowerCase()}`)
  
  if (complexity.overallScore > 5) {
    reasoning.push(`Detected complex requirements - recommending ${qualitySettings.recommendedTier} quality`)
  }
  
  if (input.mediaAssets?.length > 0) {
    reasoning.push(`Media references detected - chosen model excels at reference-based generation`)
  }
  
  if (input.textElements?.length > 0) {
    reasoning.push(`Text elements require model with strong typography support`)
  }
  
  reasoning.push(`Platform optimization applied for ${input.platform} best practices`)
  
  return reasoning
}

// Mock model database
function getAvailableModels(outputType: string) {
  const allModels = [
    {
      name: 'Qwen Image',
      type: 'image',
      qualityTier: 'social',
      costLevel: 'low',
      processingSpeed: 'fast',
      complexityHandling: 'good',
      textSupport: 'excellent',
      referenceSupport: 'good',
      platformSupport: { general: 'optimized' }
    },
    {
      name: 'Ideogram v3',
      type: 'image',
      qualityTier: 'social',
      costLevel: 'low',
      processingSpeed: 'fast',
      complexityHandling: 'excellent',
      textSupport: 'excellent',
      referenceSupport: 'excellent',
      platformSupport: { instagram: 'optimized', linkedin: 'optimized' }
    },
    {
      name: 'Imagen 4',
      type: 'image',
      qualityTier: 'production',
      costLevel: 'high',
      processingSpeed: 'slow',
      complexityHandling: 'excellent',
      textSupport: 'good',
      referenceSupport: 'excellent',
      platformSupport: { general: 'optimized' }
    },
    {
      name: 'Veo 3',
      type: 'video',
      qualityTier: 'production',
      costLevel: 'high',
      processingSpeed: 'slow',
      complexityHandling: 'excellent',
      textSupport: 'excellent',
      referenceSupport: 'excellent',
      platformSupport: { youtube: 'optimized', linkedin: 'optimized' }
    },
    {
      name: 'Kling 2.1',
      type: 'video',
      qualityTier: 'production',
      costLevel: 'high',
      processingSpeed: 'slow',
      complexityHandling: 'excellent',
      textSupport: 'excellent',
      referenceSupport: 'excellent',
      platformSupport: { general: 'optimized' }
    },
    {
      name: 'Seedance 1.0',
      type: 'video',
      qualityTier: 'social',
      costLevel: 'low',
      processingSpeed: 'fast',
      complexityHandling: 'good',
      textSupport: 'fair',
      referenceSupport: 'good',
      platformSupport: { tiktok: 'optimized', instagram: 'optimized' }
    }
  ]
  
  return allModels.filter(model => 
    outputType.includes('video') ? model.type === 'video' : model.type === 'image'
  )
}

function generateModelSelectionReason(model: any, complexity: any, preferences: UserPreferences): string {
  const reasons: string[] = []
  
  if (model.score > 5) {
    reasons.push('optimal match for requirements')
  }
  
  if (preferences.budgetPriority === 'cost' && model.costLevel === 'low') {
    reasons.push('cost-effective choice')
  }
  
  if (preferences.speedPreference === 'fastest' && model.processingSpeed === 'fast') {
    reasons.push('fast processing capability')
  }
  
  if (complexity.overallScore > 6 && model.complexityHandling === 'excellent') {
    reasons.push('excellent handling of complex requirements')
  }
  
  return reasons.join(' and ') || 'best available option'
}