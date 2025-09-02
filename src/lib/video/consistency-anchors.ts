/**
 * Advanced Consistency Anchoring System
 * 
 * Ensures visual, character, and style consistency across multi-clip video generations
 * Leverages model-specific consistency features and advanced prompt engineering
 */

import { GeminiService, getGeminiService } from '../llm/gemini-service'
import { ModelCapabilities } from '../model-capabilities'
import { VideoClip, VideoStoryboard } from './story-segmentation'

export interface ConsistencyAnchor {
  id: string
  type: 'character' | 'environment' | 'style' | 'lighting' | 'color' | 'object'
  description: string
  promptTemplate: string
  modelSpecificOptimization: Record<string, string>
  strength: 'weak' | 'medium' | 'strong' | 'absolute'
  applicableClips: number[]
  referenceElements?: string[]
}

export interface ModelConsistencyFeatures {
  modelName: string
  characterConsistency: 'none' | 'basic' | 'good' | 'excellent'
  styleConsistency: 'none' | 'basic' | 'good' | 'excellent'
  environmentConsistency: 'none' | 'basic' | 'good' | 'excellent'
  supportedTechniques: string[]
  optimizationTips: string[]
  limitations: string[]
}

export interface ConsistencyProfile {
  anchors: ConsistencyAnchor[]
  modelFeatures: ModelConsistencyFeatures
  crossClipInstructions: string[]
  qualityExpectations: {
    characterConsistency: number  // 0-1 score
    styleConsistency: number      // 0-1 score
    environmentConsistency: number // 0-1 score
    overallConsistency: number    // 0-1 score
  }
  processingInsights: string[]
}

export interface EnhancedClipPrompt {
  originalPrompt: string
  enhancedPrompt: string
  consistencyInstructions: string[]
  negativePrompt: string
  modelSpecificParameters: Record<string, any>
  expectedConsistencyScore: number
  processingNotes: string[]
}

export class ConsistencyAnchorManager {
  private geminiService: GeminiService

  constructor(geminiService?: GeminiService) {
    this.geminiService = geminiService || getGeminiService()
  }

  /**
   * Main consistency processing - creates anchors and enhances all clip prompts
   */
  async processVideoConsistency(
    storyboard: VideoStoryboard,
    selectedModel: ModelCapabilities,
    basePrompt: string
  ): Promise<{
    consistencyProfile: ConsistencyProfile
    enhancedClips: EnhancedClipPrompt[]
  }> {
    console.log(`[ConsistencyAnchors] Processing consistency for ${storyboard.clips.length} clips`)

    try {
      // Analyze model consistency capabilities
      const modelFeatures = await this.analyzeModelConsistencyFeatures(selectedModel)
      
      // Extract consistency anchors from storyboard
      const anchors = await this.extractConsistencyAnchors(storyboard, basePrompt, modelFeatures)
      
      // Generate cross-clip instructions
      const crossClipInstructions = await this.generateCrossClipInstructions(anchors, modelFeatures)
      
      // Enhance each clip with consistency
      const enhancedClips = await this.enhanceClipsWithConsistency(
        storyboard.clips, 
        anchors, 
        modelFeatures,
        crossClipInstructions
      )
      
      // Calculate quality expectations
      const qualityExpectations = this.calculateQualityExpectations(modelFeatures, anchors.length)
      
      const consistencyProfile: ConsistencyProfile = {
        anchors,
        modelFeatures,
        crossClipInstructions,
        qualityExpectations,
        processingInsights: [
          `Generated ${anchors.length} consistency anchors`,
          `Model consistency rating: ${modelFeatures.characterConsistency}`,
          `Expected overall consistency: ${(qualityExpectations.overallConsistency * 100).toFixed(0)}%`,
          `Optimized for ${modelFeatures.modelName}`
        ]
      }

      console.log(`[ConsistencyAnchors] Created ${anchors.length} anchors with ${qualityExpectations.overallConsistency.toFixed(2)} expected consistency`)
      
      return {
        consistencyProfile,
        enhancedClips
      }

    } catch (error) {
      console.error('[ConsistencyAnchors] Processing failed:', error)
      return this.createFallbackConsistency(storyboard, selectedModel)
    }
  }

  /**
   * Analyze model-specific consistency capabilities and features
   */
  private async analyzeModelConsistencyFeatures(model: ModelCapabilities): Promise<ModelConsistencyFeatures> {
    const systemPrompt = `You are an AI model consistency expert specializing in ${model.name} by ${model.provider}.

MODEL SPECIFICATIONS:
- Model: ${model.name}
- Type: ${model.type}
- Character Consistency: ${model.special_features?.character_consistency || 'unknown'}
- Text Rendering: ${model.special_features?.text_rendering || 'unknown'}
- Style Transfer: ${model.special_features?.style_transfer || false}

ANALYSIS TASK:
Analyze this model's consistency capabilities and provide optimization strategies for multi-clip video generation.

Consider:
1. How well does this model maintain character appearance across clips?
2. What are the best techniques for style consistency?
3. How does environment consistency work with this model?
4. What are model-specific optimization tips?
5. What are the known limitations?

Return JSON format:
{
  "character_consistency_rating": "none|basic|good|excellent",
  "style_consistency_rating": "none|basic|good|excellent", 
  "environment_consistency_rating": "none|basic|good|excellent",
  "supported_techniques": ["technique1", "technique2", "..."],
  "optimization_tips": ["tip1", "tip2", "..."],
  "limitations": ["limitation1", "limitation2", "..."]
}`

    try {
      const response = await this.geminiService.generateText(
        `Analyze consistency features for ${model.name}`,
        {
          systemPrompt,
          temperature: 0.2,
          maxTokens: 1200
        }
      )

      const analysis = this.parseJsonResponse(response.text)
      
      return {
        modelName: model.name,
        characterConsistency: analysis.character_consistency_rating || model.special_features?.character_consistency || 'basic',
        styleConsistency: analysis.style_consistency_rating || 'basic',
        environmentConsistency: analysis.environment_consistency_rating || 'basic',
        supportedTechniques: analysis.supported_techniques || ['basic_prompting'],
        optimizationTips: analysis.optimization_tips || [],
        limitations: analysis.limitations || []
      }
    } catch (error) {
      console.error('[ConsistencyAnchors] Model analysis failed:', error)
      return this.createFallbackModelFeatures(model)
    }
  }

  /**
   * Extract and create consistency anchors from the storyboard
   */
  private async extractConsistencyAnchors(
    storyboard: VideoStoryboard,
    basePrompt: string,
    modelFeatures: ModelConsistencyFeatures
  ): Promise<ConsistencyAnchor[]> {
    const systemPrompt = `You are a consistency anchor specialist for AI video generation. Create detailed consistency anchors that will ensure visual coherence across ${storyboard.clips.length} video clips.

BASE CONCEPT: "${basePrompt}"
MODEL: ${modelFeatures.modelName}
MODEL CAPABILITIES: Character=${modelFeatures.characterConsistency}, Style=${modelFeatures.styleConsistency}

STORYBOARD CLIPS:
${storyboard.clips.map(clip => `Clip ${clip.clipNumber}: ${clip.sceneType} - ${clip.prompt.substring(0, 100)}...`).join('\n')}

CONSISTENCY PROFILE:
- Character: ${storyboard.consistencyProfile.characterDescription || 'Not specified'}
- Environment: ${storyboard.consistencyProfile.environmentDescription || 'Not specified'}
- Style: ${storyboard.consistencyProfile.styleDescription || 'Not specified'}
- Color: ${storyboard.consistencyProfile.colorPalette || 'Not specified'}
- Lighting: ${storyboard.consistencyProfile.lightingMood || 'Not specified'}

ANCHOR CREATION TASK:
Create 3-6 consistency anchors that will maintain visual coherence across all clips. Focus on the most important elements for this specific video.

For each anchor, provide:
1. Detailed description of what to keep consistent
2. Prompt template to apply to each clip
3. Model-specific optimization for ${modelFeatures.modelName}
4. Strength level (weak/medium/strong/absolute)

Return JSON format:
{
  "anchors": [
    {
      "type": "character|environment|style|lighting|color|object",
      "description": "detailed description of what stays consistent",
      "prompt_template": "template to add to each clip prompt",
      "model_optimization": "specific optimization for this model",
      "strength": "weak|medium|strong|absolute",
      "applicable_clips": [1, 2, 3, 4, 5],
      "reference_elements": ["element1", "element2"]
    }
  ]
}`

    try {
      const response = await this.geminiService.generateText(
        'Extract consistency anchors from storyboard',
        {
          systemPrompt,
          temperature: 0.4,
          maxTokens: 2000
        }
      )

      const extraction = this.parseJsonResponse(response.text)
      const anchors: ConsistencyAnchor[] = []

      if (extraction.anchors && Array.isArray(extraction.anchors)) {
        extraction.anchors.forEach((anchor: any, index: number) => {
          anchors.push({
            id: `anchor_${index + 1}`,
            type: anchor.type || 'style',
            description: anchor.description || 'Basic consistency',
            promptTemplate: anchor.prompt_template || '',
            modelSpecificOptimization: {
              [modelFeatures.modelName]: anchor.model_optimization || ''
            },
            strength: anchor.strength || 'medium',
            applicableClips: anchor.applicable_clips || Array.from({length: storyboard.clips.length}, (_, i) => i + 1),
            referenceElements: anchor.reference_elements || []
          })
        })
      }

      console.log(`[ConsistencyAnchors] Extracted ${anchors.length} consistency anchors`)
      return anchors

    } catch (error) {
      console.error('[ConsistencyAnchors] Anchor extraction failed:', error)
      return this.createFallbackAnchors(storyboard, modelFeatures)
    }
  }

  /**
   * Generate cross-clip consistency instructions
   */
  private async generateCrossClipInstructions(
    anchors: ConsistencyAnchor[],
    modelFeatures: ModelConsistencyFeatures
  ): Promise<string[]> {
    const systemPrompt = `You are a video consistency expert. Generate specific cross-clip instructions for maintaining consistency using ${modelFeatures.modelName}.

CONSISTENCY ANCHORS:
${anchors.map(anchor => `${anchor.type.toUpperCase()}: ${anchor.description}`).join('\n')}

MODEL CAPABILITIES:
- Character Consistency: ${modelFeatures.characterConsistency}
- Supported Techniques: ${modelFeatures.supportedTechniques.join(', ')}

INSTRUCTION GENERATION:
Create 3-5 specific instructions that will be applied across all clips to maintain consistency. Focus on actionable, model-specific techniques.

Return JSON format:
{
  "instructions": [
    "specific instruction 1 for cross-clip consistency",
    "specific instruction 2 for maintaining visual coherence",
    "specific instruction 3 for model optimization",
    "..."
  ]
}`

    try {
      const response = await this.geminiService.generateText(
        'Generate cross-clip consistency instructions',
        {
          systemPrompt,
          temperature: 0.3,
          maxTokens: 1000
        }
      )

      const generation = this.parseJsonResponse(response.text)
      return generation.instructions || ['Maintain visual consistency across clips']
    } catch (error) {
      console.error('[ConsistencyAnchors] Cross-clip instructions failed:', error)
      return ['Maintain consistent character appearance', 'Keep same visual style', 'Use same lighting mood']
    }
  }

  /**
   * Enhance each clip with consistency anchoring
   */
  private async enhanceClipsWithConsistency(
    clips: VideoClip[],
    anchors: ConsistencyAnchor[],
    modelFeatures: ModelConsistencyFeatures,
    crossClipInstructions: string[]
  ): Promise<EnhancedClipPrompt[]> {
    const enhancedClips: EnhancedClipPrompt[] = []

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const applicableAnchors = anchors.filter(anchor => 
        anchor.applicableClips.includes(clip.clipNumber)
      )

      const systemPrompt = `You are a video consistency specialist enhancing clip ${clip.clipNumber} of ${clips.length} for ${modelFeatures.modelName}.

CLIP DETAILS:
- Original Prompt: "${clip.prompt}"
- Scene Type: ${clip.sceneType}
- Duration: ${clip.duration}s
- Focus: ${clip.focusElement}
- Camera: ${clip.cameraMovement}

CONSISTENCY ANCHORS TO APPLY:
${applicableAnchors.map(anchor => 
  `${anchor.type.toUpperCase()}: ${anchor.description}\nTemplate: ${anchor.promptTemplate}\nOptimization: ${anchor.modelSpecificOptimization[modelFeatures.modelName] || ''}`
).join('\n\n')}

CROSS-CLIP INSTRUCTIONS:
${crossClipInstructions.join('\n')}

MODEL OPTIMIZATION:
- Character Consistency: ${modelFeatures.characterConsistency}
- Optimization Tips: ${modelFeatures.optimizationTips.join(', ')}

ENHANCEMENT TASK:
1. Enhance the original prompt with consistency anchors
2. Add model-specific optimizations
3. Create negative prompt for quality control
4. Add specific consistency instructions
5. Set expected consistency score (0-1)

Return JSON format:
{
  "enhanced_prompt": "original prompt enhanced with consistency anchors and optimizations",
  "negative_prompt": "negative prompt to avoid consistency issues",
  "consistency_instructions": ["instruction1", "instruction2", "..."],
  "model_specific_parameters": {
    "parameter1": "value1",
    "parameter2": "value2"
  },
  "expected_consistency_score": 0.85,
  "processing_notes": ["note1", "note2", "..."]
}`

      try {
        const response = await this.geminiService.generateText(
          `Enhance clip ${clip.clipNumber} with consistency`,
          {
            systemPrompt,
            temperature: 0.3,
            maxTokens: 1500
          }
        )

        const enhancement = this.parseJsonResponse(response.text)

        enhancedClips.push({
          originalPrompt: clip.prompt,
          enhancedPrompt: enhancement.enhanced_prompt || clip.prompt,
          consistencyInstructions: enhancement.consistency_instructions || crossClipInstructions,
          negativePrompt: enhancement.negative_prompt || 'inconsistent, different character, style variations',
          modelSpecificParameters: enhancement.model_specific_parameters || {},
          expectedConsistencyScore: enhancement.expected_consistency_score || 0.8,
          processingNotes: enhancement.processing_notes || []
        })

        console.log(`[ConsistencyAnchors] Enhanced clip ${clip.clipNumber} with ${applicableAnchors.length} anchors`)

      } catch (error) {
        console.error(`[ConsistencyAnchors] Failed to enhance clip ${clip.clipNumber}:`, error)
        enhancedClips.push(this.createFallbackEnhancedClip(clip, crossClipInstructions))
      }
    }

    return enhancedClips
  }

  // Utility methods

  private calculateQualityExpectations(
    modelFeatures: ModelConsistencyFeatures,
    anchorCount: number
  ): ConsistencyProfile['qualityExpectations'] {
    const characterScore = this.mapConsistencyRating(modelFeatures.characterConsistency)
    const styleScore = this.mapConsistencyRating(modelFeatures.styleConsistency)
    const environmentScore = this.mapConsistencyRating(modelFeatures.environmentConsistency)
    
    // Bonus for more anchors (up to 0.1 boost)
    const anchorBonus = Math.min(anchorCount * 0.02, 0.1)
    
    return {
      characterConsistency: Math.min(characterScore + anchorBonus, 1.0),
      styleConsistency: Math.min(styleScore + anchorBonus, 1.0),
      environmentConsistency: Math.min(environmentScore + anchorBonus, 1.0),
      overallConsistency: Math.min((characterScore + styleScore + environmentScore) / 3 + anchorBonus, 1.0)
    }
  }

  private mapConsistencyRating(rating: string): number {
    const mapping = {
      'none': 0.3,
      'basic': 0.5,
      'good': 0.7,
      'excellent': 0.9
    }
    return mapping[rating] || 0.6
  }

  private parseJsonResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return JSON.parse(response)
    } catch (error) {
      console.error('[ConsistencyAnchors] JSON parsing failed:', error)
      return {}
    }
  }

  private createFallbackModelFeatures(model: ModelCapabilities): ModelConsistencyFeatures {
    return {
      modelName: model.name,
      characterConsistency: model.special_features?.character_consistency || 'basic',
      styleConsistency: 'basic',
      environmentConsistency: 'basic',
      supportedTechniques: ['basic_prompting', 'negative_prompting'],
      optimizationTips: ['Use consistent character descriptions', 'Maintain same lighting'],
      limitations: ['May vary between clips', 'Requires careful prompting']
    }
  }

  private createFallbackAnchors(
    storyboard: VideoStoryboard,
    modelFeatures: ModelConsistencyFeatures
  ): ConsistencyAnchor[] {
    const clipCount = storyboard.clips.length
    const allClips = Array.from({length: clipCount}, (_, i) => i + 1)

    return [
      {
        id: 'anchor_character',
        type: 'character',
        description: 'Maintain same character appearance throughout',
        promptTemplate: 'same character as previous clip',
        modelSpecificOptimization: {
          [modelFeatures.modelName]: 'use character consistency features'
        },
        strength: 'strong',
        applicableClips: allClips,
        referenceElements: ['face', 'clothing', 'hair']
      },
      {
        id: 'anchor_style',
        type: 'style',
        description: 'Consistent visual style and aesthetic',
        promptTemplate: 'same visual style and aesthetic',
        modelSpecificOptimization: {
          [modelFeatures.modelName]: 'maintain style consistency'
        },
        strength: 'medium',
        applicableClips: allClips,
        referenceElements: ['color_palette', 'lighting', 'composition']
      }
    ]
  }

  private createFallbackEnhancedClip(
    clip: VideoClip,
    crossClipInstructions: string[]
  ): EnhancedClipPrompt {
    return {
      originalPrompt: clip.prompt,
      enhancedPrompt: `${clip.prompt}, maintaining visual consistency`,
      consistencyInstructions: crossClipInstructions,
      negativePrompt: 'inconsistent, different style, varying quality',
      modelSpecificParameters: {},
      expectedConsistencyScore: 0.7,
      processingNotes: ['Used fallback consistency enhancement']
    }
  }

  private createFallbackConsistency(
    storyboard: VideoStoryboard,
    selectedModel: ModelCapabilities
  ): { consistencyProfile: ConsistencyProfile; enhancedClips: EnhancedClipPrompt[] } {
    const modelFeatures = this.createFallbackModelFeatures(selectedModel)
    const anchors = this.createFallbackAnchors(storyboard, modelFeatures)
    const crossClipInstructions = ['Maintain visual consistency', 'Keep same character', 'Use same style']
    
    const enhancedClips = storyboard.clips.map(clip => 
      this.createFallbackEnhancedClip(clip, crossClipInstructions)
    )

    return {
      consistencyProfile: {
        anchors,
        modelFeatures,
        crossClipInstructions,
        qualityExpectations: this.calculateQualityExpectations(modelFeatures, anchors.length),
        processingInsights: ['Used fallback consistency processing']
      },
      enhancedClips
    }
  }
}

export default ConsistencyAnchorManager