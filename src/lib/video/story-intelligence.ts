import { GeminiService } from '../llm/gemini-service'
import SystemPromptsManager from '../llm/system-prompts'
import { ModelCapabilities } from '../model-capabilities'

export interface StoryAnalysisRequest {
  originalPrompt: string
  targetDuration: number
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
  genre?: string
  mood?: string
  targetAudience?: string
  contentType?: 'narrative' | 'promotional' | 'educational' | 'entertainment' | 'documentary'
  keyElements?: string[]
}

export interface StoryArc {
  structure: 'three_act' | 'hero_journey' | 'problem_solution' | 'before_after' | 'chronological' | 'comparative'
  acts: StoryAct[]
  totalDuration: number
  pacing: 'slow' | 'medium' | 'fast' | 'dynamic'
  emotionalCurve: EmotionalBeat[]
  keyMoments: KeyMoment[]
}

export interface StoryAct {
  name: string
  description: string
  duration: number
  percentage: number
  purpose: string
  keyElements: string[]
  emotionalTone: string
  visualStyle: string
  pacing: string
}

export interface EmotionalBeat {
  timestamp: number
  emotion: string
  intensity: number // 1-10
  description: string
}

export interface KeyMoment {
  timestamp: number
  type: 'hook' | 'revelation' | 'climax' | 'resolution' | 'call_to_action'
  description: string
  visualImportance: number // 1-10
  narrativeWeight: number // 1-10
}

export interface NarrativeElements {
  protagonist?: {
    name?: string
    description: string
    role: string
    visualCharacteristics: string[]
  }
  setting: {
    location: string
    timeFrame: string
    atmosphere: string
    visualStyle: string
  }
  conflict?: {
    type: 'internal' | 'external' | 'situational'
    description: string
    visualRepresentation: string
  }
  theme: {
    primaryMessage: string
    visualMetaphors: string[]
    colorPsychology: string[]
  }
}

export interface StoryIntelligenceResult {
  storyAnalysis: {
    genre: string
    contentType: string
    complexity: 'simple' | 'moderate' | 'complex'
    narrativeStructure: string
  }
  storyArc: StoryArc
  narrativeElements: NarrativeElements
  platformOptimizations: {
    platform: string
    adaptations: string[]
    keyTimings: number[]
    attentionPoints: string[]
  }
  visualGuidance: {
    overallStyle: string
    colorPalette: string[]
    cinematography: string[]
    transitions: string[]
  }
  qualityMetrics: {
    narrativeCoherence: number
    emotionalEngagement: number
    visualConsistency: number
    platformSuitability: number
    overallScore: number
  }
}

export class StoryIntelligenceEngine {
  private geminiService: GeminiService

  constructor() {
    this.geminiService = new GeminiService()
  }

  async analyzeStory(request: StoryAnalysisRequest): Promise<StoryIntelligenceResult> {
    try {
      // Analyze the story content and structure
      const storyAnalysis = await this.performStoryAnalysis(request)
      
      // Generate story arc structure
      const storyArc = await this.generateStoryArc(request, storyAnalysis)
      
      // Extract narrative elements
      const narrativeElements = await this.extractNarrativeElements(request, storyAnalysis)
      
      // Generate platform-specific optimizations
      const platformOptimizations = await this.generatePlatformOptimizations(request, storyArc)
      
      // Generate visual guidance
      const visualGuidance = await this.generateVisualGuidance(request, narrativeElements, storyArc)
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(storyArc, narrativeElements, platformOptimizations)

      return {
        storyAnalysis,
        storyArc,
        narrativeElements,
        platformOptimizations,
        visualGuidance,
        qualityMetrics
      }
    } catch (error) {
      console.error('Error in story intelligence analysis:', error)
      throw new Error(`Story intelligence analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async performStoryAnalysis(
    request: StoryAnalysisRequest
  ): Promise<StoryIntelligenceResult['storyAnalysis']> {
    const systemPrompt = SystemPromptsManager.getPromptById('story_analyzer')?.prompt || ''
    
    const analysisPrompt = `
    Analyze this video content prompt for story structure and narrative elements:
    
    Original Prompt: ${request.originalPrompt}
    Target Duration: ${request.targetDuration} seconds
    Platform: ${request.platform || 'general'}
    Content Type: ${request.contentType || 'narrative'}
    
    Determine:
    1. Primary genre (drama, comedy, action, documentary, promotional, educational, etc.)
    2. Content complexity (simple, moderate, complex)
    3. Best narrative structure approach
    4. Key story elements present
    
    Return a JSON object with:
    {
      "genre": "identified genre",
      "contentType": "content classification",
      "complexity": "simple|moderate|complex",
      "narrativeStructure": "recommended structure approach"
    }
    `

    try {
      const response = await this.geminiService.generateText(analysisPrompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 300
      })

      const analysis = this.parseJsonResponse(response.content, {
        genre: request.genre || 'narrative',
        contentType: request.contentType || 'narrative',
        complexity: 'moderate',
        narrativeStructure: 'three_act'
      })

      return analysis
    } catch (error) {
      console.warn('Failed to analyze story structure:', error)
      return {
        genre: request.genre || 'narrative',
        contentType: request.contentType || 'narrative',
        complexity: 'moderate',
        narrativeStructure: 'three_act'
      }
    }
  }

  private async generateStoryArc(
    request: StoryAnalysisRequest,
    analysis: StoryIntelligenceResult['storyAnalysis']
  ): Promise<StoryArc> {
    const systemPrompt = SystemPromptsManager.getPromptById('story_structure_designer')?.prompt || ''
    
    const arcPrompt = `
    Create a detailed story arc for a ${request.targetDuration}-second video:
    
    Content: ${request.originalPrompt}
    Genre: ${analysis.genre}
    Structure: ${analysis.narrativeStructure}
    Platform: ${request.platform || 'general'}
    Complexity: ${analysis.complexity}
    
    Generate a story arc with:
    1. Appropriate structure (3-act, hero's journey, problem-solution, etc.)
    2. Detailed act breakdown with timings
    3. Emotional progression curve
    4. Key narrative moments
    5. Pacing recommendations
    
    Consider platform-specific attention spans:
    - TikTok/Instagram: Hook within 3 seconds
    - YouTube: Build engagement over time
    - LinkedIn: Professional, clear progression
    
    Return detailed story arc structure.
    `

    try {
      const response = await this.geminiService.generateText(arcPrompt, {
        systemPrompt,
        temperature: 0.4,
        maxTokens: 800
      })

      return this.generateStoryArcFromAnalysis(request, analysis, response.content)
    } catch (error) {
      console.warn('Failed to generate story arc:', error)
      return this.generateDefaultStoryArc(request, analysis)
    }
  }

  private generateStoryArcFromAnalysis(
    request: StoryAnalysisRequest,
    analysis: StoryIntelligenceResult['storyAnalysis'],
    aiResponse: string
  ): StoryArc {
    // Determine structure based on analysis
    let structure: StoryArc['structure'] = 'three_act'
    
    if (request.contentType === 'promotional') {
      structure = 'problem_solution'
    } else if (request.contentType === 'educational') {
      structure = 'chronological'
    } else if (analysis.complexity === 'complex') {
      structure = 'hero_journey'
    }

    // Generate acts based on structure and duration
    const acts = this.generateActs(structure, request.targetDuration, request)
    
    // Generate emotional curve
    const emotionalCurve = this.generateEmotionalCurve(acts, request)
    
    // Generate key moments
    const keyMoments = this.generateKeyMoments(acts, request)
    
    // Determine pacing
    const pacing = this.determinePacing(request)

    return {
      structure,
      acts,
      totalDuration: request.targetDuration,
      pacing,
      emotionalCurve,
      keyMoments
    }
  }

  private generateDefaultStoryArc(
    request: StoryAnalysisRequest,
    analysis: StoryIntelligenceResult['storyAnalysis']
  ): StoryArc {
    return this.generateStoryArcFromAnalysis(request, analysis, '')
  }

  private generateActs(
    structure: StoryArc['structure'],
    totalDuration: number,
    request: StoryAnalysisRequest
  ): StoryAct[] {
    const acts: StoryAct[] = []

    switch (structure) {
      case 'three_act':
        acts.push({
          name: 'Setup',
          description: 'Introduce characters, setting, and hook the audience',
          duration: totalDuration * 0.25,
          percentage: 25,
          purpose: 'Establish context and grab attention',
          keyElements: ['hook', 'character introduction', 'setting establishment'],
          emotionalTone: 'engaging',
          visualStyle: 'establishing shots, wide angles',
          pacing: 'medium to fast'
        })
        acts.push({
          name: 'Confrontation',
          description: 'Develop conflict and build tension',
          duration: totalDuration * 0.5,
          percentage: 50,
          purpose: 'Develop story and maintain interest',
          keyElements: ['conflict development', 'character growth', 'plot advancement'],
          emotionalTone: 'building tension',
          visualStyle: 'dynamic shots, close-ups',
          pacing: 'varies with content'
        })
        acts.push({
          name: 'Resolution',
          description: 'Resolve conflict and provide closure',
          duration: totalDuration * 0.25,
          percentage: 25,
          purpose: 'Conclude story and deliver message',
          keyElements: ['climax', 'resolution', 'call to action'],
          emotionalTone: 'satisfying',
          visualStyle: 'impactful shots, wide conclusions',
          pacing: 'building to conclusion'
        })
        break

      case 'problem_solution':
        acts.push({
          name: 'Problem Introduction',
          description: 'Present the problem or challenge',
          duration: totalDuration * 0.3,
          percentage: 30,
          purpose: 'Establish the need and create urgency',
          keyElements: ['problem identification', 'stakes establishment'],
          emotionalTone: 'concern or urgency',
          visualStyle: 'problem-focused imagery',
          pacing: 'engaging'
        })
        acts.push({
          name: 'Solution Presentation',
          description: 'Introduce and demonstrate the solution',
          duration: totalDuration * 0.5,
          percentage: 50,
          purpose: 'Show how the problem can be solved',
          keyElements: ['solution introduction', 'benefits demonstration'],
          emotionalTone: 'hopeful and confident',
          visualStyle: 'solution-focused visuals',
          pacing: 'informative yet engaging'
        })
        acts.push({
          name: 'Call to Action',
          description: 'Motivate audience to take action',
          duration: totalDuration * 0.2,
          percentage: 20,
          purpose: 'Drive desired audience behavior',
          keyElements: ['clear action steps', 'urgency creation'],
          emotionalTone: 'motivational',
          visualStyle: 'action-oriented imagery',
          pacing: 'urgent and compelling'
        })
        break

      case 'chronological':
        acts.push({
          name: 'Beginning',
          description: 'Start of the timeline or process',
          duration: totalDuration * 0.33,
          percentage: 33,
          purpose: 'Establish starting point',
          keyElements: ['initial state', 'context setting'],
          emotionalTone: 'informative',
          visualStyle: 'clear, educational visuals',
          pacing: 'steady'
        })
        acts.push({
          name: 'Development',
          description: 'Show progression and changes',
          duration: totalDuration * 0.34,
          percentage: 34,
          purpose: 'Demonstrate process or growth',
          keyElements: ['progression', 'key changes'],
          emotionalTone: 'progressive',
          visualStyle: 'transitional imagery',
          pacing: 'building'
        })
        acts.push({
          name: 'Conclusion',
          description: 'Show final state or outcome',
          duration: totalDuration * 0.33,
          percentage: 33,
          purpose: 'Demonstrate final results',
          keyElements: ['final outcome', 'lessons learned'],
          emotionalTone: 'conclusive',
          visualStyle: 'result-focused imagery',
          pacing: 'satisfying'
        })
        break

      default:
        // Default to three-act structure
        return this.generateActs('three_act', totalDuration, request)
    }

    return acts
  }

  private generateEmotionalCurve(acts: StoryAct[], request: StoryAnalysisRequest): EmotionalBeat[] {
    const beats: EmotionalBeat[] = []
    let currentTime = 0

    acts.forEach((act, index) => {
      // Add emotional beats throughout each act
      const actBeats = Math.max(2, Math.floor(act.duration / 5)) // At least 2 beats per act, more for longer acts
      
      for (let i = 0; i < actBeats; i++) {
        const beatTime = currentTime + (act.duration / actBeats) * i
        let emotion = act.emotionalTone
        let intensity = 5

        // Adjust emotion and intensity based on act position and content
        if (index === 0) { // First act
          emotion = i === 0 ? 'curiosity' : 'engagement'
          intensity = i === 0 ? 6 : 7
        } else if (index === acts.length - 1) { // Last act
          emotion = i === actBeats - 1 ? 'satisfaction' : 'anticipation'
          intensity = i === actBeats - 1 ? 8 : 7
        } else { // Middle acts
          emotion = 'building tension'
          intensity = 6 + i
        }

        beats.push({
          timestamp: beatTime,
          emotion,
          intensity: Math.min(10, intensity),
          description: `${emotion} during ${act.name.toLowerCase()}`
        })
      }

      currentTime += act.duration
    })

    return beats
  }

  private generateKeyMoments(acts: StoryAct[], request: StoryAnalysisRequest): KeyMoment[] {
    const moments: KeyMoment[] = []
    let currentTime = 0

    // Add hook moment at the very beginning
    moments.push({
      timestamp: 0,
      type: 'hook',
      description: 'Opening hook to capture attention',
      visualImportance: 9,
      narrativeWeight: 8
    })

    acts.forEach((act, index) => {
      if (index === 0) {
        // First act moments
        moments.push({
          timestamp: currentTime + act.duration * 0.5,
          type: 'revelation',
          description: 'Key information or character revelation',
          visualImportance: 7,
          narrativeWeight: 7
        })
      } else if (index === acts.length - 1) {
        // Last act moments
        moments.push({
          timestamp: currentTime + act.duration * 0.3,
          type: 'climax',
          description: 'Story climax or peak moment',
          visualImportance: 10,
          narrativeWeight: 10
        })
        
        moments.push({
          timestamp: currentTime + act.duration * 0.8,
          type: 'resolution',
          description: 'Story resolution',
          visualImportance: 8,
          narrativeWeight: 9
        })

        // Add call to action for promotional content
        if (request.contentType === 'promotional') {
          moments.push({
            timestamp: currentTime + act.duration * 0.95,
            type: 'call_to_action',
            description: 'Clear call to action',
            visualImportance: 9,
            narrativeWeight: 8
          })
        }
      }

      currentTime += act.duration
    })

    return moments
  }

  private determinePacing(request: StoryAnalysisRequest): StoryArc['pacing'] {
    if (request.platform === 'tiktok' || request.platform === 'instagram') {
      return 'fast'
    } else if (request.platform === 'youtube' && request.targetDuration > 30) {
      return 'medium'
    } else if (request.contentType === 'educational') {
      return 'medium'
    } else if (request.targetDuration < 15) {
      return 'fast'
    } else {
      return 'dynamic'
    }
  }

  private async extractNarrativeElements(
    request: StoryAnalysisRequest,
    analysis: StoryIntelligenceResult['storyAnalysis']
  ): Promise<NarrativeElements> {
    const systemPrompt = SystemPromptsManager.getPromptById('narrative_extractor')?.prompt || ''
    
    const extractionPrompt = `
    Extract narrative elements from this video content:
    
    Content: ${request.originalPrompt}
    Genre: ${analysis.genre}
    Content Type: ${analysis.contentType}
    
    Identify and describe:
    1. Main character/protagonist (if any)
    2. Setting and environment
    3. Central conflict or challenge
    4. Primary theme and message
    5. Visual style recommendations
    
    Return detailed narrative elements focusing on visual representation.
    `

    try {
      const response = await this.geminiService.generateText(extractionPrompt, {
        systemPrompt,
        temperature: 0.4,
        maxTokens: 600
      })

      return this.parseNarrativeElements(request, response.content)
    } catch (error) {
      console.warn('Failed to extract narrative elements:', error)
      return this.generateDefaultNarrativeElements(request)
    }
  }

  private parseNarrativeElements(request: StoryAnalysisRequest, aiResponse: string): NarrativeElements {
    // Generate default elements and enhance with AI insights
    const elements = this.generateDefaultNarrativeElements(request)
    
    // Try to enhance with AI response (basic implementation)
    if (aiResponse.includes('character') || aiResponse.includes('protagonist')) {
      // Extract character information if mentioned
      elements.protagonist = {
        description: 'Main character as described in content',
        role: 'protagonist',
        visualCharacteristics: ['distinctive appearance', 'clear expressions']
      }
    }
    
    return elements
  }

  private generateDefaultNarrativeElements(request: StoryAnalysisRequest): NarrativeElements {
    return {
      setting: {
        location: 'As specified in prompt or contextually appropriate',
        timeFrame: 'Present day unless specified otherwise',
        atmosphere: request.mood || 'appropriate to content',
        visualStyle: 'cinematic and engaging'
      },
      theme: {
        primaryMessage: 'Core message derived from prompt content',
        visualMetaphors: ['relevant symbolic imagery'],
        colorPsychology: ['colors that support the emotional tone']
      }
    }
  }

  private async generatePlatformOptimizations(
    request: StoryAnalysisRequest,
    storyArc: StoryArc
  ): Promise<StoryIntelligenceResult['platformOptimizations']> {
    const platform = request.platform || 'general'
    let adaptations: string[] = []
    let keyTimings: number[] = []
    let attentionPoints: string[] = []

    switch (platform) {
      case 'tiktok':
        adaptations = [
          'Hook within first 1-2 seconds',
          'Vertical format optimization (9:16)',
          'Text overlays for accessibility',
          'Trending audio considerations',
          'Quick cuts and dynamic pacing'
        ]
        keyTimings = [0, 1, 3, 5, 8, 12, 15]
        attentionPoints = [
          'Immediate visual impact',
          'Pattern interrupts every 3-5 seconds',
          'Strong visual contrast',
          'Movement and animation'
        ]
        break

      case 'instagram':
        adaptations = [
          'Hook within first 3 seconds',
          'Square (1:1) or vertical (4:5) optimization',
          'Brand-safe content guidelines',
          'Story-friendly pacing',
          'Mobile-first visual design'
        ]
        keyTimings = [0, 3, 7, 12, 18, 25]
        attentionPoints = [
          'Aesthetic visual appeal',
          'Clear brand presence',
          'Shareable moments',
          'Strong composition'
        ]
        break

      case 'youtube':
        adaptations = [
          'Hook within first 5-8 seconds',
          'Horizontal format (16:9)',
          'Thumbnail-worthy key frames',
          'SEO-friendly content structure',
          'Longer-form engagement tactics'
        ]
        keyTimings = [0, 5, 15, 30, 45, 60]
        attentionPoints = [
          'Compelling thumbnail moment',
          'Value proposition clarity',
          'Educational or entertainment value',
          'Strong call to action'
        ]
        break

      case 'linkedin':
        adaptations = [
          'Professional tone and imagery',
          'Value-driven content focus',
          'Business-appropriate messaging',
          'Industry-relevant context',
          'Professional development angle'
        ]
        keyTimings = [0, 5, 10, 20, 30]
        attentionPoints = [
          'Professional credibility',
          'Industry insights',
          'Business value',
          'Thought leadership'
        ]
        break

      default:
        adaptations = [
          'Universal appeal',
          'Clear value proposition',
          'Engaging storytelling',
          'Quality production values'
        ]
        keyTimings = [0, 5, 15, 25]
        attentionPoints = [
          'Strong opening',
          'Clear message',
          'Engaging content',
          'Memorable conclusion'
        ]
    }

    return {
      platform,
      adaptations,
      keyTimings,
      attentionPoints
    }
  }

  private async generateVisualGuidance(
    request: StoryAnalysisRequest,
    narrativeElements: NarrativeElements,
    storyArc: StoryArc
  ): Promise<StoryIntelligenceResult['visualGuidance']> {
    // Generate visual style based on genre, mood, and platform
    let overallStyle = 'cinematic and professional'
    let colorPalette: string[] = ['natural tones']
    let cinematography: string[] = ['smooth camera movements']
    let transitions: string[] = ['seamless cuts']

    // Customize based on content type and genre
    if (request.contentType === 'promotional') {
      overallStyle = 'polished and brand-focused'
      colorPalette = ['brand colors', 'vibrant accents', 'professional whites']
      cinematography = ['dynamic shots', 'product showcases', 'lifestyle imagery']
      transitions = ['quick cuts', 'smooth fades', 'brand transitions']
    } else if (request.contentType === 'educational') {
      overallStyle = 'clear and informative'
      colorPalette = ['trustworthy blues', 'clean whites', 'accent highlights']
      cinematography = ['steady shots', 'clear demonstrations', 'informative graphics']
      transitions = ['educational wipes', 'informative overlays']
    } else if (request.contentType === 'entertainment') {
      overallStyle = 'engaging and dynamic'
      colorPalette = ['vibrant colors', 'emotional tones', 'contrast highlights']
      cinematography = ['creative angles', 'dynamic movements', 'emotional close-ups']
      transitions = ['creative wipes', 'dynamic cuts', 'emotional fades']
    }

    // Platform-specific adjustments
    if (request.platform === 'tiktok') {
      cinematography.push('vertical composition', 'quick pans', 'zoom effects')
      transitions.push('jump cuts', 'speed ramps', 'effect transitions')
    } else if (request.platform === 'linkedin') {
      colorPalette = ['professional blues', 'corporate grays', 'trust whites']
      cinematography = ['professional shots', 'business settings', 'authoritative angles']
    }

    return {
      overallStyle,
      colorPalette,
      cinematography,
      transitions
    }
  }

  private calculateQualityMetrics(
    storyArc: StoryArc,
    narrativeElements: NarrativeElements,
    platformOptimizations: StoryIntelligenceResult['platformOptimizations']
  ): StoryIntelligenceResult['qualityMetrics'] {
    // Calculate narrative coherence
    const narrativeCoherence = this.calculateNarrativeCoherence(storyArc)
    
    // Calculate emotional engagement
    const emotionalEngagement = this.calculateEmotionalEngagement(storyArc)
    
    // Calculate visual consistency
    const visualConsistency = this.calculateVisualConsistency(narrativeElements)
    
    // Calculate platform suitability
    const platformSuitability = this.calculatePlatformSuitability(platformOptimizations)
    
    // Calculate overall score
    const overallScore = (narrativeCoherence + emotionalEngagement + visualConsistency + platformSuitability) / 4

    return {
      narrativeCoherence,
      emotionalEngagement,
      visualConsistency,
      platformSuitability,
      overallScore
    }
  }

  private calculateNarrativeCoherence(storyArc: StoryArc): number {
    let score = 80 // Base score

    // Check for proper act structure
    if (storyArc.acts.length >= 2) score += 5
    if (storyArc.acts.length >= 3) score += 5

    // Check for key moments
    const hasHook = storyArc.keyMoments.some(m => m.type === 'hook')
    const hasClimax = storyArc.keyMoments.some(m => m.type === 'climax')
    const hasResolution = storyArc.keyMoments.some(m => m.type === 'resolution')

    if (hasHook) score += 3
    if (hasClimax) score += 4
    if (hasResolution) score += 3

    return Math.min(100, score)
  }

  private calculateEmotionalEngagement(storyArc: StoryArc): number {
    let score = 70 // Base score

    // Check emotional curve variety
    const emotions = storyArc.emotionalCurve.map(beat => beat.emotion)
    const uniqueEmotions = new Set(emotions)
    score += Math.min(20, uniqueEmotions.size * 4)

    // Check intensity variation
    const intensities = storyArc.emotionalCurve.map(beat => beat.intensity)
    const maxIntensity = Math.max(...intensities)
    const minIntensity = Math.min(...intensities)
    const intensityRange = maxIntensity - minIntensity

    if (intensityRange >= 3) score += 5
    if (intensityRange >= 5) score += 5

    return Math.min(100, score)
  }

  private calculateVisualConsistency(narrativeElements: NarrativeElements): number {
    let score = 85 // Base score

    // Check for comprehensive narrative elements
    if (narrativeElements.protagonist) score += 5
    if (narrativeElements.conflict) score += 5
    if (narrativeElements.theme.visualMetaphors.length > 1) score += 5

    return Math.min(100, score)
  }

  private calculatePlatformSuitability(
    platformOptimizations: StoryIntelligenceResult['platformOptimizations']
  ): number {
    let score = 75 // Base score

    // Check for platform-specific adaptations
    if (platformOptimizations.adaptations.length >= 3) score += 10
    if (platformOptimizations.adaptations.length >= 5) score += 5

    // Check for timing optimization
    if (platformOptimizations.keyTimings.length >= 4) score += 5
    if (platformOptimizations.keyTimings.length >= 6) score += 5

    return Math.min(100, score)
  }

  private parseJsonResponse(content: string, fallback: any): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return fallback
    } catch {
      return fallback
    }
  }
}