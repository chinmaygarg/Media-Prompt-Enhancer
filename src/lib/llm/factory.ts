import { LLMService } from './service'
import { MockLLMService } from './mockService'

let _serviceInstance: LLMService | MockLLMService | null = null

export async function getLLMService(): Promise<LLMService | MockLLMService> {
  // Return cached instance if available
  if (_serviceInstance) {
    return _serviceInstance
  }

  // Check if we have valid API keys
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 20
  const hasGeminiKey = !!process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 20
  
  if (!hasOpenAIKey && !hasGeminiKey) {
    console.log('⚠️  No valid API keys found. Using mock LLM service for testing.')
    _serviceInstance = new MockLLMService()
    return _serviceInstance
  }

  try {
    // Try to create real service and test it
    const realService = new LLMService()
    const healthCheck = await realService.healthCheck()
    
    if (!healthCheck.openai && !healthCheck.gemini) {
      console.log('⚠️  All LLM services failed health check. Using mock service.')
      _serviceInstance = new MockLLMService()
    } else {
      console.log('✅ LLM service initialized successfully')
      _serviceInstance = realService
    }
  } catch (error) {
    console.log('⚠️  LLM service initialization failed. Using mock service.', error.message)
    _serviceInstance = new MockLLMService()
  }

  return _serviceInstance
}

// Reset the service instance (useful for testing)
export function resetLLMService() {
  _serviceInstance = null
}