// Mock LLM Service for testing when API keys are invalid

export class MockLLMService {
  async analyzeProduct(
    userInput: string, 
    contentType: string, 
    platform: string
  ): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      product_type: "Physical Product",
      key_features: [
        "Eco-friendly materials",
        "Fitness-oriented design", 
        "Portable and lightweight",
        "BPA-free construction"
      ],
      emotional_appeals: [
        "Health consciousness",
        "Environmental responsibility",
        "Active lifestyle aspiration",
        "Premium quality feeling"
      ],
      target_audience: "Health-conscious fitness enthusiasts aged 25-40",
      competitive_advantages: [
        "Sustainable materials",
        "Ergonomic design",
        "Brand reliability",
        "Fitness community integration"
      ],
      visual_style_recommendations: [
        "Clean, minimalist aesthetic",
        "Natural lighting",
        "Active lifestyle settings",
        "Vibrant, energetic colors"
      ]
    }
  }

  async generateQuestions(analysis: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      questions: [
        {
          question_id: "target_age",
          question_text: "What's the primary age group for this product?",
          options: ["18-25 years", "25-35 years", "35-45 years", "45+ years"]
        },
        {
          question_id: "usage_setting", 
          question_text: "Where will this product primarily be used?",
          options: ["Home/indoor", "Outdoor activities", "Gym/fitness center", "Office/workplace"]
        },
        {
          question_id: "brand_tone",
          question_text: "What brand personality should the content convey?",
          options: ["Professional & trustworthy", "Fun & energetic", "Premium & exclusive", "Friendly & approachable"]
        }
      ]
    }
  }

  async enhancePrompt(
    originalInput: string,
    contentType: string,
    platform: string,
    analysis: string,
    userAnswers: Record<string, string>
  ): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const platformOptimization = this.getPlatformOptimization(platform)
    const answers = userAnswers || {}
    
    const enhancedPrompt = `Professional product photography of a sleek, modern eco-friendly water bottle designed for fitness enthusiasts. The bottle should be held by a fit, active person in their ${answers.target_age || '25-35'} age range, wearing athletic wear, positioned in a ${answers.usage_setting || 'dynamic outdoor'} setting. 

The scene should convey ${answers.brand_tone || 'energetic and trustworthy'} brand personality with natural lighting that emphasizes the bottle's sustainable materials and ergonomic design. Include vibrant, energetic colors that appeal to health-conscious consumers who value environmental responsibility.

Composition: ${platformOptimization.composition}
Lighting: Soft, natural lighting with subtle shadows to create depth
Colors: Fresh greens and blues representing nature and health, with energetic accent colors
Mood: Aspirational and motivating, showing an active lifestyle
Details: Highlight the BPA-free construction, eco-friendly materials, and fitness-oriented design features
Background: ${platformOptimization.background}

Style: High-quality commercial photography with clean, minimalist aesthetic that would appeal to premium fitness and wellness markets.`

    return {
      enhanced_prompt: enhancedPrompt
    }
  }

  private getPlatformOptimization(platform: string) {
    const optimizations = {
      instagram: {
        composition: "Square format (1:1) with centered subject, leaving space for text overlay",
        background: "Instagram-worthy background with good contrast for text readability"
      },
      facebook: {
        composition: "Landscape orientation (16:9) optimized for Facebook feed display",
        background: "Engaging background that works well in both desktop and mobile feeds"
      },
      linkedin: {
        composition: "Professional framing suitable for business audience",
        background: "Clean, professional environment that conveys business credibility"
      },
      tiktok: {
        composition: "Vertical format (9:16) with dynamic, eye-catching framing",
        background: "Trendy, visually interesting background that captures attention in TikTok feed"
      },
      youtube: {
        composition: "Thumbnail-optimized framing (16:9) with bold, clickable visual elements",
        background: "High-contrast background that stands out in YouTube search results"
      },
      multiple: {
        composition: "Versatile composition that works across multiple aspect ratios",
        background: "Adaptable background suitable for various platform requirements"
      }
    }
    
    return optimizations[platform] || optimizations.multiple
  }

  async healthCheck(): Promise<{
    openai: boolean
    gemini: boolean
    timestamp: string
  }> {
    return {
      openai: true, // Mock as working
      gemini: true, // Mock as working
      timestamp: new Date().toISOString()
    }
  }
}