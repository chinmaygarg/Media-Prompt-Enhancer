import { z } from 'zod'

export const enhancementRequestSchema = z.object({
  original_prompt: z.string().min(5, 'Prompt must be at least 5 characters').max(500, 'Prompt too long'),
  content_type: z.enum(['social_media_post', 'product_ad', 'service_promotion', 'brand_awareness']),
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'multiple']),
  context: z.object({
    industry: z.string().optional(),
    target_audience: z.string().optional(),
    brand_voice: z.string().optional(),
    style_preferences: z.string().optional(),
  }).optional(),
  questions_answered: z.record(z.string()).optional(),
})

export const questionSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  options: z.array(z.string()),
  required: z.boolean().optional(),
})

export const analysisResultSchema = z.object({
  product_type: z.string(),
  key_features: z.array(z.string()),
  emotional_appeals: z.array(z.string()),
  target_audience: z.string(),
  competitive_advantages: z.array(z.string()),
  visual_style_recommendations: z.array(z.string()),
})

export const promptTemplateSchema = z.object({
  name: z.string().min(1, 'Template name required'),
  template_type: z.enum(['analysis', 'questions', 'enhancement']),
  content: z.string().min(10, 'Template content required'),
  variables: z.array(z.string()).optional(),
  version: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
})

export type EnhancementRequest = z.infer<typeof enhancementRequestSchema>
export type Question = z.infer<typeof questionSchema>
export type AnalysisResult = z.infer<typeof analysisResultSchema>
export type PromptTemplate = z.infer<typeof promptTemplateSchema>