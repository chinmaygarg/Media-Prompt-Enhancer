/**
 * LLM-Powered Intelligent Question Generation System
 * 
 * Generates contextually relevant questions using Gemini AI
 * Works alongside rule-based system for hybrid approach
 */

import { GeminiService, getGeminiService } from './llm/gemini-service'
import { SystemPromptsManager } from './llm/system-prompts'
import { 
  ContextQuestion, 
  QuestionGenerationRequest, 
  ContextAnalysis,
  QuestionAnswers 
} from '@/types/context-questions'

export interface LLMQuestionResult {
  questions: ContextQuestion[]
  reasoning: string[]
  estimated_improvement: string
  generation_method: 'llm' | 'rule-based' | 'hybrid'
  processing_time: number
  confidence_score: number
}

export class LLMQuestionGenerator {
  private geminiService: GeminiService
  private promptsManager: typeof SystemPromptsManager

  constructor(geminiService?: GeminiService) {
    this.geminiService = geminiService || getGeminiService()
    this.promptsManager = SystemPromptsManager
  }

  /**
   * Main LLM question generation method
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<LLMQuestionResult> {
    const startTime = Date.now()
    const sessionId = request.session_id || `llm_questions_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🧠 [LLMQuestionGenerator] ${sessionId} - Starting LLM question generation`)

    try {
      // Analyze complexity to determine generation strategy
      const complexity = this.analyzeComplexity(request)
      
      console.log(`📊 [LLMQuestionGenerator] ${sessionId} - Complexity analysis:`, {
        complexity_level: complexity.level,
        should_use_llm: complexity.shouldUseLLM,
        factors: complexity.factors
      })

      let result: LLMQuestionResult

      if (complexity.shouldUseLLM) {
        // Use LLM for complex or unique scenarios
        result = await this.generateLLMQuestions(request, sessionId)
      } else {
        // Fallback to rule-based for simple scenarios
        result = await this.generateFallbackQuestions(request, sessionId)
      }

      const processingTime = Date.now() - startTime
      result.processing_time = processingTime

      console.log(`✅ [LLMQuestionGenerator] ${sessionId} - Question generation completed:`, {
        method: result.generation_method,
        questions_count: result.questions.length,
        confidence_score: result.confidence_score,
        processing_time_ms: processingTime
      })

      return result
    } catch (error) {
      console.error(`❌ [LLMQuestionGenerator] ${sessionId} - Generation failed:`, error)
      
      // Always fallback to rule-based on error
      const fallbackResult = await this.generateFallbackQuestions(request, sessionId)
      fallbackResult.processing_time = Date.now() - startTime
      fallbackResult.reasoning.unshift('LLM generation failed, using rule-based fallback')
      
      return fallbackResult
    }
  }

  /**
   * Analyze request complexity to determine generation strategy
   */
  private analyzeComplexity(request: QuestionGenerationRequest): {
    level: 'simple' | 'moderate' | 'complex'
    shouldUseLLM: boolean
    factors: string[]
  } {
    const factors: string[] = []
    let complexityScore = 0

    // Analyze base prompt complexity
    const wordCount = request.base_prompt.split(' ').length
    if (wordCount > 20) {
      complexityScore += 2
      factors.push('long_detailed_prompt')
    } else if (wordCount > 8) {
      complexityScore += 1
      factors.push('moderate_prompt_length')
    }

    // Check for unique/creative terms that rules might miss
    const creativeLang = /\b(innovative|unique|experimental|abstract|surreal|avant-garde|conceptual|metaphorical)\b/i
    if (creativeLang.test(request.base_prompt)) {
      complexityScore += 3
      factors.push('creative_language')
    }

    // Check for technical/specialized terms
    const technicalTerms = /\b(cinematic|photorealistic|hyperrealistic|bokeh|chiaroscuro|tilt-shift|macro|telephoto)\b/i
    if (technicalTerms.test(request.base_prompt)) {
      complexityScore += 2
      factors.push('technical_terminology')
    }

    // Media assets complexity
    if (request.media_assets && request.media_assets.length > 0) {
      complexityScore += 1
      factors.push('has_media_assets')
      
      if (request.media_assets.some(asset => asset.description?.userDescription)) {
        complexityScore += 1
        factors.push('detailed_media_descriptions')
      }
    }

    // Text elements complexity
    if (request.text_elements && request.text_elements.length > 0) {
      complexityScore += 1
      factors.push('has_text_elements')
    }

    // Video complexity
    if (request.config.outputType.includes('video') && request.config.duration && request.config.duration > 10) {
      complexityScore += 2
      factors.push('complex_video_requirements')
    }

    // Determine level and strategy
    let level: 'simple' | 'moderate' | 'complex'
    let shouldUseLLM: boolean

    if (complexityScore >= 6) {
      level = 'complex'
      shouldUseLLM = true
    } else if (complexityScore >= 3) {
      level = 'moderate'
      shouldUseLLM = true // Use LLM for moderate complexity for better results
    } else {
      level = 'simple'
      shouldUseLLM = false // Rule-based is sufficient for simple cases
    }

    return { level, shouldUseLLM, factors }
  }

  /**
   * Generate questions using Gemini LLM
   */
  private async generateLLMQuestions(request: QuestionGenerationRequest, sessionId: string): Promise<LLMQuestionResult> {
    console.log(`🤖 [LLMQuestionGenerator] ${sessionId} - Using LLM generation strategy`)

    // Get specialized system prompt for question generation
    const systemPrompt = this.promptsManager.getPromptById('question_generator_intelligence')?.prompt || 
      this.buildQuestionGenerationPrompt()

    // Build context for LLM
    const contextPrompt = this.buildLLMContext(request)
    
    console.log(`📝 [LLMQuestionGenerator] ${sessionId} - Sending to Gemini:`, {
      system_prompt_length: systemPrompt.length,
      context_length: contextPrompt.length
    })

    // Generate questions using Gemini
    const response = await this.geminiService.generateText(contextPrompt, {
      systemPrompt,
      temperature: 0.4, // Balanced creativity and consistency
      maxTokens: 2000
    })

    // Parse and validate LLM response
    const parsedResult = this.parseLLMResponse(response.text, request)
    
    return {
      questions: parsedResult.questions,
      reasoning: parsedResult.reasoning,
      estimated_improvement: parsedResult.estimated_improvement,
      generation_method: 'llm',
      processing_time: 0, // Set by caller
      confidence_score: parsedResult.confidence_score
    }
  }

  /**
   * Build context prompt for LLM
   */
  private buildLLMContext(request: QuestionGenerationRequest): string {
    const { base_prompt, config, media_assets, text_elements } = request
    
    let context = `Generate contextual questions for this prompt enhancement request:\n\n`
    
    context += `BASE PROMPT: "${base_prompt}"\n\n`
    
    context += `OUTPUT CONFIGURATION:\n`
    context += `- Type: ${config.outputType}\n`
    context += `- Platform: ${config.platform}\n`
    context += `- Style: "${config.style}" ${config.style ? '' : '(not specified)'}\n`
    context += `- Quality Tier: ${config.qualityTier}\n`
    context += `- Aspect Ratio: ${config.aspectRatio}\n`
    if (config.duration) {
      context += `- Duration: ${config.duration} seconds\n`
    }
    
    if (media_assets && media_assets.length > 0) {
      context += `\nMEDIA ASSETS (${media_assets.length}):\n`
      media_assets.forEach((asset, i) => {
        context += `${i + 1}. ${asset.file_type.toUpperCase()}: ${asset.filename}\n`
        if (asset.description?.userDescription) {
          context += `   Description: "${asset.description.userDescription}"\n`
        }
      })
    }
    
    if (text_elements && text_elements.length > 0) {
      context += `\nTEXT ELEMENTS (${text_elements.length}):\n`
      text_elements.forEach((element, i) => {
        context += `${i + 1}. ${element.type.toUpperCase()}: "${element.text}"\n`
        if (element.context) {
          context += `   Context: ${element.context}\n`
        }
      })
    }
    
    return context
  }

  /**
   * System prompt for question generation
   */
  private buildQuestionGenerationPrompt(): string {
    return `You are an expert prompt enhancement consultant specializing in contextual question generation.

Your task is to analyze the provided prompt and configuration, then generate 3-5 highly targeted questions that will significantly improve the final result quality.

ANALYSIS FRAMEWORK:
1. Identify specific gaps in the prompt that affect output quality
2. Consider platform requirements and optimization opportunities  
3. Analyze media assets and their potential integration
4. Evaluate technical requirements for the output type
5. Assess user intent and suggest relevant enhancements

QUESTION REQUIREMENTS:
- Maximum 5 questions, prioritized by impact
- Each question should address a specific enhancement opportunity
- Provide clear, actionable answer options (3-6 options each)
- Include brief reasoning for why each question matters
- Category: style, content, composition, technical, or platform
- Importance: high, medium, or low

RESPONSE FORMAT (JSON):
{
  "questions": [
    {
      "id": "unique_id",
      "question": "What specific aspect needs clarification?",
      "type": "single_select",
      "options": ["Option 1", "Option 2", "Option 3"],
      "category": "style|content|composition|technical|platform",
      "importance": "high|medium|low",
      "reasoning": "Why this question improves the result"
    }
  ],
  "reasoning": [
    "Analysis insight 1",
    "Analysis insight 2"
  ],
  "estimated_improvement": "Quantified improvement expectation",
  "confidence_score": 0.85
}

Focus on questions that will have the highest impact on the final output quality and user satisfaction.`
  }

  /**
   * Parse and validate LLM response
   */
  private parseLLMResponse(responseText: string, request: QuestionGenerationRequest): {
    questions: ContextQuestion[]
    reasoning: string[]
    estimated_improvement: string
    confidence_score: number
  } {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in LLM response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and sanitize questions
      const questions: ContextQuestion[] = (parsed.questions || [])
        .slice(0, 5) // Max 5 questions
        .map((q: any, index: number) => ({
          id: q.id || `llm_question_${index + 1}`,
          question: q.question || 'Generated question',
          type: ['single_select', 'multiple_select'].includes(q.type) ? q.type : 'single_select',
          options: Array.isArray(q.options) ? q.options.slice(0, 6) : ['Option 1', 'Option 2'],
          category: ['style', 'content', 'composition', 'technical', 'platform'].includes(q.category) 
            ? q.category : 'content',
          importance: ['high', 'medium', 'low'].includes(q.importance) ? q.importance : 'medium',
          reasoning: q.reasoning || 'LLM-generated question for prompt enhancement'
        }))

      return {
        questions,
        reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : ['LLM analysis completed'],
        estimated_improvement: parsed.estimated_improvement || 'Improvement expected with contextual answers',
        confidence_score: typeof parsed.confidence_score === 'number' 
          ? Math.max(0, Math.min(1, parsed.confidence_score)) : 0.8
      }
    } catch (error) {
      console.error('Failed to parse LLM response:', error)
      
      // Return fallback questions
      return {
        questions: this.generateBasicFallbackQuestions(request),
        reasoning: ['LLM response parsing failed, using basic fallback questions'],
        estimated_improvement: 'Basic improvement expected',
        confidence_score: 0.3
      }
    }
  }

  /**
   * Generate fallback questions using existing rule-based system
   */
  private async generateFallbackQuestions(request: QuestionGenerationRequest, sessionId: string): Promise<LLMQuestionResult> {
    console.log(`📋 [LLMQuestionGenerator] ${sessionId} - Using rule-based fallback strategy`)
    
    // Import and use existing QuestionGenerator
    const { QuestionGenerator } = await import('./question-generator')
    const result = QuestionGenerator.generateQuestions(request)
    
    return {
      questions: result.questions,
      reasoning: [...result.reasoning, 'Generated using proven rule-based system'],
      estimated_improvement: result.estimated_improvement,
      generation_method: 'rule-based',
      processing_time: 0, // Set by caller
      confidence_score: 0.9 // High confidence in rule-based system
    }
  }

  /**
   * Generate basic fallback questions when everything else fails
   */
  private generateBasicFallbackQuestions(request: QuestionGenerationRequest): ContextQuestion[] {
    const questions: ContextQuestion[] = []

    // Always ask about style if not specified
    if (!request.config.style || request.config.style.trim().length === 0) {
      questions.push({
        id: 'basic_style',
        question: 'What visual style would work best for this?',
        type: 'single_select',
        options: ['Photorealistic', 'Artistic & Creative', 'Clean & Modern', 'Dramatic & Moody'],
        category: 'style',
        importance: 'high',
        reasoning: 'Style guidance significantly improves output quality'
      })
    }

    // Always ask about mood
    questions.push({
      id: 'basic_mood',
      question: 'What mood or atmosphere should this convey?',
      type: 'single_select',
      options: ['Professional', 'Creative & Artistic', 'Warm & Friendly', 'Dynamic & Energetic'],
      category: 'style',
      importance: 'medium',
      reasoning: 'Mood affects color palette and composition choices'
    })

    return questions
  }

  /**
   * Smart method selection - determines best generation approach
   */
  static async generateSmartQuestions(request: QuestionGenerationRequest): Promise<LLMQuestionResult> {
    const generator = new LLMQuestionGenerator()
    return generator.generateQuestions(request)
  }
}

export default LLMQuestionGenerator