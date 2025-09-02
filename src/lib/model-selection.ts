// Smart Model Selection System with Compatibility Validation
import { 
  ModelCapabilities, 
  ENHANCED_MODEL_DATABASE, 
  getModelsForOutputType,
  getModelById 
} from './model-capabilities'

export interface MediaAsset {
  id: string
  filename: string
  file_type: 'image' | 'video' | 'audio'
  mime_type: string
  file_size_bytes: number
  storage_path: string
}

export interface ModelSelectionCriteria {
  outputType: string
  qualityTier: 'draft' | 'social' | 'production' | 'professional'
  budget?: {
    max_cost_per_generation?: number
    prefer_cost_effective?: boolean
  }
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
  priority_features?: Array<keyof ModelCapabilities['special_features']>
  generation_speed_priority?: 'fast' | 'balanced' | 'quality'
}

export interface CompatibilityCheck {
  is_compatible: boolean
  compatibility_score: number  // 0-1 rating
  issues: CompatibilityIssue[]
  warnings: string[]
  suggestions: string[]
}

export interface CompatibilityIssue {
  type: 'error' | 'warning' | 'info'
  category: 'input_requirements' | 'format_support' | 'limitations' | 'performance'
  message: string
  suggestion?: string
  can_auto_fix?: boolean
}

export interface ModelSelectionResult {
  selected_model: ModelCapabilities
  compatibility: CompatibilityCheck
  reasoning: string[]
  alternatives: {
    cost_effective?: ModelCapabilities
    higher_quality?: ModelCapabilities
    faster?: ModelCapabilities
  }
  estimated_cost: number
  estimated_generation_time: number
}

export class ModelSelector {
  
  /**
   * Main model selection function with comprehensive compatibility checking
   */
  static selectOptimalModel(
    basePrompt: string,
    mediaAssets: MediaAsset[],
    criteria: ModelSelectionCriteria
  ): ModelSelectionResult {
    
    // Get candidate models for the output type
    const candidateModels = getModelsForOutputType(criteria.outputType)
    
    if (candidateModels.length === 0) {
      throw new Error(`No models available for output type: ${criteria.outputType}`)
    }
    
    // Score and rank models based on compatibility and criteria
    const scoredModels = candidateModels.map(model => {
      const compatibility = this.checkModelCompatibility(model, basePrompt, mediaAssets)
      const score = this.calculateModelScore(model, criteria, compatibility)
      
      return {
        model,
        compatibility,
        score,
        reasoning: this.generateReasoningForModel(model, criteria, compatibility)
      }
    })
    
    // First try fully compatible models
    let compatibleModels = scoredModels.filter(result => result.compatibility.is_compatible)
    
    // If no fully compatible models, try models with warnings but no errors
    if (compatibleModels.length === 0) {
      compatibleModels = scoredModels.filter(result => 
        result.compatibility.compatibility_score > 0.5 && 
        !result.compatibility.issues.some(issue => issue.type === 'error')
      )
    }
    
    // Last resort: take the highest scoring model even with issues
    if (compatibleModels.length === 0 && scoredModels.length > 0) {
      console.warn('[Model Selection] No fully compatible models found, using best available with warnings')
      compatibleModels = [scoredModels.sort((a, b) => b.score - a.score)[0]]
    }
    
    if (compatibleModels.length === 0) {
      throw new Error(`No models available for output type: ${criteria.outputType}`)
    }
    
    // Use compatible models for further processing
    scoredModels.length = 0
    scoredModels.push(...compatibleModels)
    
    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score)
    
    const bestMatch = scoredModels[0]
    
    // Find alternatives
    const alternatives = this.findAlternatives(scoredModels, criteria)
    
    // Calculate estimates
    const estimatedCost = this.calculateCost(bestMatch.model, mediaAssets, criteria)
    const estimatedTime = bestMatch.model.performance.generation_time_estimate
    
    return {
      selected_model: bestMatch.model,
      compatibility: bestMatch.compatibility,
      reasoning: bestMatch.reasoning,
      alternatives,
      estimated_cost: estimatedCost,
      estimated_generation_time: estimatedTime
    }
  }
  
  /**
   * Check if a model is compatible with the given inputs
   */
  static checkModelCompatibility(
    model: ModelCapabilities,
    basePrompt: string,
    mediaAssets: MediaAsset[]
  ): CompatibilityCheck {
    const issues: CompatibilityIssue[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    const imageAssets = mediaAssets.filter(asset => asset.file_type === 'image')
    const audioAssets = mediaAssets.filter(asset => asset.file_type === 'audio')
    
    let compatibilityScore = 1.0
    
    // Check text requirements
    const textReqs = model.input_requirements.text
    if (textReqs.required && (!basePrompt || basePrompt.trim().length === 0)) {
      issues.push({
        type: 'error',
        category: 'input_requirements',
        message: `${model.name} requires text input, but no prompt provided`,
        suggestion: 'Please provide a text prompt'
      })
      compatibilityScore = 0
    }
    
    if (textReqs.min_length && basePrompt.length < textReqs.min_length) {
      issues.push({
        type: 'warning',
        category: 'input_requirements',
        message: `Prompt is shorter than recommended minimum (${textReqs.min_length} characters)`,
        suggestion: 'Consider adding more detail to your prompt for better results'
      })
      compatibilityScore *= 0.8
    }
    
    if (textReqs.max_length && basePrompt.length > textReqs.max_length) {
      issues.push({
        type: 'warning',
        category: 'input_requirements',
        message: `Prompt exceeds maximum length (${textReqs.max_length} characters)`,
        suggestion: 'Prompt will be truncated',
        can_auto_fix: true
      })
      compatibilityScore *= 0.9
    }
    
    // Check image requirements
    const imageReqs = model.input_requirements.images
    if (imageReqs.required && imageAssets.length === 0) {
      issues.push({
        type: 'error',
        category: 'input_requirements',
        message: `${model.name} requires image input, but no images provided`,
        suggestion: 'Please upload at least one image'
      })
      compatibilityScore = 0
    }
    
    if (imageAssets.length < imageReqs.min) {
      issues.push({
        type: 'error',
        category: 'input_requirements',
        message: `${model.name} requires at least ${imageReqs.min} images, but ${imageAssets.length} provided`,
        suggestion: `Please upload ${imageReqs.min - imageAssets.length} more images`
      })
      compatibilityScore = 0
    }
    
    if (imageAssets.length > imageReqs.max) {
      issues.push({
        type: 'warning',
        category: 'input_requirements',
        message: `${model.name} supports max ${imageReqs.max} images, but ${imageAssets.length} provided`,
        suggestion: `Will use first ${imageReqs.max} images`,
        can_auto_fix: true
      })
      compatibilityScore *= 0.95
    }
    
    // Check image formats
    if (imageAssets.length > 0 && imageReqs.formats.length > 0) {
      const incompatibleImages = imageAssets.filter(asset => {
        const extension = asset.filename.split('.').pop()?.toLowerCase() || ''
        return !imageReqs.formats.includes(extension)
      })
      
      if (incompatibleImages.length > 0) {
        issues.push({
          type: 'warning',
          category: 'format_support',
          message: `Some image formats not supported: ${incompatibleImages.map(a => a.filename).join(', ')}`,
          suggestion: 'Consider converting to supported formats: ' + imageReqs.formats.join(', ')
        })
        compatibilityScore *= Math.max(0.7, 1 - (incompatibleImages.length / imageAssets.length) * 0.5)
      }
    }
    
    // Check audio requirements
    if (audioAssets.length > 0) {
      if (!model.input_requirements.audio?.supported) {
        issues.push({
          type: 'info',
          category: 'input_requirements',
          message: `${model.name} does not support audio input, audio files will be ignored`,
          suggestion: 'Consider a model with audio support for better results'
        })
        compatibilityScore *= 0.9
      }
    }
    
    // Check model status and availability
    if (model.status.availability === 'beta') {
      warnings.push(`${model.name} is in beta - expect possible instability`)
      compatibilityScore *= 0.95
    } else if (model.status.availability === 'deprecated') {
      issues.push({
        type: 'warning',
        category: 'limitations',
        message: `${model.name} is deprecated and may be discontinued`,
        suggestion: 'Consider using a newer model alternative'
      })
      compatibilityScore *= 0.8
    }
    
    // Add positive suggestions
    if (compatibilityScore > 0.9) {
      suggestions.push(`${model.name} is an excellent match for your requirements`)
    }
    
    if (model.special_features.text_rendering === 'excellent' && basePrompt.includes('text')) {
      suggestions.push(`${model.name} excels at text rendering for your text-heavy prompt`)
    }
    
    if (model.special_features.character_consistency === 'excellent' && imageAssets.length > 0) {
      suggestions.push(`${model.name} provides excellent character consistency with your reference images`)
    }
    
    const isCompatible = compatibilityScore > 0 && !issues.some(issue => issue.type === 'error')
    
    return {
      is_compatible: isCompatible,
      compatibility_score: compatibilityScore,
      issues,
      warnings,
      suggestions
    }
  }
  
  /**
   * Calculate a score for model ranking based on criteria and compatibility
   */
  static calculateModelScore(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria,
    compatibility: CompatibilityCheck
  ): number {
    let score = compatibility.compatibility_score * 100 // Start with compatibility (0-100)
    
    // Quality tier matching
    const qualityWeight = 30
    if (model.classification.quality_tier === criteria.qualityTier) {
      score += qualityWeight
    } else {
      // Partial credit for close matches
      const qualityOrder = { 'draft': 1, 'social': 2, 'production': 3, 'professional': 4 }
      const targetQuality = qualityOrder[criteria.qualityTier] || 2
      const modelQuality = qualityOrder[model.classification.quality_tier] || 2
      const qualityDiff = Math.abs(targetQuality - modelQuality)
      score += qualityWeight * Math.max(0, 1 - (qualityDiff * 0.3))
    }
    
    // Platform optimization
    if (criteria.platform && model.classification.platform_optimized.includes(criteria.platform)) {
      score += 20
    }
    
    // Performance considerations
    if (criteria.generation_speed_priority) {
      const speedWeight = 15
      if (criteria.generation_speed_priority === 'fast' && model.performance.generation_time_estimate < 10) {
        score += speedWeight
      } else if (criteria.generation_speed_priority === 'balanced' && model.performance.generation_time_estimate < 30) {
        score += speedWeight * 0.8
      } else if (criteria.generation_speed_priority === 'quality') {
        score += speedWeight * 0.5 // Quality over speed
      }
    }
    
    // Budget considerations  
    if (criteria.budget?.prefer_cost_effective) {
      const cost = model.pricing.cost_per_image || model.pricing.cost_per_second || 0
      if (cost < 0.02) { // Low cost threshold
        score += 15
      } else if (cost < 0.05) { // Medium cost
        score += 10
      }
    }
    
    // Priority features
    if (criteria.priority_features) {
      const featureWeight = 10
      criteria.priority_features.forEach(feature => {
        const featureLevel = model.special_features[feature]
        if (featureLevel === 'excellent') {
          score += featureWeight
        } else if (featureLevel === 'good') {
          score += featureWeight * 0.7
        } else if (featureLevel === 'fair') {
          score += featureWeight * 0.4
        }
      })
    }
    
    // Reliability and consistency bonus
    score += model.performance.reliability_score * 10
    score += model.performance.consistency_score * 10
    
    return Math.max(0, score)
  }
  
  /**
   * Generate human-readable reasoning for model selection
   */
  static generateReasoningForModel(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria,
    compatibility: CompatibilityCheck
  ): string[] {
    const reasoning: string[] = []
    
    // Compatibility
    if (compatibility.compatibility_score > 0.9) {
      reasoning.push(`Perfect compatibility with your inputs`)
    } else if (compatibility.compatibility_score > 0.8) {
      reasoning.push(`Good compatibility with minor adjustments needed`)
    } else {
      reasoning.push(`Compatible but may require input modifications`)
    }
    
    // Quality matching
    if (model.classification.quality_tier === criteria.qualityTier) {
      reasoning.push(`Matches your ${criteria.qualityTier} quality requirements`)
    }
    
    // Special strengths
    if (model.special_features.text_rendering === 'excellent') {
      reasoning.push(`Excellent text rendering capabilities`)
    }
    if (model.special_features.character_consistency === 'excellent') {
      reasoning.push(`Superior character consistency across generations`)
    }
    if (model.special_features.multilingual_support) {
      reasoning.push(`Supports multilingual text generation`)
    }
    
    // Performance characteristics
    if (model.performance.generation_time_estimate < 10) {
      reasoning.push(`Fast generation time (~${model.performance.generation_time_estimate}s)`)
    }
    if (model.performance.reliability_score > 0.9) {
      reasoning.push(`High reliability (${Math.round(model.performance.reliability_score * 100)}% success rate)`)
    }
    
    // Cost considerations
    const cost = model.pricing.cost_per_image || model.pricing.cost_per_second || 0
    if (cost < 0.02) {
      reasoning.push(`Cost-effective pricing ($${cost.toFixed(3)} per generation)`)
    } else if (cost > 0.1) {
      reasoning.push(`Premium pricing for highest quality ($${cost.toFixed(3)} per generation)`)
    }
    
    return reasoning
  }
  
  /**
   * Find alternative models for user consideration
   */
  static findAlternatives(
    scoredModels: Array<{model: ModelCapabilities, score: number}>,
    criteria: ModelSelectionCriteria
  ) {
    const alternatives: any = {}
    
    if (scoredModels.length > 1) {
      // Find most cost-effective
      const costEffective = scoredModels
        .filter(sm => sm.model.id !== scoredModels[0].model.id)
        .sort((a, b) => {
          const aCost = a.model.pricing.cost_per_image || a.model.pricing.cost_per_second || 0
          const bCost = b.model.pricing.cost_per_image || b.model.pricing.cost_per_second || 0
          return aCost - bCost
        })[0]
      
      if (costEffective) {
        alternatives.cost_effective = costEffective.model
      }
      
      // Find highest quality
      const higherQuality = scoredModels
        .filter(sm => sm.model.id !== scoredModels[0].model.id)
        .sort((a, b) => {
          const qualityOrder = { 'draft': 1, 'social': 2, 'production': 3, 'professional': 4 }
          const aQuality = qualityOrder[a.model.classification.quality_tier] || 2
          const bQuality = qualityOrder[b.model.classification.quality_tier] || 2
          return bQuality - aQuality
        })[0]
      
      if (higherQuality && 
          higherQuality.model.classification.quality_tier !== scoredModels[0].model.classification.quality_tier) {
        alternatives.higher_quality = higherQuality.model
      }
      
      // Find fastest
      const faster = scoredModels
        .filter(sm => sm.model.id !== scoredModels[0].model.id)
        .sort((a, b) => a.model.performance.generation_time_estimate - b.model.performance.generation_time_estimate)[0]
      
      if (faster && 
          faster.model.performance.generation_time_estimate < scoredModels[0].model.performance.generation_time_estimate) {
        alternatives.faster = faster.model
      }
    }
    
    return alternatives
  }
  
  /**
   * Calculate estimated cost for the generation
   */
  static calculateCost(
    model: ModelCapabilities,
    mediaAssets: MediaAsset[],
    criteria: ModelSelectionCriteria
  ): number {
    if (model.type === 'image') {
      return model.pricing.cost_per_image || 0.01
    } else {
      // Video models - need duration
      const duration = 5 // Default 5 seconds, should come from criteria
      return (model.pricing.cost_per_second || 0.05) * duration
    }
  }
  
  /**
   * Validate model selection result and provide user-friendly feedback
   */
  static validateSelection(result: ModelSelectionResult): {
    valid: boolean
    user_message: string
    action_required?: string
  } {
    if (!result.compatibility.is_compatible) {
      return {
        valid: false,
        user_message: `Selected model is not compatible with your inputs. ${result.compatibility.issues[0]?.message}`,
        action_required: result.compatibility.issues[0]?.suggestion
      }
    }
    
    if (result.compatibility.compatibility_score < 0.7) {
      return {
        valid: true,
        user_message: `Model selection has compatibility issues that may affect results. Consider the suggested alternatives.`,
        action_required: 'Review warnings and consider making suggested changes'
      }
    }
    
    return {
      valid: true,
      user_message: `${result.selected_model.name} selected successfully. ${result.reasoning[0] || 'Good match for your requirements.'}`
    }
  }
}

export default ModelSelector