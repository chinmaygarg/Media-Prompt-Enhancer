import { VideoStoryboard, EnhancedClipPrompt, ConsistencyProfile } from './types'
import { ModelCapabilities } from '../model-capabilities'
import { GeminiService } from '../llm/gemini-service'
import SystemPromptsManager from '../llm/system-prompts'

export interface SequentialPromptRequest {
  storyboard: VideoStoryboard
  consistencyProfile: ConsistencyProfile
  enhancedClips: EnhancedClipPrompt[]
  selectedModel: ModelCapabilities
  basePrompt: string
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
  style?: string
  mood?: string
  targetAudience?: string
}

export interface ClipPromptGeneration {
  clipIndex: number
  clipId: string
  mainPrompt: string
  consistencyInstructions: string[]
  transitionInstructions?: string
  modelSpecificOptimizations: string[]
  qualityAnchors: string[]
  technicalSpecs: {
    duration: number
    aspectRatio: string
    fps?: number
    resolution?: string
  }
  metadata: {
    storyPosition: 'opening' | 'development' | 'climax' | 'resolution'
    emotionalTone: string
    keyVisualElements: string[]
    actionDescription: string
  }
}

export interface SequentialPromptResult {
  totalClips: number
  estimatedTotalDuration: number
  clipPrompts: ClipPromptGeneration[]
  globalConsistencyInstructions: string[]
  sequentialFlow: {
    narrativeProgression: string
    visualProgression: string
    emotionalProgression: string
  }
  qualityValidation: {
    consistencyScore: number
    narrativeCoherence: number
    technicalOptimization: number
    overallScore: number
  }
}

export class SequentialPromptGenerator {
  private geminiService: GeminiService

  constructor() {
    this.geminiService = new GeminiService()
  }

  async generateSequentialPrompts(
    request: SequentialPromptRequest
  ): Promise<SequentialPromptResult> {
    try {
      // Generate individual clip prompts
      const clipPrompts = await this.generateIndividualClipPrompts(request)
      
      // Apply sequential flow optimization
      const optimizedClips = await this.optimizeSequentialFlow(clipPrompts, request)
      
      // Generate global consistency instructions
      const globalInstructions = await this.generateGlobalConsistencyInstructions(request)
      
      // Create sequential flow description
      const sequentialFlow = await this.generateSequentialFlow(request, optimizedClips)
      
      // Validate quality and consistency
      const qualityValidation = await this.validateSequentialQuality(optimizedClips, request)

      return {
        totalClips: optimizedClips.length,
        estimatedTotalDuration: optimizedClips.reduce((total, clip) => total + clip.technicalSpecs.duration, 0),
        clipPrompts: optimizedClips,
        globalConsistencyInstructions: globalInstructions,
        sequentialFlow,
        qualityValidation
      }
    } catch (error) {
      console.error('Error in sequential prompt generation:', error)
      throw new Error(`Sequential prompt generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async generateIndividualClipPrompts(
    request: SequentialPromptRequest
  ): Promise<ClipPromptGeneration[]> {
    const clipPrompts: ClipPromptGeneration[] = []

    for (let i = 0; i < request.enhancedClips.length; i++) {
      const clip = request.enhancedClips[i]
      const storyboardClip = request.storyboard.clips[i]
      
      // Generate main prompt for this clip
      const mainPrompt = await this.generateClipMainPrompt(clip, request, i)
      
      // Generate consistency instructions specific to this clip
      const consistencyInstructions = await this.generateClipConsistencyInstructions(
        clip, 
        request.consistencyProfile, 
        i,
        request.enhancedClips
      )
      
      // Generate transition instructions (if not the last clip)
      const transitionInstructions = i < request.enhancedClips.length - 1 
        ? await this.generateTransitionInstructions(clip, request.enhancedClips[i + 1], request)
        : undefined
      
      // Generate model-specific optimizations
      const modelOptimizations = await this.generateModelSpecificOptimizations(
        clip,
        request.selectedModel,
        i
      )
      
      // Generate quality anchors
      const qualityAnchors = await this.generateQualityAnchors(clip, request, i)

      clipPrompts.push({
        clipIndex: i,
        clipId: clip.clipId,
        mainPrompt,
        consistencyInstructions,
        transitionInstructions,
        modelSpecificOptimizations: modelOptimizations,
        qualityAnchors,
        technicalSpecs: {
          duration: storyboardClip.duration,
          aspectRatio: request.selectedModel.output_capabilities?.aspect_ratios?.[0] || '16:9',
          fps: request.selectedModel.output_capabilities?.fps || 24,
          resolution: request.selectedModel.output_capabilities?.max_resolution || '1080p'
        },
        metadata: {
          storyPosition: this.determineStoryPosition(i, request.enhancedClips.length),
          emotionalTone: storyboardClip.emotional_tone || 'neutral',
          keyVisualElements: storyboardClip.key_elements || [],
          actionDescription: storyboardClip.action_description || ''
        }
      })
    }

    return clipPrompts
  }

  private async generateClipMainPrompt(
    clip: EnhancedClipPrompt,
    request: SequentialPromptRequest,
    clipIndex: number
  ): Promise<string> {
    const systemPrompt = SystemPromptsManager.getPromptById('video_clip_generator')?.prompt || ''
    
    const enhancementPrompt = `
    Generate a detailed video generation prompt for clip ${clipIndex + 1} of ${request.enhancedClips.length}.
    
    Base Description: ${clip.enhancedPrompt}
    Model: ${request.selectedModel.name}
    Platform: ${request.platform || 'general'}
    Clip Position: ${this.determineStoryPosition(clipIndex, request.enhancedClips.length)}
    
    Requirements:
    1. Create a cinematic, detailed prompt that captures the essence of this specific clip
    2. Include specific camera movements, lighting, and composition details
    3. Ensure the prompt is optimized for ${request.selectedModel.name}
    4. Include temporal progression indicators for this clip's position in the sequence
    5. Maintain narrative continuity with previous clips
    
    Return only the enhanced video prompt, no explanations.
    `

    try {
      const response = await this.geminiService.generateText(enhancementPrompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 500
      })

      return response.content || clip.enhancedPrompt
    } catch (error) {
      console.warn(`Failed to enhance clip ${clipIndex} prompt:`, error)
      return clip.enhancedPrompt
    }
  }

  private async generateClipConsistencyInstructions(
    clip: EnhancedClipPrompt,
    consistencyProfile: ConsistencyProfile,
    clipIndex: number,
    allClips: EnhancedClipPrompt[]
  ): Promise<string[]> {
    const instructions: string[] = []

    // Character consistency
    if (consistencyProfile.characters?.length > 0) {
      consistencyProfile.characters.forEach(character => {
        instructions.push(`Character: ${character.name} - ${character.description}`)
        if (character.appearance_details) {
          instructions.push(`${character.name} appearance: ${character.appearance_details}`)
        }
      })
    }

    // Style consistency
    if (consistencyProfile.visual_style) {
      instructions.push(`Visual style: ${consistencyProfile.visual_style.description}`)
      if (consistencyProfile.visual_style.color_palette) {
        instructions.push(`Color palette: ${consistencyProfile.visual_style.color_palette.join(', ')}`)
      }
    }

    // Environment consistency
    if (consistencyProfile.environment) {
      instructions.push(`Setting: ${consistencyProfile.environment.setting}`)
      if (consistencyProfile.environment.lighting) {
        instructions.push(`Lighting: ${consistencyProfile.environment.lighting}`)
      }
    }

    // Cross-clip references for continuity
    if (clipIndex > 0) {
      instructions.push(`Continue from previous clip maintaining visual continuity`)
    }
    
    if (clipIndex < allClips.length - 1) {
      instructions.push(`Prepare visual elements for smooth transition to next scene`)
    }

    return instructions
  }

  private async generateTransitionInstructions(
    currentClip: EnhancedClipPrompt,
    nextClip: EnhancedClipPrompt,
    request: SequentialPromptRequest
  ): Promise<string> {
    const systemPrompt = SystemPromptsManager.getPromptById('video_transition_optimizer')?.prompt || ''
    
    const transitionPrompt = `
    Create smooth transition instructions between these two video clips:
    
    Current Clip: ${currentClip.enhancedPrompt}
    Next Clip: ${nextClip.enhancedPrompt}
    
    Model: ${request.selectedModel.name}
    
    Generate transition instructions that ensure:
    1. Visual continuity between clips
    2. Smooth narrative progression
    3. Consistent lighting and mood
    4. Natural camera movement flow
    5. Character/object positioning continuity
    
    Return concise transition instructions.
    `

    try {
      const response = await this.geminiService.generateText(transitionPrompt, {
        systemPrompt,
        temperature: 0.6,
        maxTokens: 200
      })

      return response.content || 'Ensure smooth visual transition to next scene'
    } catch (error) {
      console.warn('Failed to generate transition instructions:', error)
      return 'Ensure smooth visual transition to next scene'
    }
  }

  private async generateModelSpecificOptimizations(
    clip: EnhancedClipPrompt,
    model: ModelCapabilities,
    clipIndex: number
  ): Promise<string[]> {
    const optimizations: string[] = []

    // Model-specific prompt optimizations
    switch (model.provider) {
      case 'Runway':
        optimizations.push('Emphasize smooth motion and realistic physics')
        optimizations.push('Include specific camera movement descriptions')
        if (model.id.includes('gen-4')) {
          optimizations.push('Leverage advanced object interaction capabilities')
        }
        break

      case 'OpenAI':
        if (model.id.includes('sora')) {
          optimizations.push('Focus on complex scene dynamics and temporal consistency')
          optimizations.push('Include detailed character expressions and emotions')
        }
        break

      case 'Kuaishou':
        if (model.id.includes('kling')) {
          optimizations.push('Optimize for high-motion scenes and dynamic camera work')
          optimizations.push('Include precise timing descriptions')
        }
        break

      case 'MiniMax':
        if (model.id.includes('hailuo')) {
          optimizations.push('Emphasize cinematic composition and lighting')
          optimizations.push('Include detailed atmospheric descriptions')
        }
        break

      case 'Pika':
        optimizations.push('Focus on creative visual effects and transformations')
        optimizations.push('Include specific texture and material descriptions')
        break

      default:
        optimizations.push('Maintain high visual quality and smooth motion')
    }

    // Duration-specific optimizations
    if (clip.duration && clip.duration > 0) {
      if (clip.duration <= 5) {
        optimizations.push('Optimize for quick, impactful visual storytelling')
      } else if (clip.duration <= 10) {
        optimizations.push('Include gradual scene development and motion progression')
      } else {
        optimizations.push('Plan for extended scene development with multiple visual beats')
      }
    }

    return optimizations
  }

  private async generateQualityAnchors(
    clip: EnhancedClipPrompt,
    request: SequentialPromptRequest,
    clipIndex: number
  ): Promise<string[]> {
    const anchors: string[] = []

    // Platform-specific quality requirements
    if (request.platform) {
      switch (request.platform) {
        case 'instagram':
          anchors.push('Instagram-optimized visuals with vibrant colors')
          anchors.push('Mobile-first composition and readability')
          break
        case 'tiktok':
          anchors.push('TikTok-style dynamic and engaging visuals')
          anchors.push('Attention-grabbing elements and quick visual beats')
          break
        case 'youtube':
          anchors.push('YouTube-quality cinematic production values')
          anchors.push('Thumbnail-worthy key moments')
          break
        case 'linkedin':
          anchors.push('Professional and polished visual presentation')
          anchors.push('Business-appropriate tone and styling')
          break
      }
    }

    // Universal quality anchors
    anchors.push('High-definition clarity and crisp details')
    anchors.push('Smooth motion with natural physics')
    anchors.push('Professional lighting and composition')
    anchors.push('Consistent visual quality throughout')

    return anchors
  }

  private async optimizeSequentialFlow(
    clipPrompts: ClipPromptGeneration[],
    request: SequentialPromptRequest
  ): Promise<ClipPromptGeneration[]> {
    // Apply cross-clip optimizations
    for (let i = 0; i < clipPrompts.length; i++) {
      const clip = clipPrompts[i]
      
      // Add sequential flow context
      if (i === 0) {
        clip.consistencyInstructions.unshift('Opening clip: Establish setting and introduce key elements')
      } else if (i === clipPrompts.length - 1) {
        clip.consistencyInstructions.push('Final clip: Provide satisfying conclusion and visual closure')
      } else {
        clip.consistencyInstructions.push(`Middle clip ${i + 1}: Develop story and maintain momentum`)
      }

      // Add narrative progression hints
      const progressPercentage = (i / (clipPrompts.length - 1)) * 100
      clip.mainPrompt += ` [Story progress: ${Math.round(progressPercentage)}%]`
    }

    return clipPrompts
  }

  private async generateGlobalConsistencyInstructions(
    request: SequentialPromptRequest
  ): Promise<string[]> {
    const instructions: string[] = []

    instructions.push(`Total video duration: ${request.storyboard.total_duration} seconds across ${request.enhancedClips.length} clips`)
    instructions.push(`Target platform: ${request.platform || 'general'}`)
    instructions.push(`Model: ${request.selectedModel.name}`)

    if (request.style) {
      instructions.push(`Overall style: ${request.style}`)
    }

    if (request.mood) {
      instructions.push(`Overall mood: ${request.mood}`)
    }

    instructions.push('Maintain visual consistency across all clips')
    instructions.push('Ensure smooth narrative progression')
    instructions.push('Keep character and environment continuity')

    return instructions
  }

  private async generateSequentialFlow(
    request: SequentialPromptRequest,
    clipPrompts: ClipPromptGeneration[]
  ): Promise<SequentialPromptResult['sequentialFlow']> {
    return {
      narrativeProgression: this.analyzeNarrativeProgression(clipPrompts),
      visualProgression: this.analyzeVisualProgression(clipPrompts),
      emotionalProgression: this.analyzeEmotionalProgression(clipPrompts)
    }
  }

  private analyzeNarrativeProgression(clips: ClipPromptGeneration[]): string {
    const progression: string[] = []
    
    clips.forEach((clip, index) => {
      switch (clip.metadata.storyPosition) {
        case 'opening':
          progression.push('Introduction and setup')
          break
        case 'development':
          progression.push('Story development and progression')
          break
        case 'climax':
          progression.push('Peak moment and climax')
          break
        case 'resolution':
          progression.push('Resolution and conclusion')
          break
      }
    })

    return progression.join(' → ')
  }

  private analyzeVisualProgression(clips: ClipPromptGeneration[]): string {
    const progression: string[] = []
    
    clips.forEach((clip, index) => {
      if (index === 0) {
        progression.push('Visual establishment')
      } else if (index === clips.length - 1) {
        progression.push('Visual conclusion')
      } else {
        progression.push('Visual development')
      }
    })

    return progression.join(' → ')
  }

  private analyzeEmotionalProgression(clips: ClipPromptGeneration[]): string {
    return clips.map(clip => clip.metadata.emotionalTone).join(' → ')
  }

  private async validateSequentialQuality(
    clipPrompts: ClipPromptGeneration[],
    request: SequentialPromptRequest
  ): Promise<SequentialPromptResult['qualityValidation']> {
    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(clipPrompts, request)
    
    // Calculate narrative coherence
    const narrativeCoherence = this.calculateNarrativeCoherence(clipPrompts)
    
    // Calculate technical optimization
    const technicalOptimization = this.calculateTechnicalOptimization(clipPrompts, request.selectedModel)
    
    // Calculate overall score
    const overallScore = (consistencyScore + narrativeCoherence + technicalOptimization) / 3

    return {
      consistencyScore,
      narrativeCoherence,
      technicalOptimization,
      overallScore
    }
  }

  private calculateConsistencyScore(
    clips: ClipPromptGeneration[],
    request: SequentialPromptRequest
  ): number {
    let score = 100
    
    // Check for consistency instruction completeness
    clips.forEach(clip => {
      if (clip.consistencyInstructions.length < 3) {
        score -= 10
      }
    })

    // Check for character consistency
    if (request.consistencyProfile.characters?.length > 0) {
      const hasCharacterInstructions = clips.every(clip => 
        clip.consistencyInstructions.some(instr => instr.includes('Character:'))
      )
      if (!hasCharacterInstructions) {
        score -= 20
      }
    }

    return Math.max(0, score)
  }

  private calculateNarrativeCoherence(clips: ClipPromptGeneration[]): number {
    let score = 100

    // Check for proper story progression
    const hasOpening = clips.some(clip => clip.metadata.storyPosition === 'opening')
    const hasResolution = clips.some(clip => clip.metadata.storyPosition === 'resolution')
    
    if (!hasOpening) score -= 20
    if (!hasResolution) score -= 20

    // Check for transition instructions
    const transitionCount = clips.filter(clip => clip.transitionInstructions).length
    const expectedTransitions = clips.length - 1
    
    if (transitionCount < expectedTransitions * 0.8) {
      score -= 15
    }

    return Math.max(0, score)
  }

  private calculateTechnicalOptimization(
    clips: ClipPromptGeneration[],
    model: ModelCapabilities
  ): number {
    let score = 100

    // Check for model-specific optimizations
    clips.forEach(clip => {
      if (clip.modelSpecificOptimizations.length < 2) {
        score -= 10
      }
    })

    // Check for quality anchors
    clips.forEach(clip => {
      if (clip.qualityAnchors.length < 3) {
        score -= 5
      }
    })

    return Math.max(0, score)
  }

  private determineStoryPosition(
    clipIndex: number,
    totalClips: number
  ): 'opening' | 'development' | 'climax' | 'resolution' {
    const position = clipIndex / (totalClips - 1)
    
    if (position === 0) return 'opening'
    if (position === 1) return 'resolution'
    if (position < 0.3) return 'opening'
    if (position > 0.7) return 'resolution'
    if (position > 0.5) return 'climax'
    return 'development'
  }
}