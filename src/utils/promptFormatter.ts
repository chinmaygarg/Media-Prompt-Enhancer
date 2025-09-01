/**
 * Utility functions for formatting enhanced prompt objects into readable text
 */

// Helper function to safely convert any value to string
function safeStringify(value: any): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return value.toString()
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object' && value !== null) {
    // Try to format objects in a readable way
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${safeStringify(val)}`)
      .join(', ')
  }
  return String(value)
}

// Helper function to format content object
function formatContentObject(content: any): string {
  if (typeof content === 'string') return content
  if (!content || typeof content !== 'object') return 'Content not available'
  
  const contentLines: string[] = []
  
  if (content.headline) {
    contentLines.push(`🎯 Headline: ${content.headline}`)
  }
  if (content.body) {
    contentLines.push(`📝 Body: ${content.body}`)
  }
  if (content.call_to_action) {
    contentLines.push(`📢 Call to Action: ${content.call_to_action}`)
  }
  
  // Handle any other content properties
  Object.keys(content).forEach(key => {
    if (!['headline', 'body', 'call_to_action'].includes(key) && content[key]) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      contentLines.push(`${label}: ${safeStringify(content[key])}`)
    }
  })
  
  return contentLines.join('\n')
}

// Helper function to format colors object
function formatColorsObject(colors: any): string {
  if (typeof colors === 'string') return colors
  if (!colors || typeof colors !== 'object') return 'Colors not specified'
  
  const colorLines: string[] = []
  
  if (colors.dominant) colorLines.push(`Primary: ${colors.dominant}`)
  if (colors.eco_green) colorLines.push(`Eco Green: ${colors.eco_green}`)
  if (colors.background) colorLines.push(`Background: ${colors.background}`)
  if (colors.accent) colorLines.push(`Accent: ${colors.accent}`)
  
  // Handle any other color properties
  Object.keys(colors).forEach(key => {
    if (!['dominant', 'eco_green', 'background', 'accent'].includes(key) && colors[key]) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      colorLines.push(`${label}: ${colors[key]}`)
    }
  })
  
  return colorLines.join(', ')
}

// Type definition for the enhanced prompt structure
export interface EnhancedPromptObject {
  product?: string
  content_type?: string
  description?: string
  content?: string
  visuals?: any
  visual_details?: {
    lighting?: string
    composition?: string
    colors?: string
  }
  emotional_appeals?: string[]
  emotional_triggers?: string[]
  psychological_appeals?: string[]
  platform_specific_optimization?: {
    hashtags?: string[]
    caption?: string
    call_to_action?: string
  }
  optimization?: any
  creativity?: {
    concept?: string
    engagement?: string
  }
  // Fallback for any other structure
  [key: string]: any
}

/**
 * Formats an enhanced prompt object into a readable, structured text
 * Handles various object structures that the LLM might return
 */
export function formatEnhancedPrompt(promptData: any): string {
  // Handle different input types
  if (typeof promptData === 'string') {
    return promptData // Already a string, return as-is
  }
  
  if (!promptData || typeof promptData !== 'object') {
    return 'Enhanced prompt could not be formatted.'
  }

  const sections: string[] = []

  // Title (new field)
  if (promptData.title) {
    sections.push(`🎯 TITLE: ${promptData.title}`)
  }

  // Main content/description
  if (promptData.product) {
    sections.push(`🎯 PRODUCT/SERVICE: ${promptData.product}`)
  }
  
  if (promptData.description) {
    sections.push(`📝 DESCRIPTION:\n${promptData.description}`)
  }
  
  // Handle content - can now be an object or string
  if (promptData.content) {
    sections.push(`📄 CONTENT:\n${formatContentObject(promptData.content)}`)
  }

  // Visual details
  if (promptData.visual_details || promptData.visuals) {
    const visuals = promptData.visual_details || promptData.visuals
    const visualLines: string[] = []
    
    if (visuals.lighting) {
      visualLines.push(`💡 Lighting: ${visuals.lighting}`)
    }
    if (visuals.composition) {
      visualLines.push(`📸 Composition: ${visuals.composition}`)
    }
    if (visuals.colors) {
      visualLines.push(`🎨 Colors: ${formatColorsObject(visuals.colors)}`)
    }
    
    // Handle other visual properties
    Object.keys(visuals).forEach(key => {
      if (!['lighting', 'composition', 'colors'].includes(key) && visuals[key]) {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
        visualLines.push(`${label}: ${safeStringify(visuals[key])}`)
      }
    })
    
    if (visualLines.length > 0) {
      sections.push(`🎨 VISUAL DETAILS:\n${visualLines.join('\n')}`)
    }
  }

  // Emotional appeals and triggers
  const emotionalContent = promptData.emotional_appeals || promptData.emotional_triggers
  if (emotionalContent && Array.isArray(emotionalContent) && emotionalContent.length > 0) {
    sections.push(`❤️ EMOTIONAL TRIGGERS:\n${emotionalContent.map(item => `• ${item}`).join('\n')}`)
  }

  // Psychological appeals
  if (promptData.psychological_appeals && Array.isArray(promptData.psychological_appeals) && promptData.psychological_appeals.length > 0) {
    sections.push(`🧠 PSYCHOLOGICAL APPEALS:\n${promptData.psychological_appeals.map(item => `• ${item}`).join('\n')}`)
  }

  // Platform optimization
  if (promptData.platform_specific_optimization) {
    const platform = promptData.platform_specific_optimization
    const platformLines: string[] = []
    
    if (platform.hashtags && Array.isArray(platform.hashtags)) {
      platformLines.push(`#️⃣ Hashtags: ${platform.hashtags.join(' ')}`)
    }
    
    if (platform.caption) {
      platformLines.push(`📝 Caption: ${platform.caption}`)
    }
    
    if (platform.call_to_action) {
      platformLines.push(`📢 Call to Action: ${platform.call_to_action}`)
    }
    
    if (platformLines.length > 0) {
      sections.push(`📱 PLATFORM OPTIMIZATION:\n${platformLines.join('\n')}`)
    }
  }

  // Creativity and concept
  if (promptData.creativity) {
    const creativity = promptData.creativity
    const creativityLines: string[] = []
    
    if (creativity.concept) {
      creativityLines.push(`💡 Concept: ${creativity.concept}`)
    }
    
    if (creativity.engagement) {
      creativityLines.push(`🤝 Engagement: ${creativity.engagement}`)
    }
    
    if (creativityLines.length > 0) {
      sections.push(`✨ CREATIVE DIRECTION:\n${creativityLines.join('\n')}`)
    }
  }

  // Handle any other top-level properties that might be useful
  const handledKeys = new Set([
    'title', 'product', 'description', 'content', 'visual_details', 'visuals', 
    'emotional_appeals', 'emotional_triggers', 'psychological_appeals', 
    'platform_specific_optimization', 'creativity', 'content_type'
  ])

  Object.keys(promptData).forEach(key => {
    if (!handledKeys.has(key) && promptData[key]) {
      const value = promptData[key]
      const label = key.toUpperCase().replace(/_/g, ' ')
      
      if (typeof value === 'string') {
        sections.push(`${label}: ${value}`)
      } else if (Array.isArray(value) && value.length > 0) {
        sections.push(`${label}:\n${value.map(item => `• ${safeStringify(item)}`).join('\n')}`)
      } else if (typeof value === 'object' && value !== null) {
        sections.push(`${label}: ${safeStringify(value)}`)
      }
    }
  })

  // Join all sections with double line breaks
  const result = sections.join('\n\n')
  
  // Fallback if no sections were found
  if (!result.trim()) {
    // Try to extract any meaningful text from the object
    const flattenObject = (obj: any, prefix = ''): string[] => {
      const lines: string[] = []
      
      Object.keys(obj).forEach(key => {
        const value = obj[key]
        const fullKey = prefix ? `${prefix}.${key}` : key
        
        if (typeof value === 'string' && value.trim()) {
          lines.push(`${fullKey}: ${value}`)
        } else if (Array.isArray(value) && value.length > 0) {
          lines.push(`${fullKey}: ${value.join(', ')}`)
        } else if (typeof value === 'object' && value !== null) {
          lines.push(...flattenObject(value, fullKey))
        }
      })
      
      return lines
    }
    
    const flatLines = flattenObject(promptData)
    return flatLines.length > 0 ? flatLines.join('\n') : 'Enhanced prompt data received but could not be formatted.'
  }
  
  return result
}

/**
 * Formats the enhanced prompt for clipboard copying
 * Creates a clean, professional version suitable for AI prompt tools
 */
export function formatForClipboard(promptData: any): string {
  if (typeof promptData === 'string') {
    return promptData
  }
  
  if (!promptData || typeof promptData !== 'object') {
    return 'Enhanced prompt could not be formatted.'
  }

  // Create a more concise version for copying
  const parts: string[] = []
  
  // Main product/service description
  if (promptData.product) {
    parts.push(promptData.product)
  }
  
  // Add key visual details
  if (promptData.visual_details) {
    const visuals = promptData.visual_details
    if (visuals.composition) parts.push(visuals.composition)
    if (visuals.lighting) parts.push(visuals.lighting)
    if (visuals.colors) parts.push(visuals.colors)
  }
  
  // Add emotional/psychological elements
  if (promptData.emotional_triggers && Array.isArray(promptData.emotional_triggers)) {
    parts.push(...promptData.emotional_triggers)
  }
  
  // Add platform-specific elements
  if (promptData.platform_specific_optimization?.caption) {
    parts.push(promptData.platform_specific_optimization.caption)
  }
  
  // Add creative concept
  if (promptData.creativity?.concept) {
    parts.push(promptData.creativity.concept)
  }
  
  return parts.join(' • ')
}