// Visual Consistency Engine
// Maintains character, environment, and style consistency across video clips

export interface ConsistencyProfile {
  id: string
  name: string
  type: 'character' | 'environment' | 'product' | 'style' | 'brand'
  description: string
  
  // Core consistency attributes
  lockedAttributes: LockedAttribute[]
  styleNotes: string
  referencePrompt: string
  
  // Visual consistency rules
  consistencyRules: ConsistencyRule[]
  
  // Metadata
  createdAt: string
  lastUsed?: string
  usageCount: number
}

export interface LockedAttribute {
  attribute: string // "eye color", "hair style", "lighting direction", "brand colors"
  value: string    // "blue eyes", "short brown hair", "warm from left", "#FF6B35"
  importance: 'critical' | 'important' | 'preferred'
  applicableScenes: 'all' | 'character-focused' | 'environment-focused' | 'product-focused'
}

export interface ConsistencyRule {
  ruleId: string
  condition: string // "when character is visible", "in all scenes", "during dialogue"
  requirement: string // "maintain same facial features", "keep consistent lighting"
  negativePrompt?: string // "different clothing, changed appearance"
  weight: number // 0.1 to 1.0, how strictly to enforce
}

export interface ConsistencyAnalysis {
  overallScore: number // 0-100, predicted consistency score
  riskFactors: string[] // Potential consistency issues
  recommendations: string[] // Suggestions to improve consistency
  modelSuitability: number // 0-100, how well the selected model handles this consistency
}

// Character consistency profiles
export const CHARACTER_TEMPLATES: Record<string, Partial<ConsistencyProfile>> = {
  'professional-person': {
    name: 'Professional Person',
    type: 'character',
    description: 'Business professional for corporate content',
    lockedAttributes: [
      {
        attribute: 'appearance',
        value: 'same person, professional attire, confident posture',
        importance: 'critical',
        applicableScenes: 'all'
      },
      {
        attribute: 'clothing',
        value: 'business suit, consistent color scheme',
        importance: 'important', 
        applicableScenes: 'all'
      },
      {
        attribute: 'expression',
        value: 'professional, approachable demeanor',
        importance: 'preferred',
        applicableScenes: 'character-focused'
      }
    ],
    consistencyRules: [
      {
        ruleId: 'char-001',
        condition: 'when character is visible',
        requirement: 'maintain exact same facial features, hair, and build',
        negativePrompt: 'different person, changed appearance, different clothing style',
        weight: 1.0
      }
    ]
  },

  'product-hero': {
    name: 'Hero Product',
    type: 'product',
    description: 'Main product featured throughout video',
    lockedAttributes: [
      {
        attribute: 'product_appearance',
        value: 'same product model, consistent branding, unchanged design',
        importance: 'critical',
        applicableScenes: 'product-focused'
      },
      {
        attribute: 'product_positioning',
        value: 'professional presentation, optimal viewing angle',
        importance: 'important',
        applicableScenes: 'product-focused'
      }
    ],
    consistencyRules: [
      {
        ruleId: 'prod-001',
        condition: 'when product is visible',
        requirement: 'maintain exact same product design, colors, and branding',
        negativePrompt: 'different product version, changed colors, missing branding',
        weight: 1.0
      }
    ]
  }
}

// Environment consistency profiles  
export const ENVIRONMENT_TEMPLATES: Record<string, Partial<ConsistencyProfile>> = {
  'office-setting': {
    name: 'Modern Office',
    type: 'environment',
    description: 'Professional office environment',
    lockedAttributes: [
      {
        attribute: 'lighting',
        value: 'natural daylight from window, warm ambient lighting',
        importance: 'critical',
        applicableScenes: 'all'
      },
      {
        attribute: 'background',
        value: 'modern office, clean desk, professional atmosphere',
        importance: 'important',
        applicableScenes: 'all'
      },
      {
        attribute: 'color_palette',
        value: 'neutral tones, white walls, natural wood accents',
        importance: 'preferred',
        applicableScenes: 'environment-focused'
      }
    ]
  },

  'studio-setup': {
    name: 'Studio Setup',
    type: 'environment', 
    description: 'Controlled studio environment',
    lockedAttributes: [
      {
        attribute: 'lighting',
        value: 'professional studio lighting, controlled shadows',
        importance: 'critical',
        applicableScenes: 'all'
      },
      {
        attribute: 'background',
        value: 'clean studio backdrop, minimal distractions',
        importance: 'critical',
        applicableScenes: 'all'
      }
    ]
  }
}

// Style consistency profiles
export const STYLE_TEMPLATES: Record<string, Partial<ConsistencyProfile>> = {
  'cinematic': {
    name: 'Cinematic Style',
    type: 'style',
    description: 'Professional cinematic look and feel',
    lockedAttributes: [
      {
        attribute: 'visual_style',
        value: 'cinematic composition, dramatic lighting, film-like quality',
        importance: 'critical',
        applicableScenes: 'all'
      },
      {
        attribute: 'color_grading',
        value: 'warm highlights, deep shadows, professional color grade',
        importance: 'important',
        applicableScenes: 'all'
      }
    ]
  },

  'brand-consistent': {
    name: 'Brand Consistent',
    type: 'brand',
    description: 'Maintains brand identity throughout',
    lockedAttributes: [
      {
        attribute: 'brand_colors',
        value: 'consistent brand color palette throughout',
        importance: 'critical',
        applicableScenes: 'all'
      },
      {
        attribute: 'brand_style',
        value: 'professional brand aesthetic, clean presentation',
        importance: 'critical',
        applicableScenes: 'all'
      }
    ]
  }
}

/**
 * Creates a consistency profile from user input or templates
 */
export function createConsistencyProfile(
  input: {
    name: string
    type: ConsistencyProfile['type']
    description: string
    userAttributes?: string[]
    templateId?: string
  }
): ConsistencyProfile {
  const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Start with template if specified
  let template: Partial<ConsistencyProfile> = {}
  if (input.templateId) {
    template = CHARACTER_TEMPLATES[input.templateId] || 
               ENVIRONMENT_TEMPLATES[input.templateId] || 
               STYLE_TEMPLATES[input.templateId] || {}
  }
  
  // Convert user attributes to locked attributes
  const userLockedAttributes: LockedAttribute[] = (input.userAttributes || []).map(attr => ({
    attribute: 'user_defined',
    value: attr,
    importance: 'important' as const,
    applicableScenes: 'all' as const
  }))
  
  return {
    id: profileId,
    name: input.name,
    type: input.type,
    description: input.description,
    lockedAttributes: [...(template.lockedAttributes || []), ...userLockedAttributes],
    styleNotes: template.styleNotes || '',
    referencePrompt: generateReferencePrompt(input, template),
    consistencyRules: template.consistencyRules || [],
    createdAt: new Date().toISOString(),
    usageCount: 0
  }
}

function generateReferencePrompt(
  input: any,
  template: Partial<ConsistencyProfile>
): string {
  let prompt = input.description
  
  // Add template reference if available
  if (template.referencePrompt) {
    prompt += `, ${template.referencePrompt}`
  }
  
  // Add user attributes
  if (input.userAttributes?.length) {
    prompt += `, ${input.userAttributes.join(', ')}`
  }
  
  // Add type-specific defaults
  switch (input.type) {
    case 'character':
      prompt += ', consistent character appearance, same person throughout'
      break
    case 'environment':
      prompt += ', consistent environmental setting, same location'
      break
    case 'product':
      prompt += ', consistent product appearance, same item'
      break
    case 'style':
      prompt += ', consistent visual style, same aesthetic approach'
      break
    case 'brand':
      prompt += ', consistent brand identity, professional presentation'
      break
  }
  
  return prompt
}

/**
 * Analyzes consistency requirements for a video project
 */
export function analyzeConsistencyRequirements(
  scenes: any[],
  profiles: ConsistencyProfile[],
  selectedModel: any
): ConsistencyAnalysis {
  const analysis: ConsistencyAnalysis = {
    overallScore: 100,
    riskFactors: [],
    recommendations: [],
    modelSuitability: 100
  }
  
  // Analyze scene complexity
  const sceneCount = scenes.length
  if (sceneCount > 5) {
    analysis.riskFactors.push(`High scene count (${sceneCount}) may affect consistency`)
    analysis.overallScore -= 10
  }
  
  // Analyze model capabilities
  if (selectedModel.characterConsistency === 'poor') {
    analysis.riskFactors.push('Selected model has poor character consistency')
    analysis.modelSuitability -= 30
    analysis.overallScore -= 20
  }
  
  if (selectedModel.maxConsistentClips < sceneCount) {
    analysis.riskFactors.push(`Model optimal for ${selectedModel.maxConsistentClips} clips, but ${sceneCount} requested`)
    analysis.overallScore -= 15
  }
  
  // Analyze profile complexity
  const totalAttributes = profiles.reduce((sum, profile) => sum + profile.lockedAttributes.length, 0)
  if (totalAttributes > 10) {
    analysis.riskFactors.push('High number of locked attributes may be challenging to maintain')
    analysis.overallScore -= 10
  }
  
  // Generate recommendations
  if (analysis.overallScore < 80) {
    analysis.recommendations.push('Consider using a model with better consistency ratings')
  }
  
  if (sceneCount > selectedModel.maxConsistentClips) {
    analysis.recommendations.push(`Reduce to ${selectedModel.maxConsistentClips} clips for optimal consistency`)
  }
  
  if (profiles.some(p => p.lockedAttributes.some(a => a.importance === 'critical'))) {
    analysis.recommendations.push('Test critical attributes with a single clip first')
  }
  
  return analysis
}

/**
 * Applies consistency profiles to video scenes
 */
export function applyConsistencyToScenes(
  scenes: any[],
  profiles: ConsistencyProfile[]
): any[] {
  return scenes.map((scene, index) => {
    const isFirst = index === 0
    let enhancedScene = { ...scene }
    
    // Apply each profile
    for (const profile of profiles) {
      enhancedScene = applyProfileToScene(enhancedScene, profile, isFirst)
    }
    
    return enhancedScene
  })
}

function applyProfileToScene(
  scene: any,
  profile: ConsistencyProfile,
  isFirstScene: boolean
): any {
  const enhancedScene = { ...scene }
  
  // Build consistency anchors based on profile
  if (!enhancedScene.consistencyAnchors) {
    enhancedScene.consistencyAnchors = {}
  }
  
  // Apply locked attributes based on scene applicability
  const applicableAttributes = profile.lockedAttributes.filter(attr => {
    switch (attr.applicableScenes) {
      case 'all': return true
      case 'character-focused': return scene.primaryFocus === 'character'
      case 'environment-focused': return scene.primaryFocus === 'environment'
      case 'product-focused': return scene.primaryFocus === 'product'
      default: return true
    }
  })
  
  // Apply attributes to consistency anchors
  for (const attr of applicableAttributes) {
    const anchorKey = profile.type === 'character' ? 'character' :
                     profile.type === 'environment' ? 'environment' :
                     profile.type === 'product' ? 'product' : 'style'
    
    if (!enhancedScene.consistencyAnchors[anchorKey]) {
      enhancedScene.consistencyAnchors[anchorKey] = attr.value
    } else if (attr.importance === 'critical') {
      enhancedScene.consistencyAnchors[anchorKey] += `, ${attr.value}`
    }
  }
  
  // Add reference prompt for first scene
  if (isFirstScene && profile.referencePrompt) {
    enhancedScene.referencePrompt = profile.referencePrompt
  }
  
  // Apply consistency rules
  for (const rule of profile.consistencyRules) {
    if (evaluateRuleCondition(rule.condition, scene)) {
      // Add rule requirement to scene
      if (!enhancedScene.consistencyRequirements) {
        enhancedScene.consistencyRequirements = []
      }
      enhancedScene.consistencyRequirements.push({
        requirement: rule.requirement,
        weight: rule.weight,
        negativePrompt: rule.negativePrompt
      })
    }
  }
  
  return enhancedScene
}

function evaluateRuleCondition(condition: string, scene: any): boolean {
  const lowerCondition = condition.toLowerCase()
  
  if (lowerCondition.includes('all scenes')) return true
  if (lowerCondition.includes('character') && scene.primaryFocus === 'character') return true
  if (lowerCondition.includes('environment') && scene.primaryFocus === 'environment') return true
  if (lowerCondition.includes('product') && scene.primaryFocus === 'product') return true
  
  return false
}

/**
 * Generates negative prompts based on consistency requirements
 */
export function generateConsistencyNegativePrompts(
  profiles: ConsistencyProfile[]
): string[] {
  const negativePrompts: string[] = []
  
  for (const profile of profiles) {
    // Add rule-based negative prompts
    for (const rule of profile.consistencyRules) {
      if (rule.negativePrompt) {
        negativePrompts.push(rule.negativePrompt)
      }
    }
    
    // Add type-specific negative prompts
    switch (profile.type) {
      case 'character':
        negativePrompts.push('different person', 'changed appearance', 'inconsistent character')
        break
      case 'environment':
        negativePrompts.push('different location', 'changed lighting', 'inconsistent background')
        break
      case 'product':
        negativePrompts.push('different product', 'changed design', 'inconsistent branding')
        break
      case 'style':
        negativePrompts.push('different style', 'inconsistent aesthetic', 'changed visual approach')
        break
    }
  }
  
  return Array.from(new Set(negativePrompts)) // Remove duplicates
}

/**
 * Validates consistency across generated scenes
 */
export function validateSceneConsistency(
  scenes: any[],
  profiles: ConsistencyProfile[]
): {
  isValid: boolean
  violations: Array<{
    sceneIndex: number
    violation: string
    severity: 'low' | 'medium' | 'high'
    suggestion: string
  }>
  consistencyScore: number
} {
  const violations: any[] = []
  let totalScore = 100
  
  // Check for missing consistency anchors in later scenes
  for (let i = 1; i < scenes.length; i++) {
    const scene = scenes[i]
    const firstScene = scenes[0]
    
    // Validate character consistency
    if (firstScene.consistencyAnchors?.character && !scene.consistencyAnchors?.character) {
      violations.push({
        sceneIndex: i,
        violation: 'Missing character consistency anchor',
        severity: 'high' as const,
        suggestion: 'Add character description from first scene'
      })
      totalScore -= 20
    }
    
    // Validate environment consistency
    if (firstScene.consistencyAnchors?.environment && !scene.consistencyAnchors?.environment) {
      violations.push({
        sceneIndex: i,
        violation: 'Missing environment consistency anchor',
        severity: 'medium' as const,
        suggestion: 'Add environment description from first scene'
      })
      totalScore -= 10
    }
  }
  
  // Check profile coverage
  for (const profile of profiles) {
    const criticalAttributes = profile.lockedAttributes.filter(a => a.importance === 'critical')
    
    for (const attr of criticalAttributes) {
      const missingScenes = scenes.filter(scene => {
        const anchors = scene.consistencyAnchors || {}
        return !Object.values(anchors).some((anchor: any) => 
          typeof anchor === 'string' && anchor.toLowerCase().includes(attr.value.toLowerCase())
        )
      })
      
      if (missingScenes.length > 0) {
        violations.push({
          sceneIndex: scenes.indexOf(missingScenes[0]),
          violation: `Critical attribute "${attr.attribute}" missing`,
          severity: 'high' as const,
          suggestion: `Ensure "${attr.value}" appears in all applicable scenes`
        })
        totalScore -= 15
      }
    }
  }
  
  return {
    isValid: violations.filter(v => v.severity === 'high').length === 0,
    violations,
    consistencyScore: Math.max(0, totalScore)
  }
}