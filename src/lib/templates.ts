import { createServiceSupabase } from './supabase'
import type { PromptTemplate } from '@/types'

export class TemplateManager {
  private supabase = createServiceSupabase()
  private templateCache = new Map<string, PromptTemplate>()
  private lastCacheUpdate = 0
  private cacheValidityMs = 5 * 60 * 1000 // 5 minutes

  async getTemplate(templateType: string): Promise<PromptTemplate | null> {
    // Check cache first
    const cacheKey = `${templateType}-active`
    if (this.isCacheValid() && this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey) || null
    }

    try {
      const { data, error } = await this.supabase
        .from('prompt_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error(`Failed to fetch template ${templateType}:`, error)
        return null
      }

      // Cache the result
      this.templateCache.set(cacheKey, data)
      this.lastCacheUpdate = Date.now()

      return data
    } catch (error) {
      console.error(`Error fetching template ${templateType}:`, error)
      return null
    }
  }

  async getAllTemplates(): Promise<PromptTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('prompt_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_type', { ascending: true })

      if (error) {
        console.error('Failed to fetch all templates:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching all templates:', error)
      return []
    }
  }

  async createTemplate(template: Omit<PromptTemplate, 'id' | 'created_at'>): Promise<PromptTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('prompt_templates')
        .insert([template])
        .select()
        .single()

      if (error) {
        console.error('Failed to create template:', error)
        return null
      }

      // Clear cache to force refresh
      this.clearCache()

      return data
    } catch (error) {
      console.error('Error creating template:', error)
      return null
    }
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('prompt_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Failed to update template:', error)
        return null
      }

      // Clear cache to force refresh
      this.clearCache()

      return data
    } catch (error) {
      console.error('Error updating template:', error)
      return null
    }
  }

  async deactivateTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('prompt_templates')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        console.error('Failed to deactivate template:', error)
        return false
      }

      // Clear cache to force refresh
      this.clearCache()

      return true
    } catch (error) {
      console.error('Error deactivating template:', error)
      return false
    }
  }

  // Template variable replacement
  async renderTemplate(templateType: string, variables: Record<string, any>): Promise<string | null> {
    const template = await this.getTemplate(templateType)
    if (!template) {
      return null
    }

    let renderedContent = template.content

    // Replace all variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
      renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), stringValue)
    }

    return renderedContent
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheValidityMs
  }

  private clearCache(): void {
    this.templateCache.clear()
    this.lastCacheUpdate = 0
  }

  // Get template with fallback to default
  async getTemplateWithFallback(templateType: string, defaultContent: string): Promise<string> {
    const template = await this.getTemplate(templateType)
    return template?.content || defaultContent
  }
}

// Export singleton instance
export const templateManager = new TemplateManager()