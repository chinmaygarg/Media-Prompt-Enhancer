// Enhanced Model Capability System
// Comprehensive database of AI model capabilities for smart selection and validation

export interface ModelCapabilities {
  id: string
  name: string
  provider: string
  type: 'image' | 'video' | 'video-audio'
  
  // Input requirements and capabilities
  input_requirements: {
    text: {
      required: boolean
      min_length?: number
      max_length?: number
      supports_structured?: boolean // For complex prompts with formatting
    }
    images: {
      min: number              // Minimum images required
      max: number              // Maximum images supported  
      required: boolean        // Is image input mandatory?
      formats: string[]        // Supported formats ['jpg', 'png', 'webp']
      max_resolution?: string  // e.g., '1024x1024'
      min_resolution?: string
    }
    audio?: {
      supported: boolean
      formats: string[]
      max_duration?: number
    }
  }
  
  // Output capabilities
  output_capabilities: {
    max_duration?: number        // For video models (seconds)
    audio_generation?: boolean   // Native audio support
    aspect_ratios: string[]      // Supported ratios ['1:1', '16:9', '9:16', '4:5']
    max_resolution: string       // Maximum output resolution
    quality_levels: string[]     // Available quality settings
    batch_support?: boolean      // Can generate multiple outputs
  }
  
  // Performance characteristics
  performance: {
    generation_time_estimate: number  // Average seconds to generate
    queue_priority: 'high' | 'medium' | 'low'
    reliability_score: number         // 0-1 success rate
    consistency_score: number         // 0-1 for multi-clip consistency
  }
  
  // Pricing
  pricing: {
    cost_per_image?: number
    cost_per_second?: number
    cost_per_generation?: number
    has_free_tier?: boolean
    currency: 'USD' | 'EUR' | 'GBP'
  }
  
  // Quality and use case classification
  classification: {
    quality_tier: 'draft' | 'social' | 'production' | 'professional'
    best_for: string[]           // ['portraits', 'landscapes', 'text', 'animations']
    style_strength: string[]     // ['photorealistic', 'artistic', 'illustrated']
    platform_optimized: string[] // ['instagram', 'tiktok', 'youtube']
  }
  
  // Special capabilities
  special_features: {
    text_rendering?: 'excellent' | 'good' | 'fair' | 'poor'
    character_consistency?: 'excellent' | 'good' | 'fair' | 'poor'
    multilingual_support?: boolean
    style_transfer?: boolean
    inpainting?: boolean
    upscaling?: boolean
  }
  
  // Limitations and restrictions
  limitations: {
    content_filters: string[]    // ['nsfw', 'violence', 'copyrighted']
    geographic_restrictions?: string[]
    rate_limits?: {
      requests_per_minute: number
      requests_per_day: number
    }
    known_issues?: string[]      // Common problems or limitations
  }
  
  // Status and availability
  status: {
    availability: 'stable' | 'beta' | 'preview' | 'deprecated'
    last_updated: string
    api_version: string
    maintenance_schedule?: string
  }
}

// Comprehensive Model Database
export const ENHANCED_MODEL_DATABASE: Record<string, ModelCapabilities> = {
  // TEXT-TO-IMAGE MODELS
  'qwen-image': {
    id: 'qwen-image',
    name: 'Qwen Image',
    provider: 'Alibaba Cloud',
    type: 'image',
    input_requirements: {
      text: {
        required: true,
        min_length: 5,
        max_length: 2000,
        supports_structured: true
      },
      images: {
        min: 0,
        max: 0,
        required: false,
        formats: []
      }
    },
    output_capabilities: {
      aspect_ratios: ['1:1', '16:9', '9:16', '4:5', '3:4', '4:3'],
      max_resolution: '1024x1024',
      quality_levels: ['standard', 'high'],
      batch_support: false
    },
    performance: {
      generation_time_estimate: 3,
      queue_priority: 'medium',
      reliability_score: 0.92,
      consistency_score: 0.85
    },
    pricing: {
      cost_per_image: 0.012,
      currency: 'USD'
    },
    classification: {
      quality_tier: 'social',
      best_for: ['text_rendering', 'multilingual', 'detailed_scenes'],
      style_strength: ['photorealistic', 'illustrated'],
      platform_optimized: ['general']
    },
    special_features: {
      text_rendering: 'excellent',
      character_consistency: 'good',
      multilingual_support: true,
      style_transfer: true
    },
    limitations: {
      content_filters: ['nsfw', 'violence'],
      known_issues: ['Occasional text distortion in complex scenes']
    },
    status: {
      availability: 'stable',
      last_updated: '2024-12-01',
      api_version: '2.0'
    }
  },

  'ideogram-v3': {
    id: 'ideogram-v3',
    name: 'Ideogram v3',
    provider: 'Ideogram',
    type: 'image',
    input_requirements: {
      text: {
        required: true,
        min_length: 3,
        max_length: 1500,
        supports_structured: false
      },
      images: {
        min: 0,
        max: 0,
        required: false,
        formats: []
      }
    },
    output_capabilities: {
      aspect_ratios: ['1:1', '16:9', '9:16', '4:5'],
      max_resolution: '1024x1024',
      quality_levels: ['standard', 'turbo'],
      batch_support: true
    },
    performance: {
      generation_time_estimate: 2,
      queue_priority: 'high',
      reliability_score: 0.95,
      consistency_score: 0.88
    },
    pricing: {
      cost_per_image: 0.008,
      currency: 'USD'
    },
    classification: {
      quality_tier: 'social',
      best_for: ['typography', 'logos', 'text_heavy'],
      style_strength: ['photorealistic', 'graphic_design'],
      platform_optimized: ['instagram', 'linkedin']
    },
    special_features: {
      text_rendering: 'excellent',
      character_consistency: 'good',
      multilingual_support: false,
      style_transfer: false
    },
    limitations: {
      content_filters: ['nsfw'],
      rate_limits: {
        requests_per_minute: 60,
        requests_per_day: 1000
      }
    },
    status: {
      availability: 'stable',
      last_updated: '2024-11-15',
      api_version: '3.0'
    }
  },

  'imagen-4': {
    id: 'imagen-4',
    name: 'Imagen 4',
    provider: 'Google',
    type: 'image',
    input_requirements: {
      text: {
        required: true,
        min_length: 5,
        max_length: 2000,
        supports_structured: true
      },
      images: {
        min: 0,
        max: 0,
        required: false,
        formats: []
      }
    },
    output_capabilities: {
      aspect_ratios: ['1:1', '16:9', '9:16', '4:5', '3:2', '2:3'],
      max_resolution: '1536x1536',
      quality_levels: ['standard', 'high', 'ultra'],
      batch_support: false
    },
    performance: {
      generation_time_estimate: 4,
      queue_priority: 'medium',
      reliability_score: 0.93,
      consistency_score: 0.90
    },
    pricing: {
      cost_per_image: 0.025,
      currency: 'USD'
    },
    classification: {
      quality_tier: 'production',
      best_for: ['photorealistic', 'commercial', 'high_detail'],
      style_strength: ['photorealistic'],
      platform_optimized: ['youtube', 'linkedin']
    },
    special_features: {
      text_rendering: 'good',
      character_consistency: 'excellent',
      multilingual_support: false,
      style_transfer: true,
      inpainting: true
    },
    limitations: {
      content_filters: ['nsfw', 'violence', 'copyrighted'],
      rate_limits: {
        requests_per_minute: 30,
        requests_per_day: 500
      }
    },
    status: {
      availability: 'stable',
      last_updated: '2024-11-30',
      api_version: '4.0'
    }
  },

  // IMAGE+TEXT-TO-IMAGE MODELS
  'minimax-image-01': {
    id: 'minimax-image-01',
    name: 'Minimax Image-01',
    provider: 'Minimax',
    type: 'image',
    input_requirements: {
      text: {
        required: true,
        min_length: 5,
        max_length: 1000,
        supports_structured: false
      },
      images: {
        min: 1,
        max: 1,
        required: true,
        formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_resolution: '2048x2048',
        min_resolution: '256x256'
      }
    },
    output_capabilities: {
      aspect_ratios: ['1:1', '16:9', '9:16'],
      max_resolution: '1024x1024',
      quality_levels: ['standard', 'high'],
      batch_support: false
    },
    performance: {
      generation_time_estimate: 5,
      queue_priority: 'medium',
      reliability_score: 0.89,
      consistency_score: 0.87
    },
    pricing: {
      cost_per_image: 0.015,
      currency: 'USD'
    },
    classification: {
      quality_tier: 'social',
      best_for: ['image_editing', 'style_transfer', 'variations'],
      style_strength: ['photorealistic', 'artistic'],
      platform_optimized: ['instagram', 'general']
    },
    special_features: {
      text_rendering: 'fair',
      character_consistency: 'excellent',
      multilingual_support: true,
      style_transfer: true,
      inpainting: false
    },
    limitations: {
      content_filters: ['nsfw'],
      known_issues: ['May struggle with complex multi-object scenes']
    },
    status: {
      availability: 'stable',
      last_updated: '2024-10-15',
      api_version: '1.0'
    }
  },

  'flux-kontext': {
    id: 'flux-kontext',
    name: 'FLUX.1 Kontext',
    provider: 'Black Forest Labs',
    type: 'image',
    input_requirements: {
      text: {
        required: true,
        min_length: 3,
        max_length: 1500,
        supports_structured: true
      },
      images: {
        min: 1,
        max: 1,
        required: true,
        formats: ['jpg', 'jpeg', 'png'],
        max_resolution: '1536x1536',
        min_resolution: '512x512'
      }
    },
    output_capabilities: {
      aspect_ratios: ['1:1', '16:9', '9:16', '4:5', '5:4'],
      max_resolution: '1024x1024',
      quality_levels: ['standard'],
      batch_support: false
    },
    performance: {
      generation_time_estimate: 6,
      queue_priority: 'medium',
      reliability_score: 0.91,
      consistency_score: 0.85
    },
    pricing: {
      cost_per_image: 0.018,
      currency: 'USD'
    },
    classification: {
      quality_tier: 'social',
      best_for: ['context_aware', 'image_conditioning', 'adaptations'],
      style_strength: ['photorealistic', 'illustrated'],
      platform_optimized: ['general']
    },
    special_features: {
      text_rendering: 'good',
      character_consistency: 'good',
      multilingual_support: false,
      style_transfer: true
    },
    limitations: {
      content_filters: ['nsfw', 'violence'],
      rate_limits: {
        requests_per_minute: 20,
        requests_per_day: 200
      }
    },
    status: {
      availability: 'stable',
      last_updated: '2024-09-20',
      api_version: '1.1'
    }
  },

  // TEXT-TO-VIDEO MODELS
  'veo-3': {
    id: 'veo-3',
    name: 'Veo 3',
    provider: 'Google DeepMind',
    type: 'video-audio',
    input_requirements: {
      text: {
        required: true,
        min_length: 10,
        max_length: 3000,
        supports_structured: true
      },
      images: {
        min: 0,
        max: 1,
        required: false,
        formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_resolution: '1920x1080'
      },
      audio: {
        supported: true,
        formats: ['mp3', 'wav'],
        max_duration: 30
      }
    },
    output_capabilities: {
      max_duration: 8,
      audio_generation: true,
      aspect_ratios: ['16:9', '9:16', '1:1', '4:5'],
      max_resolution: '1080p',
      quality_levels: ['standard', 'high'],
      batch_support: false
    },
    performance: {
      generation_time_estimate: 45,
      queue_priority: 'low',
      reliability_score: 0.87,
      consistency_score: 0.92
    },
    pricing: {
      cost_per_second: 0.12,
      currency: 'USD'
    },
    classification: {
      quality_tier: 'production',
      best_for: ['cinematic', 'audio_sync', 'professional'],
      style_strength: ['photorealistic'],
      platform_optimized: ['youtube', 'linkedin']
    },
    special_features: {
      text_rendering: 'good',
      character_consistency: 'excellent',
      multilingual_support: true,
      style_transfer: false
    },
    limitations: {
      content_filters: ['nsfw', 'violence', 'copyrighted'],
      rate_limits: {
        requests_per_minute: 5,
        requests_per_day: 50
      },
      known_issues: ['Long generation times during peak hours']
    },
    status: {
      availability: 'stable',
      last_updated: '2024-12-01',
      api_version: '3.0'
    }
  },

  // IMAGE+TEXT-TO-VIDEO MODELS
  'hailuo-02': {
    id: 'hailuo-02',
    name: 'Hailuo 02',
    provider: 'Minimax',
    type: 'video',
    input_requirements: {
      text: {
        required: true,
        min_length: 5,
        max_length: 1000,
        supports_structured: false
      },
      images: {
        min: 1,
        max: 1,
        required: true,
        formats: ['jpg', 'jpeg', 'png'],
        max_resolution: '1920x1080',
        min_resolution: '512x512'
      }
    },
    output_capabilities: {
      max_duration: 6,
      audio_generation: false,
      aspect_ratios: ['16:9', '9:16', '1:1'],
      max_resolution: '720p',
      quality_levels: ['standard'],
      batch_support: false
    },
    performance: {
      generation_time_estimate: 25,
      queue_priority: 'medium',
      reliability_score: 0.84,
      consistency_score: 0.78
    },
    pricing: {
      cost_per_second: 0.08,
      currency: 'USD'
    },
    classification: {
      quality_tier: 'social',
      best_for: ['image_animation', 'short_clips', 'social_media'],
      style_strength: ['photorealistic', 'animated'],
      platform_optimized: ['instagram', 'tiktok']
    },
    special_features: {
      text_rendering: 'fair',
      character_consistency: 'good',
      multilingual_support: true,
      style_transfer: false
    },
    limitations: {
      content_filters: ['nsfw'],
      known_issues: ['May have motion artifacts in complex scenes']
    },
    status: {
      availability: 'stable',
      last_updated: '2024-10-01',
      api_version: '2.0'
    }
  },

  'runway-gen4': {
    id: 'runway-gen4',
    name: 'Runway Gen-4',
    provider: 'RunwayML',
    type: 'video',
    input_requirements: {
      text: {
        required: false,
        min_length: 0,
        max_length: 2000,
        supports_structured: true
      },
      images: {
        min: 0,
        max: 1,
        required: false,
        formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_resolution: '1920x1080'
      }
    },
    output_capabilities: {
      max_duration: 10,
      audio_generation: false,
      aspect_ratios: ['16:9', '9:16', '1:1', '4:5'],
      max_resolution: '1080p',
      quality_levels: ['standard', 'high', 'ultra'],
      batch_support: false
    },
    performance: {
      generation_time_estimate: 60,
      queue_priority: 'low',
      reliability_score: 0.95,
      consistency_score: 0.93
    },
    pricing: {
      cost_per_second: 0.16,
      currency: 'USD'
    },
    classification: {
      quality_tier: 'production',
      best_for: ['cinematic', 'professional', 'high_quality'],
      style_strength: ['photorealistic'],
      platform_optimized: ['youtube', 'professional']
    },
    special_features: {
      text_rendering: 'good',
      character_consistency: 'excellent',
      multilingual_support: false,
      style_transfer: true,
      upscaling: true
    },
    limitations: {
      content_filters: ['nsfw', 'violence', 'copyrighted'],
      rate_limits: {
        requests_per_minute: 3,
        requests_per_day: 20
      }
    },
    status: {
      availability: 'stable',
      last_updated: '2024-11-20',
      api_version: '4.0'
    }
  }
}

// Helper functions for model capability queries
export function getModelsForOutputType(outputType: string): ModelCapabilities[] {
  const models = Object.values(ENHANCED_MODEL_DATABASE)
  
  switch (outputType) {
    case 'text-to-image':
      return models.filter(m => 
        m.type === 'image' && 
        !m.input_requirements.images.required
      )
    
    case 'image-text-to-image':
      return models.filter(m => 
        m.type === 'image' && 
        m.input_requirements.images.required
      )
    
    case 'text-to-video':
      return models.filter(m => 
        (m.type === 'video' || m.type === 'video-audio') && 
        !m.input_requirements.images.required
      )
    
    case 'image-text-to-video':
      return models.filter(m => 
        (m.type === 'video' || m.type === 'video-audio') && 
        m.input_requirements.images.max > 0
      )
    
    case 'text-to-video-audio':
      return models.filter(m => 
        m.type === 'video-audio' && 
        !m.input_requirements.images.required
      )
    
    case 'image-text-to-video-audio':
      return models.filter(m => 
        m.type === 'video-audio' && 
        m.input_requirements.images.max > 0
      )
    
    default:
      return []
  }
}

export function getModelById(modelId: string): ModelCapabilities | undefined {
  return ENHANCED_MODEL_DATABASE[modelId]
}

export function getModelsByProvider(provider: string): ModelCapabilities[] {
  return Object.values(ENHANCED_MODEL_DATABASE).filter(m => m.provider === provider)
}

export function getModelsByQualityTier(tier: string): ModelCapabilities[] {
  return Object.values(ENHANCED_MODEL_DATABASE).filter(m => m.classification.quality_tier === tier)
}

export function getModelsWithFeature(feature: keyof ModelCapabilities['special_features']): ModelCapabilities[] {
  return Object.values(ENHANCED_MODEL_DATABASE).filter(m => 
    m.special_features[feature] === 'excellent' || m.special_features[feature] === 'good'
  )
}