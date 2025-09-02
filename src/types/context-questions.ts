// Types for the Context Questions system

export interface ContextQuestion {
  id: string
  question: string
  type: 'single_select' | 'multiple_select'
  options: string[]
  category: 'style' | 'content' | 'technical' | 'platform' | 'composition'
  importance: 'high' | 'medium' | 'low'
  reasoning?: string // Why this question is relevant
}

export interface QuestionGenerationRequest {
  base_prompt: string
  config: {
    outputType: string
    platform: string
    style: string
    duration?: number
    aspectRatio: string
    qualityTier: string
  }
  media_assets?: Array<{
    id: string
    filename: string
    file_type: 'image' | 'video' | 'audio'
    description?: {
      userDescription?: string
      category: string
      tags: string[]
    }
  }>
  text_elements?: Array<{
    id: string
    text: string
    type: 'overlay' | 'in-video'
    context?: string
  }>
  selected_model?: string
  session_id?: string
}

export interface QuestionGenerationResponse {
  success: boolean
  data?: {
    questions: ContextQuestion[]
    reasoning: string[]
    estimated_improvement: string
    processing_time: number
  }
  error?: string
}

export interface QuestionAnswers {
  [questionId: string]: string | string[]
}

export interface ContextAnalysis {
  base_prompt_analysis: {
    intent: string
    complexity: 'simple' | 'moderate' | 'complex'
    missing_elements: string[]
    strengths: string[]
  }
  output_type_analysis: {
    type: string
    model_capabilities: string[]
    optimization_opportunities: string[]
  }
  media_analysis?: {
    count: number
    types: string[]
    descriptions_quality: 'poor' | 'good' | 'excellent'
    missing_context: string[]
  }
  platform_analysis: {
    platform: string
    specific_requirements: string[]
    optimization_suggestions: string[]
  }
}