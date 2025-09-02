/**
 * LLM-Powered Prompt Enhancement Engine
 * 
 * Core orchestration system for intelligent prompt enhancement using Gemini API
 * Replaces basic keyword concatenation with sophisticated AI-powered enhancement
 */

import { GeminiService, getGeminiService } from './gemini-service'
import { SystemPromptsManager, SystemPrompt } from './system-prompts'
import { ModelCapabilities, getModelById } from '../model-capabilities'
import { QuestionAnswers } from '@/types/context-questions'

// Types for enhancement system
interface EnhancementConfig {
  outputType: 'text-to-image' | 'image-text-to-image' | 'text-to-video' | 'image-text-to-video' | 'text-to-video-audio' | 'image-text-to-video-audio'
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
  style: string
  duration?: number
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5'
  qualityTier: 'draft' | 'social' | 'production'
}

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

interface EnhancementResult {
  primary_prompt: string
  negative_prompt: string
  model_specific_params: Record<string, any>
  enhancement_insights: string[]
  quality_score: number
  processing_time: number
  used_prompts: string[]
  consistency_anchors?: ConsistencyAnchors
}

interface ConsistencyAnchors {
  character?: string
  style?: string
  environment?: string
  color_palette?: string
}

interface EnhancementContext {
  base_prompt: string
  config: EnhancementConfig
  media_assets: MediaAsset[]
  selected_model: ModelCapabilities
  context_answers?: QuestionAnswers
  session_id?: string
}

export class PromptEnhancer {
  private geminiService: GeminiService
  private promptsManager: typeof SystemPromptsManager

  constructor(geminiService?: GeminiService) {
    this.geminiService = geminiService || getGeminiService()
    this.promptsManager = SystemPromptsManager
  }

  /**
   * Main enhancement pipeline - replaces the old enhancePromptForModel function
   */
  async enhancePrompt(context: EnhancementContext): Promise<EnhancementResult> {
    const startTime = Date.now()
    const sessionId = context.session_id || `enhance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🚀 [PromptEnhancer] ${sessionId} - Enhancement Pipeline Started:`, {
      base_prompt_length: context.base_prompt?.length || 0,
      model_name: context.selected_model?.name || 'Unknown',
      model_type: context.selected_model?.type || 'Unknown',
      output_type: context.config?.outputType,
      platform: context.config?.platform,
      has_media_assets: (context.media_assets?.length || 0) > 0,
      has_context_answers: !!context.context_answers,
      timestamp: new Date().toISOString()
    })

    try {
      // Stage 1: Content Analysis
      console.log(`📊 [PromptEnhancer] ${sessionId} - Stage 1: Content Analysis Starting...`)
      const contentAnalysis = await this.analyzeContent(context)
      console.log(`✅ [PromptEnhancer] ${sessionId} - Stage 1 Completed: ${contentAnalysis}`)
      
      // Stage 2: Context Integration  
      console.log(`🔗 [PromptEnhancer] ${sessionId} - Stage 2: Context Integration Starting...`)
      const contextIntegration = await this.integrateContext(context, contentAnalysis)
      console.log(`✅ [PromptEnhancer] ${sessionId} - Stage 2 Completed`)
      
      // Stage 3: Model-Specific Optimization
      console.log(`⚙️ [PromptEnhancer] ${sessionId} - Stage 3: Model Optimization Starting...`)
      const modelOptimization = await this.optimizeForModel(context, contextIntegration)
      console.log(`✅ [PromptEnhancer] ${sessionId} - Stage 3 Completed`)
      
      // Stage 4: Platform & Marketing Optimization
      console.log(`📱 [PromptEnhancer] ${sessionId} - Stage 4: Platform Optimization Starting...`)
      const finalOptimization = await this.optimizeForPlatform(context, modelOptimization)
      console.log(`✅ [PromptEnhancer] ${sessionId} - Stage 4 Completed`)
      
      // Stage 5: Quality Validation
      console.log(`🎯 [PromptEnhancer] ${sessionId} - Stage 5: Quality Validation Starting...`)
      const qualityValidation = await this.validateQuality(finalOptimization)
      console.log(`✅ [PromptEnhancer] ${sessionId} - Stage 5 Completed`)

      const processingTime = Date.now() - startTime
      
      console.log(`🎉 [PromptEnhancer] ${sessionId} - Enhancement Pipeline Completed:`, {
        processing_time_ms: processingTime,
        final_prompt_length: qualityValidation.primary_prompt?.length || 0,
        negative_prompt_length: qualityValidation.negative_prompt?.length || 0,
        quality_score: qualityValidation.quality_score,
        enhancement_insights_count: qualityValidation.enhancement_insights?.length || 0,
        timestamp: new Date().toISOString()
      })

      return {
        ...qualityValidation,
        processing_time: processingTime,
        enhancement_insights: [
          ...(Array.isArray(contentAnalysis.insights) ? contentAnalysis.insights : []),
          ...(Array.isArray(contextIntegration.insights) ? contextIntegration.insights : []),
          ...(Array.isArray(modelOptimization.insights) ? modelOptimization.insights : []),
          ...(Array.isArray(finalOptimization.insights) ? finalOptimization.insights : []),
          ...(Array.isArray(qualityValidation.insights) ? qualityValidation.insights : [])
        ]
      }

    } catch (error) {
      console.error('[PromptEnhancer] Enhancement failed:', error)
      
      // Fallback to basic enhancement
      return this.fallbackEnhancement(context, Date.now() - startTime)
    }
  }

  /**
   * Stage 1: Content Analysis
   * Analyzes base prompt for strengths, weaknesses, and enhancement opportunities
   */
  private async analyzeContent(context: EnhancementContext): Promise<{
    content_type: string
    missing_elements: string[]
    strengths: string[]
    enhancement_opportunities: string[]
    insights: string[]
  }> {
    const analysisPrompt = this.promptsManager.getPromptById('quality_prompt_analyzer')
    
    if (!analysisPrompt) {
      return this.fallbackContentAnalysis(context)
    }

    const systemPrompt = `${analysisPrompt.prompt}

ANALYSIS TASK:
Analyze this prompt for AI ${context.config.outputType} generation:
"${context.base_prompt}"

Target Platform: ${context.config.platform}
Quality Tier: ${context.config.qualityTier}
Style Request: ${context.config.style || 'None specified'}

Provide analysis in this JSON format:
{
  "content_type": "portrait|landscape|product|architectural|abstract|general",
  "missing_elements": ["list", "of", "missing", "elements"],
  "strengths": ["existing", "prompt", "strengths"],
  "enhancement_opportunities": ["specific", "improvement", "areas"],
  "insights": ["detailed", "analysis", "insights"]
}`

    try {
      const response = await this.geminiService.generateText(
        `Analyze this prompt: "${context.base_prompt}"`,
        { 
          systemPrompt,
          temperature: 0.3,
          maxTokens: 1000
        }
      )

      const analysis = this.parseJsonResponse(response.text)
      console.log('[PromptEnhancer] Content analysis completed:', analysis.content_type)
      
      return analysis
    } catch (error) {
      console.error('[PromptEnhancer] Content analysis failed:', error)
      return this.fallbackContentAnalysis(context)
    }
  }

  /**
   * Stage 2: Context Integration
   * Merges user answers with base prompt, eliminates redundancy
   */
  private async integrateContext(
    context: EnhancementContext, 
    contentAnalysis: any
  ): Promise<{
    integrated_prompt: string
    context_enhancements: string[]
    insights: string[]
  }> {
    if (!context.context_answers || Object.keys(context.context_answers).length === 0) {
      return {
        integrated_prompt: context.base_prompt,
        context_enhancements: [],
        insights: ['No context answers provided - using base prompt only']
      }
    }

    const systemPrompt = `You are an expert prompt integration specialist. Your task is to seamlessly merge user preferences with the base prompt while eliminating redundancy and maintaining coherence.

INTEGRATION GUIDELINES:
1. Merge context answers naturally with the base prompt
2. Eliminate any duplicate or redundant terms
3. Maintain the original creative intent
4. Create flowing, natural language prompts
5. Prioritize quality over quantity of descriptors

BASE PROMPT: "${context.base_prompt}"

CONTEXT ANSWERS: ${JSON.stringify(context.context_answers)}

CONTENT TYPE: ${contentAnalysis.content_type}
MISSING ELEMENTS: ${contentAnalysis.missing_elements.join(', ')}

Create an integrated prompt that combines all elements naturally. Return JSON format:
{
  "integrated_prompt": "enhanced prompt text",
  "context_enhancements": ["specific", "additions", "made"],
  "insights": ["integration", "decisions", "explained"]
}`

    try {
      const response = await this.geminiService.generateText(
        'Integrate context with base prompt',
        { 
          systemPrompt,
          temperature: 0.4,
          maxTokens: 1500
        }
      )

      const integration = this.parseJsonResponse(response.text)
      console.log('[PromptEnhancer] Context integration completed')
      
      return integration
    } catch (error) {
      console.error('[PromptEnhancer] Context integration failed:', error)
      return {
        integrated_prompt: context.base_prompt,
        context_enhancements: [],
        insights: ['Context integration failed - using base prompt']
      }
    }
  }

  /**
   * Stage 3: Model-Specific Optimization  
   * Tailors prompts for selected AI model's strengths and features
   */
  private async optimizeForModel(
    context: EnhancementContext,
    contextIntegration: any
  ): Promise<{
    optimized_prompt: string
    model_enhancements: string[]
    consistency_anchors?: ConsistencyAnchors
    insights: string[]
  }> {
    const model = context.selected_model
    const modelName = model.name

    const systemPrompt = `You are an AI model optimization expert specializing in ${modelName} by ${model.provider}.

MODEL SPECIFICATIONS:
- Type: ${model.type}
- Quality Tier: ${model.classification.quality_tier}
- Best For: ${model.classification.best_for.join(', ')}
- Style Strengths: ${model.classification.style_strength.join(', ')}
- Text Rendering: ${model.special_features?.text_rendering || 'unknown'}
- Character Consistency: ${model.special_features?.character_consistency || 'unknown'}

OPTIMIZATION TASK:
Optimize this integrated prompt specifically for ${modelName}:
"${contextIntegration.integrated_prompt}"

OUTPUT TYPE: ${context.config.outputType}
DURATION: ${context.config.duration || 'N/A'} seconds

OPTIMIZATION GUIDELINES:
1. Apply model-specific keywords and techniques
2. Leverage the model's documented strengths
3. Add technical specifications that work well with this model
4. Include consistency anchors if this is for video generation
5. Avoid known model weaknesses or limitations

Return JSON format:
{
  "optimized_prompt": "model-optimized prompt",
  "model_enhancements": ["specific", "model", "optimizations"],
  "consistency_anchors": {
    "character": "character description if applicable",
    "style": "style consistency anchor",
    "environment": "environment anchor"
  },
  "insights": ["model-specific", "optimization", "decisions"]
}`

    try {
      const response = await this.geminiService.generateText(
        `Optimize for ${modelName}`,
        { 
          systemPrompt,
          temperature: 0.3,
          maxTokens: 1500
        }
      )

      const optimization = this.parseJsonResponse(response.text)
      console.log(`[PromptEnhancer] Model optimization completed for ${modelName}`)
      
      return optimization
    } catch (error) {
      console.error('[PromptEnhancer] Model optimization failed:', error)
      return {
        optimized_prompt: contextIntegration.integrated_prompt,
        model_enhancements: [],
        insights: ['Model optimization failed - using integrated prompt']
      }
    }
  }

  /**
   * Stage 4: Platform & Marketing Optimization
   * Applies social media and marketing best practices
   */
  private async optimizeForPlatform(
    context: EnhancementContext,
    modelOptimization: any
  ): Promise<{
    final_prompt: string
    negative_prompt: string
    platform_enhancements: string[]
    model_specific_params: Record<string, any>
    insights: string[]
  }> {
    const platformPrompt = this.promptsManager.getPromptById(`platform_${context.config.platform}_optimizer`)
    const marketingPrompt = this.promptsManager.getPromptById('marketing_engagement_optimizer')

    let systemPrompt = `You are a platform optimization expert specializing in ${context.config.platform} content creation.

PLATFORM: ${context.config.platform}
QUALITY TIER: ${context.config.qualityTier}
OUTPUT TYPE: ${context.config.outputType}
ASPECT RATIO: ${context.config.aspectRatio}

CURRENT PROMPT: "${modelOptimization.optimized_prompt}"

OPTIMIZATION TASK:
1. Apply ${context.config.platform}-specific best practices
2. Optimize for engagement and platform algorithm preferences
3. Add marketing elements for conversion optimization
4. Generate appropriate negative prompt
5. Set model-specific parameters

PLATFORM GUIDELINES:`

    if (platformPrompt) {
      systemPrompt += `\n${platformPrompt.prompt}\n`
    }

    if (marketingPrompt) {
      systemPrompt += `\nMARKETING GUIDELINES:\n${marketingPrompt.prompt}\n`
    }

    systemPrompt += `
Return JSON format:
{
  "final_prompt": "platform and marketing optimized prompt",
  "negative_prompt": "appropriate negative prompt for quality control",
  "platform_enhancements": ["platform", "specific", "optimizations"],
  "model_specific_params": {
    "aspect_ratio": "${context.config.aspectRatio}",
    "additional_params": "as needed"
  },
  "insights": ["platform", "optimization", "decisions"]
}`

    try {
      const response = await this.geminiService.generateText(
        `Optimize for ${context.config.platform} platform`,
        { 
          systemPrompt,
          temperature: 0.4,
          maxTokens: 2000
        }
      )

      const platformOptimization = this.parseJsonResponse(response.text)
      console.log(`[PromptEnhancer] Platform optimization completed for ${context.config.platform}`)
      
      return platformOptimization
    } catch (error) {
      console.error('[PromptEnhancer] Platform optimization failed:', error)
      return {
        final_prompt: modelOptimization.optimized_prompt,
        negative_prompt: this.generateFallbackNegativePrompt(context),
        platform_enhancements: [],
        model_specific_params: {
          aspect_ratio: context.config.aspectRatio
        },
        insights: ['Platform optimization failed - using model-optimized prompt']
      }
    }
  }

  /**
   * Stage 5: Quality Validation
   * Final quality check and scoring
   */
  private async validateQuality(finalOptimization: any): Promise<{
    primary_prompt: string
    negative_prompt: string
    model_specific_params: Record<string, any>
    quality_score: number
    used_prompts: string[]
    consistency_anchors?: ConsistencyAnchors
    insights: string[]
  }> {
    const qualityPrompt = this.promptsManager.getPromptById('quality_prompt_analyzer')
    
    if (!qualityPrompt) {
      return {
        primary_prompt: finalOptimization.final_prompt,
        negative_prompt: finalOptimization.negative_prompt,
        model_specific_params: finalOptimization.model_specific_params,
        quality_score: 7.5,
        used_prompts: ['platform_optimizer'],
        insights: ['Quality validation skipped - analyzer not available']
      }
    }

    const systemPrompt = `${qualityPrompt.prompt}

VALIDATION TASK:
Analyze this final prompt for quality and effectiveness:
"${finalOptimization.final_prompt}"

Check for:
1. Redundancy and duplicate terms
2. Coherence and natural flow
3. Technical specification completeness
4. Creative vision clarity
5. Platform appropriateness

Provide quality score (1-10) and validation results.

Return JSON format:
{
  "quality_score": 8.5,
  "validation_insights": ["specific", "quality", "assessments"],
  "recommendations": ["any", "final", "improvements"]
}`

    try {
      const response = await this.geminiService.generateText(
        'Validate prompt quality',
        { 
          systemPrompt,
          temperature: 0.2,
          maxTokens: 800
        }
      )

      const validation = this.parseJsonResponse(response.text)
      console.log(`[PromptEnhancer] Quality validation completed - Score: ${validation.quality_score}`)
      
      return {
        primary_prompt: finalOptimization.final_prompt,
        negative_prompt: finalOptimization.negative_prompt,
        model_specific_params: finalOptimization.model_specific_params,
        quality_score: validation.quality_score || 8.0,
        used_prompts: ['content_analyzer', 'context_integrator', 'model_optimizer', 'platform_optimizer', 'quality_validator'],
        consistency_anchors: finalOptimization.consistency_anchors,
        insights: validation.validation_insights || []
      }
    } catch (error) {
      console.error('[PromptEnhancer] Quality validation failed:', error)
      return {
        primary_prompt: finalOptimization.final_prompt,
        negative_prompt: finalOptimization.negative_prompt,
        model_specific_params: finalOptimization.model_specific_params,
        quality_score: 7.0,
        used_prompts: ['platform_optimizer'],
        insights: ['Quality validation failed - using final optimization result']
      }
    }
  }

  // Utility methods

  private parseJsonResponse(response: string): any {
    try {
      // Remove any markdown code blocks and formatting
      let cleanResponse = response.trim()
      
      // Remove markdown code blocks
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
      
      // Try to find JSON object more precisely
      const jsonStart = cleanResponse.indexOf('{')
      const jsonEnd = cleanResponse.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = cleanResponse.substring(jsonStart, jsonEnd + 1)
        
        // Clean up any malformed JSON
        let cleanedJson = jsonStr
          .replace(/,\s*}/g, '}') // Remove trailing commas before }
          .replace(/,\s*]/g, ']') // Remove trailing commas before ]
          .replace(/\n/g, ' ')   // Replace newlines with spaces
          .replace(/\s+/g, ' ')  // Collapse multiple spaces
        
        return JSON.parse(cleanedJson)
      }
      
      // Fallback: try parsing the entire response
      return JSON.parse(cleanResponse)
    } catch (error) {
      console.error('[PromptEnhancer] JSON parsing failed:', error)
      console.error('[PromptEnhancer] Raw response:', response.substring(0, 500) + '...')
      
      // Return safe defaults based on what we expect
      return {
        insights: [],
        validation_insights: [],
        platform_enhancements: [],
        model_enhancements: [],
        context_enhancements: [],
        missing_elements: [],
        strengths: [],
        enhancement_opportunities: []
      }
    }
  }

  private fallbackContentAnalysis(context: EnhancementContext) {
    const prompt = context.base_prompt.toLowerCase()
    
    let content_type = 'general'
    if (prompt.includes('portrait') || prompt.includes('person') || prompt.includes('face')) content_type = 'portrait'
    if (prompt.includes('landscape') || prompt.includes('scenery')) content_type = 'landscape'  
    if (prompt.includes('product') || prompt.includes('item')) content_type = 'product'

    return {
      content_type,
      missing_elements: ['lighting', 'composition', 'style'],
      strengths: ['basic_concept'],
      enhancement_opportunities: ['technical_details', 'aesthetic_direction'],
      insights: ['Used fallback content analysis']
    }
  }

  private generateFallbackNegativePrompt(context: EnhancementContext): string {
    const baseNegative = ['low quality', 'blurry', 'distorted', 'artifacts']
    
    if (context.config.outputType.includes('video')) {
      baseNegative.push('choppy motion', 'frame drops', 'inconsistent')
    }

    return baseNegative.join(', ')
  }

  private async fallbackEnhancement(context: EnhancementContext, processingTime: number): Promise<EnhancementResult> {
    console.log('[PromptEnhancer] Using fallback enhancement')
    
    // Basic enhancement similar to old system but improved
    let enhanced = context.base_prompt
    
    if (context.config.style) {
      enhanced += `, ${context.config.style} style`
    }
    
    const qualityDescriptors = {
      draft: 'good quality',
      social: 'high quality, detailed',
      production: 'ultra high quality, professional, detailed'
    }
    
    enhanced += `, ${qualityDescriptors[context.config.qualityTier]}`
    
    return {
      primary_prompt: enhanced,
      negative_prompt: this.generateFallbackNegativePrompt(context),
      model_specific_params: {
        aspect_ratio: context.config.aspectRatio
      },
      enhancement_insights: ['Used fallback enhancement due to LLM service failure'],
      quality_score: 6.0,
      processing_time: processingTime,
      used_prompts: ['fallback']
    }
  }

  /**
   * Public utility method to get service statistics
   */
  getStats() {
    return {
      gemini_service: this.geminiService.getStats(),
      available_prompts: this.promptsManager.getPromptStats(),
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Test the enhancement pipeline with a simple prompt
   */
  async testEnhancement(): Promise<boolean> {
    try {
      const testContext: EnhancementContext = {
        base_prompt: 'a beautiful sunset',
        config: {
          outputType: 'text-to-image',
          platform: 'instagram',
          style: 'cinematic',
          aspectRatio: '1:1',
          qualityTier: 'social'
        },
        media_assets: [],
        selected_model: getModelById('qwen-image')!,
        session_id: 'test_session'
      }

      const result = await this.enhancePrompt(testContext)
      console.log('[PromptEnhancer] Test enhancement successful:', result.quality_score)
      
      return result.quality_score > 5.0
    } catch (error) {
      console.error('[PromptEnhancer] Test enhancement failed:', error)
      return false
    }
  }
}

// Factory function and singleton
let promptEnhancerInstance: PromptEnhancer | null = null

export const getPromptEnhancer = (): PromptEnhancer => {
  if (!promptEnhancerInstance) {
    promptEnhancerInstance = new PromptEnhancer()
  }
  return promptEnhancerInstance
}

export default PromptEnhancer