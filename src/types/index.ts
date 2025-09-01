// Core types for the prompt enhancement service

export interface User {
  id: string
  email: string
  subscription_tier: 'free' | 'creator' | 'professional' | 'enterprise'
  usage_count: number
  usage_reset_date: string
  created_at: string
  updated_at: string
}

export interface PromptTemplate {
  id: string
  name: string
  template_type: 'analysis' | 'questions' | 'enhancement'
  content: string
  variables: string[]
  version: number
  is_active: boolean
  created_at: string
}

export interface EnhancementSession {
  id: string
  user_id: string
  original_prompt: string
  enhanced_prompt?: string
  content_type: string
  platform: string
  questions_data?: Question[]
  user_answers?: Record<string, string>
  processing_time_ms?: number
  created_at: string
}

export interface Question {
  question_id: string
  question_text: string
  options: string[]
  required?: boolean
}

export interface AnalysisResult {
  product_type: string
  key_features: string[]
  emotional_appeals: string[]
  target_audience: string
  competitive_advantages: string[]
  visual_style_recommendations: string[]
}

export interface EnhancementRequest {
  original_prompt: string
  content_type: 'social_media_post' | 'product_ad' | 'service_promotion' | 'brand_awareness'
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'multiple'
  context?: {
    industry?: string
    target_audience?: string
    brand_voice?: string
    style_preferences?: string
  }
  questions_answered?: Record<string, string>
}

export interface EnhancementResponse {
  success: boolean
  data?: {
    enhanced_prompt: string
    analysis: AnalysisResult
    questions?: Question[]
    metadata: {
      processing_time_ms: number
      model_used: string
      confidence_score: number
    }
  }
  error?: string
}