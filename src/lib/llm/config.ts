// LLM Service Configuration

export const LLM_CONFIG = {
  openai: {
    model: 'gpt-4o-mini', // Better model with JSON support
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 30000, // 30 seconds
  },
  gemini: {
    model: 'gemini-1.5-pro', 
    maxTokens: 2000,
    temperature: 0.3, // Lower temperature for more consistent JSON output
    timeout: 30000,
  },
  fallback: {
    retries: 2,
    retryDelay: 1000, // 1 second
  },
}

export const PROMPT_TEMPLATES = {
  analysis: {
    system: `You are an expert marketing strategist analyzing products and services for content creation.`,
    template: `Analyze this product/service request for creating digital marketing content:

User Input: "{user_input}"
Content Type: {content_type}
Platform: {platform}

Please analyze and identify:
1. PRODUCT/SERVICE TYPE: What category does this fall into?
2. KEY FEATURES: What are the main functional benefits?
3. EMOTIONAL APPEALS: What emotions should the content evoke?
4. TARGET AUDIENCE: Who would be most interested in this?
5. COMPETITIVE ADVANTAGES: What makes this unique?
6. VISUAL STYLE: What aesthetic would work best?

Provide analysis in structured JSON format.`,
  },
  questions: {
    system: `You are an expert at generating objective questions to optimize marketing content.`,
    template: `Based on this analysis: {analysis}

Generate 3-5 objective questions to optimize marketing content creation. 
Focus on gaps in understanding that would significantly improve the final prompt.

Each question should:
- Have 3-4 specific answer choices
- Be answerable in 5 seconds
- Directly impact content quality
- Be skippable without breaking the flow

Return as JSON array with: question_id, question_text, options[]`,
  },
  enhancement: {
    system: `You are the world's best prompt engineer for AI image/video generation, specializing in marketing content.`,
    template: `Create the perfect prompt for generating {content_type} content:

ORIGINAL INPUT: "{original_input}"
PRODUCT ANALYSIS: {analysis}
USER PREFERENCES: {user_answers}
TARGET PLATFORM: {platform}

Requirements:
- Create content that converts viewers to customers
- Include specific visual details for product/service appeal  
- Add emotional triggers and psychological appeals
- Specify lighting, composition, colors for maximum impact
- Include platform-specific optimization
- Make it extremely creative and engaging

Generate a detailed, professional prompt that will create stunning marketing content.`,
  },
}