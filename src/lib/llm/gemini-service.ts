import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai'

interface GeminiConfig {
  apiKey: string
  model?: string
  maxRetries?: number
  retryDelay?: number
  rateLimitDelay?: number
  maxTokens?: number
  temperature?: number
}

interface GeminiResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

interface RateLimitState {
  requests: number
  resetTime: number
  isLimited: boolean
}

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: GenerativeModel
  private config: Required<GeminiConfig>
  private rateLimitState: RateLimitState = {
    requests: 0,
    resetTime: Date.now() + 60000, // Reset every minute
    isLimited: false
  }
  private chatSession: ChatSession | null = null

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required')
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-1.5-pro',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      rateLimitDelay: config.rateLimitDelay || 1000,
      maxTokens: config.maxTokens || 8192,
      temperature: config.temperature || 0.7
    }

    this.genAI = new GoogleGenerativeAI(this.config.apiKey)
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }
    })
  }

  /**
   * Generate text using Gemini API with retry logic and rate limiting
   */
  async generateText(prompt: string, options?: {
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  }): Promise<GeminiResponse> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()
    
    // Enhanced Input Logging
    console.log(`🔤 [GeminiService] ${requestId} - API Request Started:`, {
      prompt_length: prompt?.length || 0,
      system_prompt_length: options?.systemPrompt?.length || 0,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      timestamp: new Date().toISOString()
    })
    
    await this.checkRateLimit()

    const fullPrompt = options?.systemPrompt 
      ? `${options.systemPrompt}\n\nUser Request: ${prompt}`
      : prompt

    console.log(`📝 [GeminiService] ${requestId} - Full Prompt Analysis:`, {
      full_prompt_length: fullPrompt.length,
      has_system_prompt: !!options?.systemPrompt,
      prompt_preview: fullPrompt.substring(0, 150) + (fullPrompt.length > 150 ? '...' : '')
    })

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 [GeminiService] ${requestId} - Attempt ${attempt}/${this.config.maxRetries}`)
        
        const result = await this.model.generateContent(fullPrompt)
        const response = await result.response
        const text = response.text()

        this.updateRateLimit()

        const responseData = {
          text: text.trim(),
          usage: this.extractUsageInfo(response)
        }

        // Enhanced Output Logging
        console.log(`✅ [GeminiService] ${requestId} - API Response Success:`, {
          response_length: responseData.text.length,
          processing_time_ms: Date.now() - startTime,
          attempt_number: attempt,
          usage: responseData.usage,
          response_preview: responseData.text.substring(0, 150) + (responseData.text.length > 150 ? '...' : ''),
          timestamp: new Date().toISOString()
        })

        return responseData

      } catch (error) {
        lastError = error as Error
        console.error(`❌ [GeminiService] ${requestId} - Attempt ${attempt} Failed:`, {
          error_message: lastError.message,
          error_type: error instanceof Error ? error.constructor.name : 'Unknown',
          processing_time_ms: Date.now() - startTime,
          attempt_number: attempt,
          will_retry: this.isRetryableError(error) && attempt < this.config.maxRetries
        })

        if (this.isRetryableError(error)) {
          if (attempt < this.config.maxRetries) {
            const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
            console.log(`[GeminiService] Retrying in ${delay}ms...`)
            await this.sleep(delay)
            continue
          }
        } else {
          // Non-retryable error, fail immediately
          throw this.handleError(error)
        }
      }
    }

    throw this.handleError(lastError || new Error('Max retries exceeded'))
  }

  /**
   * Generate text with conversation context
   */
  async generateWithContext(
    prompt: string, 
    context: Array<{role: 'user' | 'assistant', content: string}>,
    options?: {
      systemPrompt?: string
      temperature?: number
    }
  ): Promise<GeminiResponse> {
    await this.checkRateLimit()

    try {
      // Start a new chat session if needed
      if (!this.chatSession) {
        this.chatSession = this.model.startChat({
          history: context.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }))
        })
      }

      const result = await this.chatSession.sendMessage(prompt)
      const response = await result.response
      const text = response.text()

      this.updateRateLimit()

      return {
        text: text.trim(),
        usage: this.extractUsageInfo(response)
      }

    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Batch generate multiple prompts with rate limiting
   */
  async batchGenerate(
    prompts: string[], 
    options?: {
      systemPrompt?: string
      batchSize?: number
      delayBetweenBatches?: number
    }
  ): Promise<GeminiResponse[]> {
    const batchSize = options?.batchSize || 5
    const delay = options?.delayBetweenBatches || 2000
    const results: GeminiResponse[] = []

    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize)
      console.log(`[GeminiService] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(prompts.length/batchSize)}`)

      const batchPromises = batch.map(prompt => 
        this.generateText(prompt, options)
      )

      try {
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // Add delay between batches to respect rate limits
        if (i + batchSize < prompts.length) {
          console.log(`[GeminiService] Waiting ${delay}ms before next batch...`)
          await this.sleep(delay)
        }
      } catch (error) {
        console.error(`[GeminiService] Batch processing failed:`, error)
        throw this.handleError(error)
      }
    }

    return results
  }

  /**
   * Validate API connection and configuration
   */
  async validateConnection(): Promise<boolean> {
    try {
      const testResponse = await this.generateText(
        'Respond with "OK" to confirm API connection.',
        { maxTokens: 10 }
      )
      
      return testResponse.text.toLowerCase().includes('ok')
    } catch (error) {
      console.error('[GeminiService] Connection validation failed:', error)
      return false
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitState {
    return { ...this.rateLimitState }
  }

  /**
   * Reset chat session
   */
  resetChatSession(): void {
    this.chatSession = null
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      rateLimitStatus: this.getRateLimitStatus()
    }
  }

  // Private methods

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()

    // Reset rate limit counter if time window expired
    if (now > this.rateLimitState.resetTime) {
      this.rateLimitState.requests = 0
      this.rateLimitState.resetTime = now + 60000 // Reset every minute
      this.rateLimitState.isLimited = false
    }

    // Check if we're hitting rate limits (conservative: 30 requests per minute)
    if (this.rateLimitState.requests >= 30) {
      this.rateLimitState.isLimited = true
      const waitTime = this.rateLimitState.resetTime - now
      console.log(`[GeminiService] Rate limit reached. Waiting ${waitTime}ms...`)
      await this.sleep(waitTime)
      
      // Reset after waiting
      this.rateLimitState.requests = 0
      this.rateLimitState.resetTime = Date.now() + 60000
      this.rateLimitState.isLimited = false
    }
  }

  private updateRateLimit(): void {
    this.rateLimitState.requests++
  }

  private isRetryableError(error: any): boolean {
    // Check for retryable errors
    const retryableStatuses = [500, 502, 503, 504, 429] // Server errors and rate limits
    const errorMessage = error?.message?.toLowerCase() || ''
    
    return (
      retryableStatuses.includes(error?.status) ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota exceeded')
    )
  }

  private handleError(error: any): Error {
    const errorMessage = error?.message || 'Unknown error occurred'
    const errorType = this.classifyError(error)

    // Create enhanced error with context
    const enhancedError = new Error(`[GeminiService] ${errorType}: ${errorMessage}`)
    
    // Add original error details
    if (error?.status) {
      (enhancedError as any).status = error.status
    }
    if (error?.code) {
      (enhancedError as any).code = error.code
    }

    return enhancedError
  }

  private classifyError(error: any): string {
    if (error?.status === 401) return 'Authentication Error'
    if (error?.status === 403) return 'Permission Error'
    if (error?.status === 429) return 'Rate Limit Error'
    if (error?.status >= 500) return 'Server Error'
    if (error?.message?.includes('timeout')) return 'Timeout Error'
    if (error?.message?.includes('network')) return 'Network Error'
    return 'API Error'
  }

  private extractUsageInfo(response: any): GeminiResponse['usage'] {
    // Gemini API usage information extraction
    try {
      const usageMetadata = response.usageMetadata
      if (usageMetadata) {
        return {
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0
        }
      }
    } catch (error) {
      console.warn('[GeminiService] Could not extract usage info:', error)
    }
    return undefined
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Factory function for easy instantiation
export const createGeminiService = (apiKey?: string): GeminiService => {
  const key = apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY

  if (!key) {
    throw new Error('Gemini API key not found. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.')
  }

  return new GeminiService({
    apiKey: key,
    model: 'gemini-1.5-pro',
    maxRetries: 3,
    retryDelay: 1000,
    temperature: 0.7,
    maxTokens: 8192
  })
}

// Singleton instance
let geminiServiceInstance: GeminiService | null = null

export const getGeminiService = (): GeminiService => {
  if (!geminiServiceInstance) {
    geminiServiceInstance = createGeminiService()
  }
  return geminiServiceInstance
}