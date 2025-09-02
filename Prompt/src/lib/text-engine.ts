// Advanced Text Handling Engine
// Manages overlay text and in-video text generation across models

export interface TextOverlay {
  id: string
  text: string
  position: {
    x: number // 0-100 percentage from left
    y: number // 0-100 percentage from top
    anchor: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  }
  timing: {
    startTime: number // seconds
    endTime: number   // seconds
    fadeIn?: number   // seconds
    fadeOut?: number  // seconds
  }
  style: TextStyle
  animation?: TextAnimation
}

export interface TextStyle {
  fontFamily: string
  fontSize: number // relative to video resolution
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  color: string // hex or rgba
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  shadowColor?: string
  shadowOffset?: { x: number; y: number }
  shadowBlur?: number
  letterSpacing?: number
  lineHeight?: number
  textAlign: 'left' | 'center' | 'right'
  maxWidth?: number // percentage of video width
  padding?: { top: number; right: number; bottom: number; left: number }
  borderRadius?: number
}

export interface TextAnimation {
  type: 'fade' | 'slide' | 'bounce' | 'typewriter' | 'scale' | 'rotate' | 'glow'
  direction?: 'up' | 'down' | 'left' | 'right' | 'center'
  duration: number // seconds
  delay?: number   // seconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce'
}

export interface InVideoText {
  id: string
  text: string
  context: 'sign' | 'screen' | 'paper' | 'billboard' | 'book' | 'laptop' | 'phone' | 'custom'
  integration: 'natural' | 'overlay' | 'replacement'
  style: {
    language?: 'english' | 'chinese' | 'japanese' | 'korean' | 'arabic' | 'auto'
    appearance: 'handwritten' | 'printed' | 'digital' | 'neon' | 'carved' | 'painted'
    legibility: 'clear' | 'artistic' | 'stylized' | 'weathered'
  }
  modelSupport: ModelTextCapabilities
}

export interface ModelTextCapabilities {
  overlaySupport: boolean
  inVideoTextSupport: boolean
  multilingualText: boolean
  textQuality: 'poor' | 'fair' | 'good' | 'excellent'
  maxTextLength: number
  supportedFonts: string[]
  specialFeatures: string[]
}

// Model-specific text capabilities
export const MODEL_TEXT_CAPABILITIES: Record<string, ModelTextCapabilities> = {
  // Image Models
  'qwen-image': {
    overlaySupport: false,
    inVideoTextSupport: true,
    multilingualText: true,
    textQuality: 'excellent',
    maxTextLength: 200,
    supportedFonts: ['Arial', 'Times', 'Courier', 'Chinese', 'Japanese'],
    specialFeatures: ['bilingual', 'complex-typography', 'artistic-text']
  },
  'ideogram-v3': {
    overlaySupport: false,
    inVideoTextSupport: true,
    multilingualText: false,
    textQuality: 'excellent',
    maxTextLength: 150,
    supportedFonts: ['Arial', 'Times', 'Helvetica', 'Custom'],
    specialFeatures: ['typography-excellence', 'logo-text', 'artistic-fonts']
  },
  'imagen-4': {
    overlaySupport: false,
    inVideoTextSupport: true,
    multilingualText: false,
    textQuality: 'good',
    maxTextLength: 100,
    supportedFonts: ['Arial', 'Times', 'Helvetica'],
    specialFeatures: ['professional-text', 'commercial-quality']
  },

  // Video Models
  'seedance-1.0': {
    overlaySupport: true,
    inVideoTextSupport: true,
    multilingualText: false,
    textQuality: 'fair',
    maxTextLength: 80,
    supportedFonts: ['Arial', 'Times'],
    specialFeatures: ['fast-generation', 'basic-overlays']
  },
  'veo-3': {
    overlaySupport: true,
    inVideoTextSupport: true,
    multilingualText: true,
    textQuality: 'excellent',
    maxTextLength: 150,
    supportedFonts: ['Arial', 'Times', 'Helvetica', 'Custom'],
    specialFeatures: ['professional-text', 'dynamic-text', 'audio-sync']
  },
  'kling-2.1': {
    overlaySupport: true,
    inVideoTextSupport: true,
    multilingualText: true,
    textQuality: 'excellent',
    maxTextLength: 120,
    supportedFonts: ['Arial', 'Times', 'Helvetica', 'Chinese', 'Japanese'],
    specialFeatures: ['cinematic-text', 'professional-overlays', 'multilingual']
  },
  'hailuo-02': {
    overlaySupport: false,
    inVideoTextSupport: true,
    multilingualText: true,
    textQuality: 'good',
    maxTextLength: 100,
    supportedFonts: ['Arial', 'Chinese', 'Japanese'],
    specialFeatures: ['asian-text', 'cultural-context']
  }
}

// Preset text styles for common use cases
export const TEXT_STYLE_PRESETS: Record<string, Partial<TextStyle>> = {
  'modern-title': {
    fontFamily: 'Arial',
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { x: 2, y: 2 },
    shadowBlur: 4,
    textAlign: 'center'
  },
  'subtitle': {
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: { top: 8, right: 16, bottom: 8, left: 16 },
    borderRadius: 4,
    textAlign: 'center'
  },
  'call-to-action': {
    fontFamily: 'Arial',
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    padding: { top: 12, right: 24, bottom: 12, left: 24 },
    borderRadius: 8,
    textAlign: 'center'
  },
  'watermark': {
    fontFamily: 'Arial',
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right'
  },
  'handwritten': {
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: '400',
    color: '#2d3748',
    letterSpacing: 1,
    textAlign: 'left'
  }
}

/**
 * Creates optimized text configuration for specific models
 */
export function optimizeTextForModel(
  textElements: (TextOverlay | InVideoText)[],
  modelId: string,
  videoConfig: any
): {
  optimizedElements: (TextOverlay | InVideoText)[]
  recommendations: string[]
  warnings: string[]
} {
  const capabilities = MODEL_TEXT_CAPABILITIES[modelId]
  const recommendations: string[] = []
  const warnings: string[] = []
  const optimizedElements: (TextOverlay | InVideoText)[] = []

  if (!capabilities) {
    warnings.push(`No text capabilities defined for model ${modelId}`)
    return { optimizedElements: textElements, recommendations, warnings }
  }

  for (const element of textElements) {
    let optimized = { ...element }

    // Check text length
    if (element.text.length > capabilities.maxTextLength) {
      warnings.push(`Text "${element.text.substring(0, 30)}..." exceeds max length (${capabilities.maxTextLength} chars)`)
      optimized.text = element.text.substring(0, capabilities.maxTextLength - 3) + '...'
      recommendations.push('Consider shortening text for better generation quality')
    }

    // Handle overlay vs in-video text
    if ('position' in element) {
      // TextOverlay
      if (!capabilities.overlaySupport) {
        warnings.push(`Model ${modelId} doesn't support overlay text - converting to in-video text`)
        // Convert overlay to in-video text prompt addition
        recommendations.push('Text will be integrated into the scene instead of overlaid')
      }
    } else {
      // InVideoText
      if (!capabilities.inVideoTextSupport) {
        warnings.push(`Model ${modelId} doesn't support in-video text generation`)
        recommendations.push('Consider using overlay text or different model')
      }
    }

    // Check multilingual support
    if (containsNonLatinChars(element.text) && !capabilities.multilingualText) {
      warnings.push(`Model ${modelId} may have issues with non-Latin characters`)
      recommendations.push('Consider using a multilingual model like Qwen Image or Kling 2.1')
    }

    optimizedElements.push(optimized)
  }

  // Model-specific recommendations
  if (capabilities.textQuality === 'poor') {
    recommendations.push('Consider using Qwen Image, Ideogram v3, or Veo 3 for better text quality')
  }

  if (capabilities.specialFeatures.includes('bilingual')) {
    recommendations.push('This model excels at bilingual text generation')
  }

  return { optimizedElements, recommendations, warnings }
}

/**
 * Generates text-enhanced prompts for video generation
 */
export function generateTextEnhancedPrompt(
  basePrompt: string,
  textElements: (TextOverlay | InVideoText)[],
  modelId: string
): {
  enhancedPrompt: string
  negativePrompt: string
  textInstructions: string[]
} {
  const capabilities = MODEL_TEXT_CAPABILITIES[modelId]
  const textInstructions: string[] = []
  let enhancedPrompt = basePrompt
  let negativePrompt = ''

  // Separate overlays and in-video text
  const overlays = textElements.filter(el => 'position' in el) as TextOverlay[]
  const inVideoTexts = textElements.filter(el => !('position' in el)) as InVideoText[]

  // Handle in-video text
  if (inVideoTexts.length > 0 && capabilities?.inVideoTextSupport) {
    const textDescriptions = inVideoTexts.map(text => {
      const contextDesc = getTextContextDescription(text.context)
      const styleDesc = getTextStyleDescription(text.style)
      
      return `${contextDesc} displaying "${text.text}" in ${styleDesc} style`
    })

    enhancedPrompt += `, ${textDescriptions.join(', ')}`
    textInstructions.push(...textDescriptions)

    // Add quality modifiers based on model capabilities
    if (capabilities.textQuality === 'excellent') {
      enhancedPrompt += ', crisp readable text, professional typography'
    }

    // Add negative prompts for text quality
    negativePrompt += 'blurry text, unreadable text, garbled text, pixelated text, '
  }

  // Handle overlay text (model-dependent)
  if (overlays.length > 0) {
    if (capabilities?.overlaySupport) {
      textInstructions.push('Overlay text will be added in post-processing')
    } else {
      // Convert overlays to in-video text descriptions
      const overlayDescriptions = overlays.map(overlay => {
        const position = getPositionDescription(overlay.position)
        return `text "${overlay.text}" ${position}`
      })
      enhancedPrompt += `, ${overlayDescriptions.join(', ')}`
    }
  }

  return {
    enhancedPrompt: enhancedPrompt.trim(),
    negativePrompt: negativePrompt.trim(),
    textInstructions
  }
}

/**
 * Validates text configuration for consistency across video scenes
 */
export function validateTextConsistency(
  scenes: any[],
  textElements: (TextOverlay | InVideoText)[]
): {
  isConsistent: boolean
  issues: Array<{
    type: 'overlay' | 'in-video' | 'timing' | 'style'
    scene: number
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
  recommendations: string[]
} {
  const issues: any[] = []
  const recommendations: string[] = []

  // Check overlay text timing consistency
  const overlays = textElements.filter(el => 'position' in el) as TextOverlay[]
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)

  for (const overlay of overlays) {
    if (overlay.timing.endTime > totalDuration) {
      issues.push({
        type: 'timing',
        scene: -1,
        description: `Text "${overlay.text}" extends beyond video duration`,
        severity: 'high'
      })
    }

    // Check for overlapping text in same position
    const overlapping = overlays.filter(other => 
      other.id !== overlay.id &&
      positionsOverlap(overlay.position, other.position) &&
      timingsOverlap(overlay.timing, other.timing)
    )

    if (overlapping.length > 0) {
      issues.push({
        type: 'overlay',
        scene: -1,
        description: `Overlapping text elements may be hard to read`,
        severity: 'medium'
      })
    }
  }

  // Check in-video text consistency across scenes
  const inVideoTexts = textElements.filter(el => !('position' in el)) as InVideoText[]
  for (let i = 0; i < scenes.length - 1; i++) {
    const currentTexts = inVideoTexts.filter(text => text.id.includes(`scene_${i}`))
    const nextTexts = inVideoTexts.filter(text => text.id.includes(`scene_${i + 1}`))

    // Check for style consistency
    for (const currentText of currentTexts) {
      const matchingNext = nextTexts.find(next => next.context === currentText.context)
      if (matchingNext && matchingNext.style.appearance !== currentText.style.appearance) {
        issues.push({
          type: 'style',
          scene: i + 1,
          description: `Text style inconsistency between scenes`,
          severity: 'medium'
        })
      }
    }
  }

  // Generate recommendations
  if (issues.some(i => i.type === 'timing')) {
    recommendations.push('Adjust text timing to fit within video duration')
  }

  if (issues.some(i => i.type === 'overlay')) {
    recommendations.push('Adjust text positions to avoid overlap')
  }

  if (issues.some(i => i.type === 'style')) {
    recommendations.push('Maintain consistent text styles across scenes')
  }

  return {
    isConsistent: issues.filter(i => i.severity === 'high').length === 0,
    issues,
    recommendations
  }
}

// Helper functions
function containsNonLatinChars(text: string): boolean {
  return /[^\u0000-\u007F]/.test(text)
}

function getTextContextDescription(context: InVideoText['context']): string {
  const descriptions = {
    'sign': 'a visible sign or signage',
    'screen': 'a digital screen or monitor',
    'paper': 'paper or document',
    'billboard': 'a large billboard or advertisement',
    'book': 'an open book or magazine',
    'laptop': 'a laptop or computer screen',
    'phone': 'a smartphone or mobile device screen',
    'custom': 'visible text element'
  }
  return descriptions[context] || descriptions.custom
}

function getTextStyleDescription(style: InVideoText['style']): string {
  return `${style.legibility} ${style.appearance}`
}

function getPositionDescription(position: TextOverlay['position']): string {
  const positions = {
    'top-left': 'in the top left corner',
    'top-center': 'at the top center',
    'top-right': 'in the top right corner',
    'center-left': 'on the left side',
    'center': 'in the center',
    'center-right': 'on the right side',
    'bottom-left': 'in the bottom left corner',
    'bottom-center': 'at the bottom center',
    'bottom-right': 'in the bottom right corner'
  }
  return positions[position.anchor] || 'positioned'
}

function positionsOverlap(pos1: TextOverlay['position'], pos2: TextOverlay['position']): boolean {
  // Simple overlap detection - can be enhanced
  return Math.abs(pos1.x - pos2.x) < 20 && Math.abs(pos1.y - pos2.y) < 20
}

function timingsOverlap(timing1: TextOverlay['timing'], timing2: TextOverlay['timing']): boolean {
  return !(timing1.endTime <= timing2.startTime || timing2.endTime <= timing1.startTime)
}

/**
 * Generates overlay text configuration for video editing
 */
export function generateOverlayConfig(
  overlays: TextOverlay[],
  videoDimensions: { width: number; height: number }
): any {
  return overlays.map(overlay => ({
    id: overlay.id,
    text: overlay.text,
    startTime: overlay.timing.startTime,
    endTime: overlay.timing.endTime,
    position: {
      x: (overlay.position.x / 100) * videoDimensions.width,
      y: (overlay.position.y / 100) * videoDimensions.height
    },
    style: {
      ...overlay.style,
      fontSize: (overlay.style.fontSize / 100) * videoDimensions.width // Scale to video size
    },
    animation: overlay.animation
  }))
}