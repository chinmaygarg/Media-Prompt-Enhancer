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

// Storage and Media Types
export interface MediaAsset {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_type: 'image' | 'video' | 'audio'
  mime_type: string
  file_size_bytes: number
  storage_path: string
  storage_bucket: string
  upload_session_id?: string
  created_at: string
  expires_at?: string
}

export interface Product {
  id: string
  user_id: string
  name: string
  category: 'physical_product' | 'software' | 'service' | 'brand'
  description?: string
  key_features: string[]
  target_audience?: string
  price_point?: 'budget' | 'mid-range' | 'premium' | 'luxury'
  brand_colors: string[] // Array of hex codes
  brand_voice?: string
  prohibited_contexts: string[]
  required_disclaimers: string[]
  preferred_models: string[]
  quality_tier: 'production' | 'social' | 'draft'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductAsset {
  id: string
  product_id: string
  media_asset_id: string
  asset_type: 'reference_image' | 'logo' | 'brand_asset'
  display_order: number
  created_at: string
}

export interface ConsistencyObject {
  id: string
  user_id: string
  name: string
  object_type: 'character' | 'scene' | 'style'
  description: string
  locked_attributes: string[] // ["blue eyes", "red hair"]
  style_notes?: string
  reference_prompt?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ConsistencyObjectAsset {
  id: string
  consistency_object_id: string
  media_asset_id: string
  created_at: string
}

export interface SessionAsset {
  id: string
  session_id: string
  media_asset_id: string
  asset_role: 'reference_image' | 'reference_video' | 'audio_style'
  created_at: string
}

// Extended Enhancement Request with multimodal support
export interface EnhancementRequestV2 {
  original_prompt: string
  content_type: 'text_to_image' | 'image_text_to_image' | 'text_to_video' | 
                'image_text_to_video' | 'text_to_video_audio' | 'image_text_to_video_audio'
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'multiple'
  
  // Media inputs (asset IDs from uploaded files)
  reference_images?: string[]
  reference_video?: string
  audio_style_reference?: string
  
  // Product/consistency references
  product_id?: string
  consistency_object_ids?: string[]
  
  context?: {
    industry?: string
    target_audience?: string
    brand_voice?: string
    style_preferences?: string
  }
  questions_answered?: Record<string, string>
}

// File upload types
export interface FileUploadRequest {
  files: File[]
  file_type: 'image' | 'video' | 'audio'
  session_id?: string
  temporary?: boolean
  expires_in_hours?: number
}

export interface FileUploadResponse {
  success: boolean
  data?: {
    uploaded_assets: MediaAsset[]
    total_size_bytes: number
    quota_remaining: {
      files: number
      storage_mb: number
    }
  }
  error?: string
}

// Subscription quotas
export interface SubscriptionQuotas {
  max_files: number
  max_size_mb: number
  total_storage_mb: number
  concurrent_uploads: number
}

export const UPLOAD_LIMITS: Record<string, SubscriptionQuotas> = {
  free: { max_files: 2, max_size_mb: 10, total_storage_mb: 100, concurrent_uploads: 1 },
  creator: { max_files: 5, max_size_mb: 50, total_storage_mb: 1000, concurrent_uploads: 3 },
  professional: { max_files: 10, max_size_mb: 100, total_storage_mb: 5000, concurrent_uploads: 5 },
  enterprise: { max_files: 50, max_size_mb: 500, total_storage_mb: 25000, concurrent_uploads: 10 }
}