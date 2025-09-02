import { GeminiService } from '../llm/gemini-service'
import { ModelCapabilities } from '../model-capabilities'

export interface QualityMetrics {
  overall_score: number // 0-100
  prompt_clarity: number // 0-100
  technical_accuracy: number // 0-100
  model_optimization: number // 0-100
  platform_suitability: number // 0-100
  consistency_score: number // 0-100
  creativity_balance: number // 0-100
  duplicate_detection: number // 0-100 (higher is better, means fewer duplicates)
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion'
  category: 'prompt_quality' | 'technical' | 'model_compatibility' | 'platform' | 'consistency'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  fix_suggestion?: string
  examples?: string[]
}

export interface QualityValidationResult {
  is_valid: boolean
  quality_metrics: QualityMetrics
  issues: ValidationIssue[]
  recommendations: string[]
  quality_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  confidence_score: number // 0-1
  validation_timestamp: string
}

export interface ValidationContext {
  originalPrompt: string
  enhancedPrompt: string
  negativePrompt?: string
  selectedModel: ModelCapabilities
  platform?: string
  outputType: string
  contextData?: {
    mediaAssets?: any[]
    textElements?: any[]
    contextAnswers?: any
  }
}

export class QualityValidationFramework {
  private geminiService: GeminiService
  private validationCache: Map<string, QualityValidationResult>

  constructor() {
    this.geminiService = new GeminiService()
    this.validationCache = new Map()
  }

  async validateEnhancement(context: ValidationContext): Promise<QualityValidationResult> {
    const cacheKey = this.generateCacheKey(context)
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!
      console.log('🎯 [Quality Validation] Using cached validation result')
      return cached
    }

    try {
      console.log('🔍 [Quality Validation] Starting comprehensive quality validation')
      
      // Run all validation checks
      const [
        clarityScore,
        technicalScore,
        optimizationScore,
        platformScore,
        consistencyScore,
        creativityScore,
        duplicateScore,
        issues
      ] = await Promise.all([
        this.validatePromptClarity(context),
        this.validateTechnicalAccuracy(context),
        this.validateModelOptimization(context),
        this.validatePlatformSuitability(context),
        this.validateConsistency(context),
        this.validateCreativityBalance(context),
        this.detectDuplicates(context),
        this.detectIssues(context)
      ])

      // Calculate overall score
      const overallScore = this.calculateOverallScore({
        prompt_clarity: clarityScore,
        technical_accuracy: technicalScore,
        model_optimization: optimizationScore,
        platform_suitability: platformScore,
        consistency_score: consistencyScore,
        creativity_balance: creativityScore,
        duplicate_detection: duplicateScore,
        overall_score: 0
      })

      const qualityMetrics: QualityMetrics = {
        overall_score: overallScore,
        prompt_clarity: clarityScore,
        technical_accuracy: technicalScore,
        model_optimization: optimizationScore,
        platform_suitability: platformScore,
        consistency_score: consistencyScore,
        creativity_balance: creativityScore,
        duplicate_detection: duplicateScore
      }

      // Generate recommendations
      const recommendations = await this.generateRecommendations(context, qualityMetrics, issues)

      // Calculate quality grade
      const qualityGrade = this.calculateQualityGrade(overallScore)

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(qualityMetrics, issues)

      const result: QualityValidationResult = {
        is_valid: overallScore >= 70 && !issues.some(issue => issue.severity === 'critical'),
        quality_metrics: qualityMetrics,
        issues,
        recommendations,
        quality_grade: qualityGrade,
        confidence_score: confidenceScore,
        validation_timestamp: new Date().toISOString()
      }

      // Cache the result
      this.validationCache.set(cacheKey, result)

      console.log('✅ [Quality Validation] Validation completed', {
        overall_score: overallScore,
        quality_grade: qualityGrade,
        issues_count: issues.length,
        is_valid: result.is_valid
      })

      return result
    } catch (error) {
      console.error('❌ [Quality Validation] Validation failed:', error)
      
      // Return a minimal validation result on failure
      return {
        is_valid: false,
        quality_metrics: {
          overall_score: 0,
          prompt_clarity: 0,
          technical_accuracy: 0,
          model_optimization: 0,
          platform_suitability: 0,
          consistency_score: 0,
          creativity_balance: 0,
          duplicate_detection: 0
        },
        issues: [{
          type: 'error',
          category: 'technical',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'critical'
        }],
        recommendations: ['Please try again or contact support'],
        quality_grade: 'F',
        confidence_score: 0,
        validation_timestamp: new Date().toISOString()
      }
    }
  }

  private async validatePromptClarity(context: ValidationContext): Promise<number> {
    const analysisPrompt = `
    Analyze this AI generation prompt for clarity and effectiveness:
    
    Original: "${context.originalPrompt}"
    Enhanced: "${context.enhancedPrompt}"
    Model: ${context.selectedModel.name}
    Platform: ${context.platform || 'general'}
    
    Rate the ENHANCED prompt's clarity on a scale of 0-100 based on:
    1. Clear, specific descriptions (25 points)
    2. Proper structure and organization (25 points)
    3. Appropriate detail level (25 points)
    4. Actionable instructions for AI model (25 points)
    
    Return only a number between 0-100.
    `

    try {
      const response = await this.geminiService.generateText(analysisPrompt, {
        temperature: 0.1,
        maxTokens: 50
      })

      const score = this.extractNumericScore(response.content, 85)
      return Math.max(0, Math.min(100, score))
    } catch (error) {
      console.warn('[Quality Validation] Clarity validation failed:', error)
      return 85 // Default score
    }
  }

  private async validateTechnicalAccuracy(context: ValidationContext): Promise<number> {
    let score = 90 // Base score

    // Check for model-specific requirements
    if (context.selectedModel.type === 'video') {
      if (!context.enhancedPrompt.includes('cinematic') && 
          !context.enhancedPrompt.includes('camera') && 
          !context.enhancedPrompt.includes('motion')) {
        score -= 15
      }
    }

    // Check for aspect ratio mentions for visual content
    if (context.outputType.includes('image') || context.outputType.includes('video')) {
      const hasAspectRatioGuidance = /\d+:\d+|aspect|ratio|vertical|horizontal|portrait|landscape/.test(context.enhancedPrompt.toLowerCase())
      if (!hasAspectRatioGuidance) {
        score -= 10
      }
    }

    // Check for platform-specific optimizations
    if (context.platform) {
      const platformOptimized = this.checkPlatformOptimization(context.enhancedPrompt, context.platform)
      if (!platformOptimized) {
        score -= 10
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  private async validateModelOptimization(context: ValidationContext): Promise<number> {
    let score = 85 // Base score

    const modelName = context.selectedModel.name.toLowerCase()
    const prompt = context.enhancedPrompt.toLowerCase()

    // Model-specific optimizations
    if (modelName.includes('stable diffusion')) {
      if (!prompt.includes('detailed') || !prompt.includes('high quality')) {
        score -= 15
      }
      if (prompt.includes('blurry') || prompt.includes('low quality')) {
        score -= 20 // Negative prompts should be in negative_prompt, not main prompt
      }
    } else if (modelName.includes('midjourney')) {
      const hasMJOptimizations = /--\w+|\s(ar|v|q|chaos|stylize)/.test(context.enhancedPrompt)
      if (!hasMJOptimizations) {
        score -= 10
      }
    } else if (modelName.includes('dalle')) {
      if (prompt.length > 400) {
        score -= 15 // DALL-E prefers shorter prompts
      }
    } else if (modelName.includes('runway')) {
      if (!prompt.includes('motion') && !prompt.includes('camera')) {
        score -= 10
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  private async validatePlatformSuitability(context: ValidationContext): Promise<number> {
    if (!context.platform || context.platform === 'general') {
      return 90 // No specific platform requirements
    }

    let score = 85 // Base score
    const prompt = context.enhancedPrompt.toLowerCase()

    switch (context.platform) {
      case 'instagram':
        if (!prompt.includes('aesthetic') && !prompt.includes('vibrant') && !prompt.includes('beautiful')) {
          score -= 10
        }
        if (context.outputType.includes('video') && !prompt.includes('vertical')) {
          score -= 15
        }
        break

      case 'tiktok':
        if (context.outputType.includes('video') && !prompt.includes('dynamic')) {
          score -= 10
        }
        if (!prompt.includes('engaging') && !prompt.includes('attention')) {
          score -= 10
        }
        break

      case 'youtube':
        if (context.outputType.includes('video') && !prompt.includes('cinematic')) {
          score -= 10
        }
        if (!prompt.includes('professional') && !prompt.includes('quality')) {
          score -= 5
        }
        break

      case 'linkedin':
        if (!prompt.includes('professional') && !prompt.includes('business')) {
          score -= 15
        }
        break
    }

    return Math.max(0, Math.min(100, score))
  }

  private async validateConsistency(context: ValidationContext): Promise<number> {
    // Check if the enhancement maintains consistency with the original intent
    const originalLength = context.originalPrompt.length
    const enhancedLength = context.enhancedPrompt.length
    
    let score = 90

    // Check enhancement ratio
    const enhancementRatio = enhancedLength / originalLength
    if (enhancementRatio < 1.5) {
      score -= 10 // Might be under-enhanced
    } else if (enhancementRatio > 8) {
      score -= 15 // Might be over-enhanced
    }

    // Check for keyword preservation
    const originalWords = context.originalPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const enhancedWords = context.enhancedPrompt.toLowerCase()
    
    const preservedWords = originalWords.filter(word => enhancedWords.includes(word))
    const preservationRate = preservedWords.length / originalWords.length
    
    if (preservationRate < 0.6) {
      score -= 20 // Too many original concepts lost
    }

    return Math.max(0, Math.min(100, score))
  }

  private async validateCreativityBalance(context: ValidationContext): Promise<number> {
    let score = 85

    const prompt = context.enhancedPrompt.toLowerCase()
    
    // Check for creative elements
    const creativeWords = ['artistic', 'creative', 'unique', 'innovative', 'imaginative', 'surreal', 'fantasy', 'magical']
    const hasCreativeElements = creativeWords.some(word => prompt.includes(word))
    
    // Check for technical precision
    const technicalWords = ['detailed', 'precise', 'accurate', 'realistic', 'professional', 'sharp', 'clear']
    const hasTechnicalElements = technicalWords.some(word => prompt.includes(word))
    
    if (!hasCreativeElements && !hasTechnicalElements) {
      score -= 20
    } else if (hasCreativeElements && hasTechnicalElements) {
      score += 10 // Good balance
    }

    return Math.max(0, Math.min(100, score))
  }

  private async detectDuplicates(context: ValidationContext): Promise<number> {
    const words = context.enhancedPrompt.toLowerCase().split(/\s+/)
    const wordCounts = new Map<string, number>()
    
    // Count word frequencies
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '')
      if (cleaned.length > 3) { // Only count meaningful words
        wordCounts.set(cleaned, (wordCounts.get(cleaned) || 0) + 1)
      }
    })
    
    // Find duplicates
    let duplicateCount = 0
    let totalMeaningfulWords = 0
    
    wordCounts.forEach((count, word) => {
      if (count > 1) {
        duplicateCount += count - 1 // Count excess occurrences
      }
      totalMeaningfulWords += count
    })
    
    // Calculate duplicate rate
    const duplicateRate = totalMeaningfulWords > 0 ? duplicateCount / totalMeaningfulWords : 0
    
    // Convert to score (lower duplicate rate = higher score)
    const score = Math.round((1 - duplicateRate) * 100)
    
    return Math.max(0, Math.min(100, score))
  }

  private async detectIssues(context: ValidationContext): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = []
    const prompt = context.enhancedPrompt.toLowerCase()

    // Check for common issues
    if (prompt.length < 20) {
      issues.push({
        type: 'warning',
        category: 'prompt_quality',
        message: 'Enhanced prompt is very short and may lack detail',
        severity: 'medium',
        fix_suggestion: 'Add more descriptive details and specific instructions'
      })
    }

    if (prompt.length > 2000) {
      issues.push({
        type: 'warning',
        category: 'technical',
        message: 'Enhanced prompt is very long and may exceed model limits',
        severity: 'medium',
        fix_suggestion: 'Consider condensing the prompt while maintaining key details'
      })
    }

    // Check for conflicting instructions
    const conflicts = this.detectConflictingInstructions(context.enhancedPrompt)
    if (conflicts.length > 0) {
      issues.push({
        type: 'error',
        category: 'prompt_quality',
        message: 'Detected conflicting instructions in the prompt',
        severity: 'high',
        fix_suggestion: 'Remove or clarify conflicting elements',
        examples: conflicts
      })
    }

    // Check for inappropriate content markers
    const inappropriateMarkers = ['nsfw', 'explicit', 'adult', 'nude', 'sexual']
    const hasInappropriate = inappropriateMarkers.some(marker => prompt.includes(marker))
    if (hasInappropriate) {
      issues.push({
        type: 'warning',
        category: 'platform',
        message: 'Prompt contains potentially inappropriate content markers',
        severity: 'high',
        fix_suggestion: 'Review and remove inappropriate content references'
      })
    }

    return issues
  }

  private detectConflictingInstructions(prompt: string): string[] {
    const conflicts: string[] = []
    const lowerPrompt = prompt.toLowerCase()

    // Common conflicts
    const conflictPairs = [
      ['realistic', 'cartoon'],
      ['photorealistic', 'anime'],
      ['minimalist', 'detailed'],
      ['dark', 'bright'],
      ['vintage', 'modern'],
      ['simple', 'complex']
    ]

    conflictPairs.forEach(([word1, word2]) => {
      if (lowerPrompt.includes(word1) && lowerPrompt.includes(word2)) {
        conflicts.push(`"${word1}" conflicts with "${word2}"`)
      }
    })

    return conflicts
  }

  private checkPlatformOptimization(prompt: string, platform: string): boolean {
    const lowerPrompt = prompt.toLowerCase()

    switch (platform) {
      case 'instagram':
        return lowerPrompt.includes('aesthetic') || lowerPrompt.includes('beautiful') || 
               lowerPrompt.includes('vibrant') || lowerPrompt.includes('stylish')
      case 'tiktok':
        return lowerPrompt.includes('dynamic') || lowerPrompt.includes('engaging') || 
               lowerPrompt.includes('trendy') || lowerPrompt.includes('viral')
      case 'youtube':
        return lowerPrompt.includes('cinematic') || lowerPrompt.includes('professional') || 
               lowerPrompt.includes('high-quality')
      case 'linkedin':
        return lowerPrompt.includes('professional') || lowerPrompt.includes('business') || 
               lowerPrompt.includes('corporate')
      default:
        return true
    }
  }

  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      prompt_clarity: 0.20,
      technical_accuracy: 0.18,
      model_optimization: 0.16,
      platform_suitability: 0.14,
      consistency_score: 0.12,
      creativity_balance: 0.10,
      duplicate_detection: 0.10
    }

    return Math.round(
      metrics.prompt_clarity * weights.prompt_clarity +
      metrics.technical_accuracy * weights.technical_accuracy +
      metrics.model_optimization * weights.model_optimization +
      metrics.platform_suitability * weights.platform_suitability +
      metrics.consistency_score * weights.consistency_score +
      metrics.creativity_balance * weights.creativity_balance +
      metrics.duplicate_detection * weights.duplicate_detection
    )
  }

  private async generateRecommendations(
    context: ValidationContext,
    metrics: QualityMetrics,
    issues: ValidationIssue[]
  ): Promise<string[]> {
    const recommendations: string[] = []

    // Metric-based recommendations
    if (metrics.prompt_clarity < 80) {
      recommendations.push('Improve prompt clarity by adding more specific details and clearer instructions')
    }

    if (metrics.technical_accuracy < 80) {
      recommendations.push('Add more technical specifications appropriate for the selected model')
    }

    if (metrics.model_optimization < 80) {
      recommendations.push(`Optimize prompt specifically for ${context.selectedModel.name} requirements`)
    }

    if (metrics.platform_suitability < 80 && context.platform) {
      recommendations.push(`Add more ${context.platform}-specific optimizations and styling`)
    }

    if (metrics.duplicate_detection < 90) {
      recommendations.push('Remove duplicate terms and phrases to improve prompt efficiency')
    }

    // Issue-based recommendations
    issues.forEach(issue => {
      if (issue.fix_suggestion && issue.severity !== 'low') {
        recommendations.push(issue.fix_suggestion)
      }
    })

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Prompt quality is good - consider minor refinements for specific use cases')
    }

    return recommendations.slice(0, 5) // Limit to top 5 recommendations
  }

  private calculateQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private calculateConfidenceScore(metrics: QualityMetrics, issues: ValidationIssue[]): number {
    let confidence = 0.9

    // Reduce confidence for critical issues
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length
    const highIssues = issues.filter(issue => issue.severity === 'high').length

    confidence -= criticalIssues * 0.3
    confidence -= highIssues * 0.1

    // Adjust based on score variation
    const scores = [
      metrics.prompt_clarity,
      metrics.technical_accuracy,
      metrics.model_optimization,
      metrics.platform_suitability,
      metrics.consistency_score
    ]

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - avgScore, 2), 0) / scores.length
    const standardDeviation = Math.sqrt(variance)

    // Higher variance means lower confidence
    if (standardDeviation > 20) {
      confidence -= 0.2
    } else if (standardDeviation > 10) {
      confidence -= 0.1
    }

    return Math.max(0, Math.min(1, confidence))
  }

  private extractNumericScore(text: string, fallback: number): number {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const score = parseFloat(match[1]);
      return score <= 100 ? score : fallback;
    }
    return fallback;
  }

  private generateCacheKey(context: ValidationContext): string {
    const keyData = {
      enhancedPrompt: context.enhancedPrompt,
      model: context.selectedModel.id,
      platform: context.platform,
      outputType: context.outputType
    }
    return JSON.stringify(keyData)
  }

  // Public method to clear cache
  clearCache(): void {
    this.validationCache.clear()
    console.log('🗑️ [Quality Validation] Cache cleared')
  }

  // Public method to get cache stats
  getCacheStats(): { size: number, keys: string[] } {
    return {
      size: this.validationCache.size,
      keys: Array.from(this.validationCache.keys())
    }
  }
}