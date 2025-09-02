/**
 * Intelligent Video Story Segmentation System
 * 
 * Handles breaking 20-30+ second videos into optimal clip sequences
 * with proper narrative flow and scene planning for multi-clip consistency
 */

import { GeminiService, getGeminiService } from '../llm/gemini-service'
import { ModelCapabilities } from '../model-capabilities'

export interface VideoSegmentationRequest {
  basePrompt: string
  totalDuration: number
  selectedModel: ModelCapabilities
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
  style?: string
  storyType?: 'narrative' | 'promotional' | 'educational' | 'entertainment' | 'demonstration'
}

export interface VideoClip {
  clipNumber: number
  duration: number
  startTime: number
  endTime: number
  prompt: string
  sceneType: 'establishing' | 'development' | 'climax' | 'resolution' | 'transition'
  focusElement: 'wide-shot' | 'medium-shot' | 'close-up' | 'detail-shot' | 'reaction-shot'
  cameraMovement: 'static' | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down' | 'zoom-in' | 'zoom-out' | 'dolly-in' | 'dolly-out'
  transitionType: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom-transition'
  consistencyAnchors: {
    character?: string
    environment?: string
    lighting?: string
    colorPalette?: string
  }
  metadata: {
    importance: 'critical' | 'high' | 'medium' | 'low'
    retakeComplexity: 'simple' | 'moderate' | 'complex'
    estimatedCost: number
  }
}

export interface VideoStoryboard {
  clips: VideoClip[]
  totalClips: number
  averageClipLength: number
  storyArc: {
    setup: VideoClip[]
    development: VideoClip[]
    climax: VideoClip[]
    resolution: VideoClip[]
  }
  consistencyProfile: {
    characterDescription?: string
    environmentDescription?: string
    styleDescription?: string
    colorPalette?: string
    lightingMood?: string
  }
  estimatedTotalCost: number
  processingInsights: string[]
}

export class VideoStorySegmentation {
  private geminiService: GeminiService

  constructor(geminiService?: GeminiService) {
    this.geminiService = geminiService || getGeminiService()
  }

  /**
   * Main segmentation method - creates optimal clip breakdown for multi-clip video
   */
  async segmentVideo(request: VideoSegmentationRequest): Promise<VideoStoryboard> {
    console.log(`[VideoSegmentation] Starting segmentation for ${request.totalDuration}s video`)

    try {
      // Determine optimal clip count and duration
      const clipStrategy = this.calculateOptimalClipStrategy(request)
      
      // Generate story structure with LLM
      const storyStructure = await this.generateStoryStructure(request, clipStrategy)
      
      // Create detailed clip breakdown
      const detailedClips = await this.createDetailedClips(request, storyStructure, clipStrategy)
      
      // Generate consistency profile
      const consistencyProfile = await this.generateConsistencyProfile(request, detailedClips)
      
      // Organize into story arc
      const storyArc = this.organizeStoryArc(detailedClips)
      
      // Calculate costs and insights
      const storyboard = this.finalizeStoryboard(detailedClips, storyArc, consistencyProfile, request)
      
      console.log(`[VideoSegmentation] Created ${storyboard.totalClips} clips with ${storyboard.processingInsights.length} insights`)
      
      return storyboard

    } catch (error) {
      console.error('[VideoSegmentation] Segmentation failed:', error)
      return this.createFallbackStoryboard(request)
    }
  }

  /**
   * Calculate optimal number of clips and their duration based on model constraints
   */
  private calculateOptimalClipStrategy(request: VideoSegmentationRequest): {
    clipCount: number
    targetClipDuration: number
    strategy: 'single' | 'dual' | 'multi' | 'complex'
  } {
    const maxClipDuration = request.selectedModel.output_capabilities.max_duration || 10
    const totalDuration = request.totalDuration

    // Single clip if within model limits
    if (totalDuration <= maxClipDuration) {
      return {
        clipCount: 1,
        targetClipDuration: totalDuration,
        strategy: 'single'
      }
    }

    // Calculate optimal clip count
    let optimalClips: number
    let strategy: 'dual' | 'multi' | 'complex'

    if (totalDuration <= maxClipDuration * 2) {
      // Dual clip strategy
      optimalClips = 2
      strategy = 'dual'
    } else if (totalDuration <= maxClipDuration * 4) {
      // Multi-clip strategy (3-4 clips)
      optimalClips = Math.ceil(totalDuration / maxClipDuration)
      strategy = 'multi'
    } else {
      // Complex strategy (5+ clips with careful planning)
      optimalClips = Math.ceil(totalDuration / Math.min(maxClipDuration, 8)) // Cap at 8s for better consistency
      strategy = 'complex'
    }

    const targetClipDuration = totalDuration / optimalClips

    console.log(`[VideoSegmentation] Strategy: ${strategy} with ${optimalClips} clips of ~${targetClipDuration.toFixed(1)}s each`)

    return {
      clipCount: optimalClips,
      targetClipDuration,
      strategy
    }
  }

  /**
   * Generate story structure using LLM intelligence
   */
  private async generateStoryStructure(
    request: VideoSegmentationRequest, 
    clipStrategy: any
  ): Promise<{
    narrative_arc: string[]
    scene_descriptions: string[]
    pacing_notes: string[]
    transition_points: string[]
  }> {
    const systemPrompt = `You are a professional video storytelling expert and cinematographer. Create a compelling story structure for a ${request.totalDuration}-second ${request.storyType || 'narrative'} video.

VIDEO DETAILS:
- Base Concept: "${request.basePrompt}"
- Platform: ${request.platform}
- Total Duration: ${request.totalDuration} seconds
- Number of Clips: ${clipStrategy.clipCount}
- Target Clip Length: ${clipStrategy.targetClipDuration.toFixed(1)} seconds
- Style: ${request.style || 'Cinematic'}

STORYTELLING REQUIREMENTS:
1. Create ${clipStrategy.clipCount} distinct scenes that build a cohesive narrative
2. Each scene should be ${clipStrategy.targetClipDuration.toFixed(1)} seconds long
3. Design proper story pacing for ${request.platform} platform
4. Include clear beginning, middle, and end structure
5. Plan smooth transitions between clips
6. Consider ${request.storyType || 'narrative'} storytelling techniques

PLATFORM OPTIMIZATION:
${this.getPlatformStorytellingGuidelines(request.platform)}

Return JSON format:
{
  "narrative_arc": ["scene 1 purpose", "scene 2 purpose", "scene 3 purpose", ...],
  "scene_descriptions": ["detailed scene 1", "detailed scene 2", "detailed scene 3", ...],
  "pacing_notes": ["scene 1 pacing", "scene 2 pacing", ...],
  "transition_points": ["transition 1-2", "transition 2-3", ...]
}`

    try {
      const response = await this.geminiService.generateText(
        'Create video story structure',
        {
          systemPrompt,
          temperature: 0.6,
          maxTokens: 2000
        }
      )

      const storyStructure = this.parseJsonResponse(response.text)
      console.log(`[VideoSegmentation] Generated story structure with ${storyStructure.narrative_arc?.length || 0} scenes`)
      
      return storyStructure
    } catch (error) {
      console.error('[VideoSegmentation] Story structure generation failed:', error)
      return this.createFallbackStoryStructure(clipStrategy.clipCount)
    }
  }

  /**
   * Create detailed clip specifications with cinematic details
   */
  private async createDetailedClips(
    request: VideoSegmentationRequest,
    storyStructure: any,
    clipStrategy: any
  ): Promise<VideoClip[]> {
    const clips: VideoClip[] = []
    
    for (let i = 0; i < clipStrategy.clipCount; i++) {
      const clipDuration = i === clipStrategy.clipCount - 1 
        ? request.totalDuration - (clipStrategy.targetClipDuration * i) // Last clip gets remainder
        : clipStrategy.targetClipDuration

      const systemPrompt = `You are a professional cinematographer creating detailed shot specifications for clip ${i + 1} of ${clipStrategy.clipCount}.

CLIP DETAILS:
- Clip Number: ${i + 1}/${clipStrategy.clipCount}
- Duration: ${clipDuration.toFixed(1)} seconds
- Scene Description: "${storyStructure.scene_descriptions?.[i] || `Scene ${i + 1}`}"
- Narrative Purpose: "${storyStructure.narrative_arc?.[i] || 'Development'}"
- Base Concept: "${request.basePrompt}"
- Platform: ${request.platform}

CINEMATIC REQUIREMENTS:
1. Create a detailed prompt for AI ${request.selectedModel.name} video generation
2. Specify camera movement and framing
3. Define focus elements and composition
4. Plan transition to next clip (if not last)
5. Maintain consistency with previous clips

MODEL SPECIFICATIONS:
- Max Duration: ${request.selectedModel.output_capabilities.max_duration}s
- Type: ${request.selectedModel.type}
- Consistency Features: ${request.selectedModel.special_features?.character_consistency || 'basic'}

Return JSON format:
{
  "enhanced_prompt": "detailed AI generation prompt for this specific clip",
  "scene_type": "establishing|development|climax|resolution|transition",
  "focus_element": "wide-shot|medium-shot|close-up|detail-shot|reaction-shot",
  "camera_movement": "static|pan-left|pan-right|tilt-up|tilt-down|zoom-in|zoom-out|dolly-in|dolly-out",
  "transition_type": "cut|fade|dissolve|wipe|zoom-transition",
  "consistency_requirements": {
    "character": "character consistency description if applicable",
    "environment": "environment consistency needs", 
    "lighting": "lighting mood to maintain",
    "color_palette": "color scheme consistency"
  },
  "importance_level": "critical|high|medium|low",
  "retake_complexity": "simple|moderate|complex"
}`

      try {
        const response = await this.geminiService.generateText(
          `Create detailed specifications for clip ${i + 1}`,
          {
            systemPrompt,
            temperature: 0.5,
            maxTokens: 1500
          }
        )

        const clipDetails = this.parseJsonResponse(response.text)
        
        const clip: VideoClip = {
          clipNumber: i + 1,
          duration: clipDuration,
          startTime: clipStrategy.targetClipDuration * i,
          endTime: clipStrategy.targetClipDuration * i + clipDuration,
          prompt: clipDetails.enhanced_prompt || `${request.basePrompt} - Scene ${i + 1}`,
          sceneType: clipDetails.scene_type || (i === 0 ? 'establishing' : 'development'),
          focusElement: clipDetails.focus_element || 'medium-shot',
          cameraMovement: clipDetails.camera_movement || 'static',
          transitionType: i === clipStrategy.clipCount - 1 ? 'cut' : (clipDetails.transition_type || 'cut'),
          consistencyAnchors: {
            character: clipDetails.consistency_requirements?.character,
            environment: clipDetails.consistency_requirements?.environment,
            lighting: clipDetails.consistency_requirements?.lighting,
            colorPalette: clipDetails.consistency_requirements?.color_palette
          },
          metadata: {
            importance: clipDetails.importance_level || 'medium',
            retakeComplexity: clipDetails.retake_complexity || 'moderate',
            estimatedCost: this.calculateClipCost(clipDuration, request.selectedModel)
          }
        }

        clips.push(clip)
        console.log(`[VideoSegmentation] Created clip ${i + 1}: ${clip.sceneType} (${clipDuration.toFixed(1)}s)`)

      } catch (error) {
        console.error(`[VideoSegmentation] Failed to create clip ${i + 1}:`, error)
        // Fallback clip creation
        clips.push(this.createFallbackClip(i + 1, clipDuration, clipStrategy.targetClipDuration * i, request))
      }
    }

    return clips
  }

  /**
   * Generate overall consistency profile for the entire video
   */
  private async generateConsistencyProfile(
    request: VideoSegmentationRequest,
    clips: VideoClip[]
  ): Promise<VideoStoryboard['consistencyProfile']> {
    const systemPrompt = `You are a visual consistency expert for AI video generation. Create a consistency profile that will ensure all ${clips.length} clips look like they belong to the same video.

BASE CONCEPT: "${request.basePrompt}"
MODEL: ${request.selectedModel.name}
PLATFORM: ${request.platform}

CLIPS OVERVIEW:
${clips.map(clip => `Clip ${clip.clipNumber}: ${clip.sceneType} - ${clip.focusElement} (${clip.duration}s)`).join('\n')}

CONSISTENCY REQUIREMENTS:
1. Character description (if applicable)
2. Environment/setting description  
3. Visual style and aesthetic
4. Color palette specification
5. Lighting mood and direction

Create a master consistency profile that can be referenced for all clips.

Return JSON format:
{
  "character_description": "detailed character consistency anchor if applicable",
  "environment_description": "setting and location consistency requirements",
  "style_description": "visual style, aesthetic, and artistic direction",
  "color_palette": "color scheme and palette consistency",
  "lighting_mood": "lighting style, mood, and direction consistency"
}`

    try {
      const response = await this.geminiService.generateText(
        'Generate consistency profile for multi-clip video',
        {
          systemPrompt,
          temperature: 0.3,
          maxTokens: 1000
        }
      )

      const profile = this.parseJsonResponse(response.text)
      console.log('[VideoSegmentation] Generated consistency profile')
      
      return profile
    } catch (error) {
      console.error('[VideoSegmentation] Consistency profile generation failed:', error)
      return {
        characterDescription: 'Maintain same character throughout',
        environmentDescription: 'Consistent setting and location',
        styleDescription: request.style || 'Cinematic style',
        colorPalette: 'Consistent color scheme',
        lightingMood: 'Professional lighting consistency'
      }
    }
  }

  // Utility methods

  private organizeStoryArc(clips: VideoClip[]): VideoStoryboard['storyArc'] {
    const totalClips = clips.length
    
    if (totalClips <= 2) {
      return {
        setup: clips.slice(0, 1),
        development: [],
        climax: [],
        resolution: clips.slice(1)
      }
    }

    if (totalClips <= 4) {
      return {
        setup: clips.slice(0, 1),
        development: clips.slice(1, -1),
        climax: [],
        resolution: clips.slice(-1)
      }
    }

    // Complex story arc for 5+ clips
    const setupCount = 1
    const resolutionCount = 1
    const climaxCount = 1
    const developmentCount = totalClips - setupCount - climaxCount - resolutionCount

    return {
      setup: clips.slice(0, setupCount),
      development: clips.slice(setupCount, setupCount + developmentCount),
      climax: clips.slice(-resolutionCount - climaxCount, -resolutionCount),
      resolution: clips.slice(-resolutionCount)
    }
  }

  private finalizeStoryboard(
    clips: VideoClip[],
    storyArc: VideoStoryboard['storyArc'], 
    consistencyProfile: VideoStoryboard['consistencyProfile'],
    request: VideoSegmentationRequest
  ): VideoStoryboard {
    const estimatedTotalCost = clips.reduce((sum, clip) => sum + clip.metadata.estimatedCost, 0)
    const averageClipLength = clips.reduce((sum, clip) => sum + clip.duration, 0) / clips.length

    return {
      clips,
      totalClips: clips.length,
      averageClipLength,
      storyArc,
      consistencyProfile,
      estimatedTotalCost,
      processingInsights: [
        `Created ${clips.length} clips for ${request.totalDuration}s video`,
        `Average clip duration: ${averageClipLength.toFixed(1)}s`,
        `Estimated total cost: $${estimatedTotalCost.toFixed(3)}`,
        `Target platform: ${request.platform}`,
        `Story type: ${request.storyType || 'narrative'}`,
        `Selected model: ${request.selectedModel.name}`
      ]
    }
  }

  private calculateClipCost(duration: number, model: ModelCapabilities): number {
    if (model.type === 'image') return model.pricing.cost_per_image || 0.01
    return (model.pricing.cost_per_second || 0.05) * duration
  }

  private getPlatformStorytellingGuidelines(platform: string): string {
    const guidelines = {
      'tiktok': 'Hook viewers in first 3 seconds, maintain high energy, trending elements, authentic feel',
      'instagram': 'Visually striking opening, brand consistency, story-friendly format, engagement focus',
      'youtube': 'Strong opening hook, educational/entertainment value, retention optimization',
      'linkedin': 'Professional tone, value-driven content, business appropriate messaging',
      'general': 'Universal appeal, clear storytelling, broad accessibility'
    }

    return guidelines[platform] || guidelines.general
  }

  private parseJsonResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return JSON.parse(response)
    } catch (error) {
      console.error('[VideoSegmentation] JSON parsing failed:', error)
      return {}
    }
  }

  private createFallbackStoryStructure(clipCount: number) {
    return {
      narrative_arc: Array(clipCount).fill(0).map((_, i) => `Scene ${i + 1}`),
      scene_descriptions: Array(clipCount).fill(0).map((_, i) => `Scene ${i + 1} description`),
      pacing_notes: Array(clipCount).fill('Standard pacing'),
      transition_points: Array(clipCount - 1).fill('Smooth transition')
    }
  }

  private createFallbackClip(
    clipNumber: number, 
    duration: number, 
    startTime: number, 
    request: VideoSegmentationRequest
  ): VideoClip {
    return {
      clipNumber,
      duration,
      startTime,
      endTime: startTime + duration,
      prompt: `${request.basePrompt} - Scene ${clipNumber}`,
      sceneType: clipNumber === 1 ? 'establishing' : 'development',
      focusElement: 'medium-shot',
      cameraMovement: 'static',
      transitionType: 'cut',
      consistencyAnchors: {
        environment: 'Same setting throughout',
        lighting: 'Consistent lighting mood'
      },
      metadata: {
        importance: 'medium',
        retakeComplexity: 'moderate',
        estimatedCost: this.calculateClipCost(duration, request.selectedModel)
      }
    }
  }

  private createFallbackStoryboard(request: VideoSegmentationRequest): VideoStoryboard {
    const clipCount = Math.ceil(request.totalDuration / (request.selectedModel.output_capabilities.max_duration || 10))
    const clipDuration = request.totalDuration / clipCount
    
    const clips = Array(clipCount).fill(0).map((_, i) => 
      this.createFallbackClip(i + 1, clipDuration, clipDuration * i, request)
    )

    return {
      clips,
      totalClips: clipCount,
      averageClipLength: clipDuration,
      storyArc: this.organizeStoryArc(clips),
      consistencyProfile: {
        styleDescription: 'Basic consistency',
        environmentDescription: 'Same setting',
        lightingMood: 'Consistent lighting'
      },
      estimatedTotalCost: clips.reduce((sum, clip) => sum + clip.metadata.estimatedCost, 0),
      processingInsights: ['Used fallback story segmentation']
    }
  }
}

export default VideoStorySegmentation