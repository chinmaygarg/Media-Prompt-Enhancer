// Context Question Generation Engine
import { 
  ContextQuestion, 
  QuestionGenerationRequest, 
  ContextAnalysis,
  QuestionAnswers 
} from '@/types/context-questions'

export class QuestionGenerator {

  /**
   * Main function to generate context questions based on user inputs
   */
  static generateQuestions(request: QuestionGenerationRequest): {
    questions: ContextQuestion[]
    reasoning: string[]
    estimated_improvement: string
  } {
    // Analyze the input context
    const analysis = this.analyzeContext(request)
    
    // Generate questions based on analysis
    const questions = this.buildQuestions(analysis, request)
    
    // Limit to maximum 5 questions, prioritizing by importance
    const prioritizedQuestions = this.prioritizeQuestions(questions).slice(0, 5)
    
    // Generate reasoning
    const reasoning = this.generateReasoning(analysis, prioritizedQuestions)
    
    // Estimate improvement
    const improvement = this.estimateImprovement(analysis, prioritizedQuestions)
    
    return {
      questions: prioritizedQuestions,
      reasoning,
      estimated_improvement: improvement
    }
  }

  /**
   * Analyze the user's input to understand context and gaps
   */
  private static analyzeContext(request: QuestionGenerationRequest): ContextAnalysis {
    const { base_prompt, config, media_assets, text_elements } = request
    
    // Analyze base prompt
    const base_prompt_analysis = {
      intent: this.inferIntent(base_prompt, config.outputType),
      complexity: this.assessComplexity(base_prompt) as 'simple' | 'moderate' | 'complex',
      missing_elements: this.identifyMissingElements(base_prompt, config),
      strengths: this.identifyStrengths(base_prompt)
    }
    
    // Analyze output type and model
    const output_type_analysis = {
      type: config.outputType,
      model_capabilities: this.getModelCapabilities(config.outputType),
      optimization_opportunities: this.getOptimizationOpportunities(config)
    }
    
    // Analyze media assets
    const media_analysis = media_assets ? {
      count: media_assets.length,
      types: media_assets.map(asset => asset.file_type),
      descriptions_quality: this.assessDescriptionQuality(media_assets),
      missing_context: this.identifyMissingMediaContext(media_assets)
    } : undefined
    
    // Analyze platform requirements
    const platform_analysis = {
      platform: config.platform,
      specific_requirements: this.getPlatformRequirements(config.platform),
      optimization_suggestions: this.getPlatformOptimizations(config.platform, config.outputType)
    }
    
    return {
      base_prompt_analysis,
      output_type_analysis,
      media_analysis,
      platform_analysis
    }
  }

  /**
   * Build specific questions based on the analysis
   */
  private static buildQuestions(analysis: ContextAnalysis, request: QuestionGenerationRequest): ContextQuestion[] {
    const questions: ContextQuestion[] = []
    
    // Style and mood questions
    if (analysis.base_prompt_analysis.missing_elements.includes('mood') || 
        analysis.base_prompt_analysis.missing_elements.includes('style')) {
      questions.push(...this.generateStyleQuestions(analysis, request))
    }
    
    // Composition and framing questions
    if (analysis.base_prompt_analysis.missing_elements.includes('composition')) {
      questions.push(...this.generateCompositionQuestions(analysis, request))
    }
    
    // Content detail questions
    if (analysis.base_prompt_analysis.complexity === 'simple') {
      questions.push(...this.generateContentQuestions(analysis, request))
    }
    
    // Technical questions for video
    if (request.config.outputType.includes('video')) {
      questions.push(...this.generateVideoQuestions(analysis, request))
    }
    
    // Platform-specific questions
    if (request.config.platform !== 'general') {
      questions.push(...this.generatePlatformQuestions(analysis, request))
    }
    
    // Media enhancement questions
    if (analysis.media_analysis && analysis.media_analysis.missing_context.length > 0) {
      questions.push(...this.generateMediaQuestions(analysis, request))
    }
    
    return questions
  }

  /**
   * Generate style and mood related questions
   */
  private static generateStyleQuestions(analysis: ContextAnalysis, request: QuestionGenerationRequest): ContextQuestion[] {
    const questions: ContextQuestion[] = []
    const { base_prompt, config } = request
    
    // Infer content type for targeted questions
    const contentType = this.inferContentType(base_prompt)
    
    switch (contentType) {
      case 'portrait':
        questions.push({
          id: 'portrait_mood',
          question: 'What mood should this portrait convey?',
          type: 'single_select',
          options: ['Professional & Confident', 'Warm & Approachable', 'Artistic & Creative', 'Dramatic & Intense', 'Natural & Candid'],
          category: 'style',
          importance: 'high',
          reasoning: 'Portrait mood significantly affects lighting and composition choices'
        })
        break
        
      case 'landscape':
        questions.push({
          id: 'landscape_atmosphere',
          question: 'What atmosphere should dominate this landscape?',
          type: 'single_select', 
          options: ['Peaceful & Serene', 'Dramatic & Moody', 'Vibrant & Energetic', 'Mysterious & Dark', 'Bright & Cheerful'],
          category: 'style',
          importance: 'high',
          reasoning: 'Atmosphere guides color palette and lighting decisions'
        })
        break
        
      case 'product':
        questions.push({
          id: 'product_presentation',
          question: 'How should this product be presented?',
          type: 'single_select',
          options: ['Clean & Minimal', 'Lifestyle & Contextual', 'Dramatic & Premium', 'Technical & Detailed', 'Creative & Artistic'],
          category: 'style',
          importance: 'high',
          reasoning: 'Presentation style affects background, lighting, and composition'
        })
        break
        
      default:
        questions.push({
          id: 'overall_style',
          question: 'What visual style would work best?',
          type: 'single_select',
          options: ['Photorealistic', 'Artistic & Stylized', 'Cinematic', 'Clean & Modern', 'Dramatic & Moody'],
          category: 'style', 
          importance: 'medium',
          reasoning: 'Overall style guides the enhancement direction'
        })
    }
    
    // Color palette question
    if (!base_prompt.toLowerCase().includes('color')) {
      questions.push({
        id: 'color_preference',
        question: 'What color approach would enhance this?',
        type: 'single_select',
        options: ['Warm Tones', 'Cool Tones', 'Vibrant & Saturated', 'Muted & Subtle', 'Monochrome', 'Natural Colors'],
        category: 'style',
        importance: 'medium',
        reasoning: 'Color palette significantly affects mood and visual impact'
      })
    }
    
    return questions
  }

  /**
   * Generate composition and framing questions
   */
  private static generateCompositionQuestions(analysis: ContextAnalysis, request: QuestionGenerationRequest): ContextQuestion[] {
    const questions: ContextQuestion[] = []
    
    // Focus and framing
    questions.push({
      id: 'composition_focus',
      question: 'What should be the main focal point?',
      type: 'single_select',
      options: ['Center Subject', 'Rule of Thirds', 'Dynamic Diagonal', 'Leading Lines', 'Symmetrical Balance'],
      category: 'composition',
      importance: 'medium',
      reasoning: 'Composition structure affects visual hierarchy and impact'
    })
    
    // Depth and perspective
    if (request.config.outputType.includes('video') || !request.config.outputType.includes('text-to-image')) {
      questions.push({
        id: 'perspective_depth',
        question: 'What depth and perspective works best?',
        type: 'single_select', 
        options: ['Shallow Depth of Field', 'Deep Focus', 'Wide Angle View', 'Close-up Detail', 'Medium Distance'],
        category: 'composition',
        importance: 'medium',
        reasoning: 'Perspective affects viewer engagement and detail visibility'
      })
    }
    
    return questions
  }

  /**
   * Generate content detail questions
   */
  private static generateContentQuestions(analysis: ContextAnalysis, request: QuestionGenerationRequest): ContextQuestion[] {
    const questions: ContextQuestion[] = []
    
    // Environment and setting
    if (analysis.base_prompt_analysis.missing_elements.includes('environment')) {
      questions.push({
        id: 'environment_setting',
        question: 'What environment or setting would enhance this?',
        type: 'single_select',
        options: ['Indoor Studio', 'Natural Outdoor', 'Urban Environment', 'Abstract Background', 'Contextual Setting'],
        category: 'content',
        importance: 'high',
        reasoning: 'Environment provides important context and mood setting'
      })
    }
    
    // Additional elements
    questions.push({
      id: 'additional_elements',
      question: 'What elements would add visual interest?',
      type: 'multiple_select',
      options: ['Dramatic Lighting', 'Interesting Textures', 'Dynamic Movement', 'Complementary Objects', 'Atmospheric Effects'],
      category: 'content',
      importance: 'medium',
      reasoning: 'Additional elements can significantly enhance visual appeal'
    })
    
    return questions
  }

  /**
   * Generate video-specific questions
   */
  private static generateVideoQuestions(analysis: ContextAnalysis, request: QuestionGenerationRequest): ContextQuestion[] {
    const questions: ContextQuestion[] = []
    
    // Camera movement
    questions.push({
      id: 'camera_movement',
      question: 'What camera movement would work best?',
      type: 'single_select',
      options: ['Static Shot', 'Slow Pan', 'Zoom In/Out', 'Dolly Movement', 'Dynamic Rotation'],
      category: 'technical',
      importance: 'high',
      reasoning: 'Camera movement significantly affects video engagement and storytelling'
    })
    
    // Pacing and energy
    if (request.config.duration && request.config.duration > 5) {
      questions.push({
        id: 'video_pacing',
        question: 'What pacing suits your content best?',
        type: 'single_select',
        options: ['Slow & Contemplative', 'Steady & Measured', 'Dynamic & Energetic', 'Quick & Punchy', 'Variable Rhythm'],
        category: 'technical',
        importance: 'medium',
        reasoning: 'Pacing affects viewer retention and message delivery'
      })
    }
    
    return questions
  }

  /**
   * Generate platform-specific questions
   */
  private static generatePlatformQuestions(analysis: ContextAnalysis, request: QuestionGenerationRequest): ContextQuestion[] {
    const questions: ContextQuestion[] = []
    const { platform } = request.config
    
    switch (platform) {
      case 'instagram':
        questions.push({
          id: 'instagram_goal',
          question: 'What\'s your primary goal for Instagram?',
          type: 'single_select',
          options: ['High Engagement', 'Brand Awareness', 'Product Showcase', 'Storytelling', 'Community Building'],
          category: 'platform',
          importance: 'high',
          reasoning: 'Instagram goals affect visual style and content approach'
        })
        break
        
      case 'tiktok':
        questions.push({
          id: 'tiktok_hook',
          question: 'How should this grab TikTok attention?',
          type: 'single_select', 
          options: ['Immediate Visual Impact', 'Intriguing Opening', 'Trending Element', 'Surprising Twist', 'Strong Movement'],
          category: 'platform',
          importance: 'high',
          reasoning: 'TikTok requires strong opening hooks for engagement'
        })
        break
        
      case 'youtube':
        questions.push({
          id: 'youtube_purpose',
          question: 'What\'s the purpose for YouTube Shorts?',
          type: 'single_select',
          options: ['Educational Content', 'Entertainment', 'Product Demo', 'Behind Scenes', 'Quick Tips'],
          category: 'platform', 
          importance: 'medium',
          reasoning: 'YouTube purpose affects content structure and style'
        })
        break
        
      case 'linkedin':
        questions.push({
          id: 'linkedin_message',
          question: 'What professional message should this convey?',
          type: 'single_select',
          options: ['Expertise & Authority', 'Innovation & Growth', 'Reliability & Trust', 'Leadership & Vision', 'Results & Success'],
          category: 'platform',
          importance: 'high', 
          reasoning: 'LinkedIn content must align with professional messaging goals'
        })
        break
    }
    
    return questions
  }

  /**
   * Generate media enhancement questions
   */
  private static generateMediaQuestions(analysis: ContextAnalysis, request: QuestionGenerationRequest): ContextQuestion[] {
    const questions: ContextQuestion[] = []
    
    if (analysis.media_analysis && analysis.media_analysis.missing_context.includes('usage_intent')) {
      questions.push({
        id: 'media_usage',
        question: 'How should the reference media influence the result?',
        type: 'single_select',
        options: ['Style Reference Only', 'Character Consistency', 'Environment Matching', 'Color Palette Guide', 'Complete Transformation'],
        category: 'content',
        importance: 'high',
        reasoning: 'Clear media usage intent improves generation accuracy'
      })
    }
    
    return questions
  }

  /**
   * Prioritize questions by importance and relevance
   */
  private static prioritizeQuestions(questions: ContextQuestion[]): ContextQuestion[] {
    return questions.sort((a, b) => {
      // Sort by importance first
      const importanceOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance]
      
      if (importanceDiff !== 0) return importanceDiff
      
      // Then by category priority
      const categoryOrder = { 'style': 5, 'content': 4, 'composition': 3, 'technical': 2, 'platform': 1 }
      return (categoryOrder[b.category] || 0) - (categoryOrder[a.category] || 0)
    })
  }

  /**
   * Helper functions for analysis
   */
  private static inferIntent(prompt: string, outputType: string): string {
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.includes('portrait') || lowerPrompt.includes('headshot') || lowerPrompt.includes('person')) {
      return 'portrait_photography'
    }
    if (lowerPrompt.includes('landscape') || lowerPrompt.includes('nature') || lowerPrompt.includes('scenery')) {
      return 'landscape_photography'
    }
    if (lowerPrompt.includes('product') || lowerPrompt.includes('showcase') || lowerPrompt.includes('commercial')) {
      return 'product_showcase'
    }
    if (outputType.includes('video')) {
      return 'video_content'
    }
    
    return 'general_creative'
  }

  private static assessComplexity(prompt: string): string {
    const wordCount = prompt.split(' ').length
    const detailWords = ['detailed', 'intricate', 'complex', 'elaborate', 'sophisticated']
    const hasDetailWords = detailWords.some(word => prompt.toLowerCase().includes(word))
    
    if (wordCount > 20 || hasDetailWords) return 'complex'
    if (wordCount > 8) return 'moderate'
    return 'simple'
  }

  private static identifyMissingElements(prompt: string, config: any): string[] {
    const missing: string[] = []
    const lowerPrompt = prompt.toLowerCase()
    
    if (!lowerPrompt.match(/\b(mood|atmosphere|feeling|emotion)\b/)) missing.push('mood')
    if (!lowerPrompt.match(/\b(style|aesthetic|look|appearance)\b/)) missing.push('style')
    if (!lowerPrompt.match(/\b(background|setting|environment|location)\b/)) missing.push('environment')
    if (!lowerPrompt.match(/\b(lighting|light|bright|dark|shadows)\b/)) missing.push('lighting')
    if (!lowerPrompt.match(/\b(color|palette|tone|hue)\b/)) missing.push('color')
    if (!lowerPrompt.match(/\b(composition|framing|angle|perspective)\b/)) missing.push('composition')
    
    return missing
  }

  private static identifyStrengths(prompt: string): string[] {
    const strengths: string[] = []
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.match(/\b(detailed|specific|clear|precise)\b/)) strengths.push('specificity')
    if (lowerPrompt.match(/\b(cinematic|dramatic|artistic)\b/)) strengths.push('style_direction')
    if (lowerPrompt.match(/\b(professional|high.quality|premium)\b/)) strengths.push('quality_intent')
    
    return strengths
  }

  private static inferContentType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.match(/\b(portrait|headshot|person|face|character)\b/)) return 'portrait'
    if (lowerPrompt.match(/\b(landscape|nature|scenery|outdoor|mountain|ocean)\b/)) return 'landscape' 
    if (lowerPrompt.match(/\b(product|showcase|commercial|item|object)\b/)) return 'product'
    if (lowerPrompt.match(/\b(architecture|building|interior|room)\b/)) return 'architectural'
    if (lowerPrompt.match(/\b(abstract|artistic|creative|design)\b/)) return 'abstract'
    
    return 'general'
  }

  private static getModelCapabilities(outputType: string): string[] {
    const capabilities: string[] = []
    
    if (outputType.includes('image')) capabilities.push('high_detail', 'color_control', 'style_transfer')
    if (outputType.includes('video')) capabilities.push('motion', 'temporal_consistency', 'camera_movement')
    if (outputType.includes('audio')) capabilities.push('sound_design', 'music', 'voice')
    
    return capabilities
  }

  private static getOptimizationOpportunities(config: any): string[] {
    const opportunities: string[] = []
    
    if (config.qualityTier === 'production') opportunities.push('premium_enhancement', 'detail_optimization')
    if (config.platform !== 'general') opportunities.push('platform_specific_optimization')
    if (config.outputType.includes('video')) opportunities.push('motion_enhancement', 'pacing_optimization')
    
    return opportunities
  }

  private static assessDescriptionQuality(mediaAssets: any[]): 'poor' | 'good' | 'excellent' {
    if (!mediaAssets || mediaAssets.length === 0) return 'poor'
    
    const descriptionsExist = mediaAssets.filter(asset => 
      asset.description?.userDescription && asset.description.userDescription.length > 10
    ).length
    
    const ratio = descriptionsExist / mediaAssets.length
    
    if (ratio > 0.8) return 'excellent'
    if (ratio > 0.4) return 'good'
    return 'poor'
  }

  private static identifyMissingMediaContext(mediaAssets: any[]): string[] {
    const missing: string[] = []
    
    if (!mediaAssets || mediaAssets.length === 0) return []
    
    const hasUsageIntent = mediaAssets.some(asset => 
      asset.description?.userDescription?.toLowerCase().includes('should') ||
      asset.description?.userDescription?.toLowerCase().includes('want') ||
      asset.description?.userDescription?.toLowerCase().includes('use for')
    )
    
    if (!hasUsageIntent) missing.push('usage_intent')
    
    return missing
  }

  private static getPlatformRequirements(platform: string): string[] {
    const requirements: Record<string, string[]> = {
      'instagram': ['square_friendly', 'high_engagement', 'visual_impact'],
      'tiktok': ['vertical_format', 'immediate_hook', 'trending_elements'],
      'youtube': ['thumbnail_worthy', 'clear_messaging', 'retention_focused'],
      'linkedin': ['professional_tone', 'business_appropriate', 'value_focused']
    }
    
    return requirements[platform] || []
  }

  private static getPlatformOptimizations(platform: string, outputType: string): string[] {
    const optimizations: string[] = []
    
    if (platform === 'instagram' && outputType.includes('image')) {
      optimizations.push('instagram_aesthetic', 'story_friendly')
    }
    if (platform === 'tiktok' && outputType.includes('video')) {
      optimizations.push('tiktok_trends', 'short_attention_span')
    }
    
    return optimizations
  }

  private static generateReasoning(analysis: ContextAnalysis, questions: ContextQuestion[]): string[] {
    const reasoning: string[] = []
    
    reasoning.push(`Generated ${questions.length} targeted questions based on your "${analysis.base_prompt_analysis.intent}" intent`)
    
    if (analysis.base_prompt_analysis.missing_elements.length > 0) {
      reasoning.push(`Identified missing elements: ${analysis.base_prompt_analysis.missing_elements.join(', ')}`)
    }
    
    if (analysis.platform_analysis.platform !== 'general') {
      reasoning.push(`Added ${analysis.platform_analysis.platform}-specific optimizations`)
    }
    
    if (analysis.media_analysis && analysis.media_analysis.count > 0) {
      reasoning.push(`Included media enhancement questions for ${analysis.media_analysis.count} uploaded files`)
    }
    
    return reasoning
  }

  private static estimateImprovement(analysis: ContextAnalysis, questions: ContextQuestion[]): string {
    const highImportanceCount = questions.filter(q => q.importance === 'high').length
    const missingElementsCount = analysis.base_prompt_analysis.missing_elements.length
    
    if (highImportanceCount >= 3 && missingElementsCount >= 3) {
      return "Significant improvement expected (40-60% more detailed and targeted prompt)"
    }
    if (highImportanceCount >= 2 || missingElementsCount >= 2) {
      return "Notable improvement expected (25-40% enhancement in prompt quality)"
    }
    
    return "Moderate improvement expected (15-25% refinement in prompt clarity)"
  }

  /**
   * Process user answers into enhanced prompt additions
   */
  static processAnswers(answers: QuestionAnswers, questions: ContextQuestion[]): {
    prompt_additions: string[]
    negative_additions: string[]
    insights: string[]
  } {
    const prompt_additions: string[] = []
    const negative_additions: string[] = []
    const insights: string[] = []
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId)
      if (!question) return
      
      const answerArray = Array.isArray(answer) ? answer : [answer]
      
      answerArray.forEach(singleAnswer => {
        const enhancement = this.mapAnswerToPromptEnhancement(questionId, singleAnswer, question)
        if (enhancement) {
          prompt_additions.push(enhancement.positive)
          if (enhancement.negative) negative_additions.push(enhancement.negative)
          insights.push(`Applied ${question.category} preference: ${singleAnswer}`)
        }
      })
    })
    
    return {
      prompt_additions,
      negative_additions,
      insights
    }
  }

  private static mapAnswerToPromptEnhancement(
    questionId: string, 
    answer: string, 
    question: ContextQuestion
  ): { positive: string; negative?: string } | null {
    
    // Style mappings
    const styleMappings: Record<string, { positive: string; negative?: string }> = {
      'Professional & Confident': { 
        positive: 'professional confident expression, executive lighting, business appropriate styling',
        negative: 'casual, unprofessional, amateur' 
      },
      'Warm & Approachable': { 
        positive: 'warm friendly expression, soft natural lighting, approachable demeanor',
        negative: 'cold, distant, intimidating' 
      },
      'Dramatic & Moody': { 
        positive: 'dramatic moody atmosphere, strong contrast lighting, intense shadows',
        negative: 'flat lighting, cheerful, bright' 
      },
      'Clean & Minimal': { 
        positive: 'clean minimal composition, simple elegant styling, uncluttered background',
        negative: 'cluttered, busy, ornate' 
      },
      'Dynamic & Energetic': { 
        positive: 'dynamic energetic composition, vibrant colors, active movement',
        negative: 'static, dull, lifeless' 
      }
    }
    
    // Technical mappings for video
    const technicalMappings: Record<string, { positive: string; negative?: string }> = {
      'Slow Pan': { 
        positive: 'slow smooth panning movement, cinematic camera motion',
        negative: 'jerky movement, shaky camera' 
      },
      'Static Shot': { 
        positive: 'stable static composition, steady professional framing',
        negative: 'camera shake, unwanted movement' 
      },
      'Zoom In/Out': { 
        positive: 'smooth zoom transition, professional focal changes',
        negative: 'abrupt cuts, jarring transitions' 
      }
    }
    
    // Platform mappings  
    const platformMappings: Record<string, { positive: string; negative?: string }> = {
      'High Engagement': { 
        positive: 'Instagram-optimized visual impact, engaging social media aesthetic',
        negative: 'boring, low engagement' 
      },
      'Immediate Visual Impact': { 
        positive: 'TikTok-style immediate visual hook, attention-grabbing opening',
        negative: 'slow start, boring opening' 
      }
    }
    
    // Try to find mapping
    return styleMappings[answer] || technicalMappings[answer] || platformMappings[answer] || null
  }
}

export default QuestionGenerator