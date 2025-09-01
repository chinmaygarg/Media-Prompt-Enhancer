import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { LLM_CONFIG, PROMPT_TEMPLATES } from './config'

export class LLMService {
  private openai: OpenAI
  private gemini: GoogleGenerativeAI
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
    
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
  }

  async analyzeProduct(
    userInput: string, 
    contentType: string, 
    platform: string
  ): Promise<any> {
    const prompt = PROMPT_TEMPLATES.analysis.template
      .replace('{user_input}', userInput)
      .replace('{content_type}', contentType)
      .replace('{platform}', platform)

    return this.callLLMWithFallback('analysis', prompt)
  }

  async generateQuestions(analysis: string): Promise<any> {
    const prompt = PROMPT_TEMPLATES.questions.template
      .replace('{analysis}', analysis)

    return this.callLLMWithFallback('questions', prompt)
  }

  async enhancePrompt(
    originalInput: string,
    contentType: string,
    platform: string,
    analysis: string,
    userAnswers: Record<string, string>
  ): Promise<any> {
    const prompt = PROMPT_TEMPLATES.enhancement.template
      .replace('{original_input}', originalInput)
      .replace('{content_type}', contentType)
      .replace('{platform}', platform)
      .replace('{analysis}', analysis)
      .replace('{user_answers}', JSON.stringify(userAnswers))

    return this.callLLMWithFallback('enhancement', prompt)
  }

  private async callLLMWithFallback(
    operation: string, 
    prompt: string, 
    attempt: number = 1
  ): Promise<any> {
    const maxAttempts = LLM_CONFIG.fallback.retries + 1

    try {
      // Try OpenAI first
      if (attempt === 1) {
        console.log(`[LLM Service] Attempting OpenAI for ${operation}`)
        return await this.callOpenAI(prompt)
      }
      // Fallback to Gemini
      else if (attempt === 2) {
        console.log(`[LLM Service] Fallback to Gemini for ${operation}`)
        return await this.callGemini(prompt)
      }
      // Final attempt with OpenAI again
      else {
        console.log(`[LLM Service] Final attempt with OpenAI for ${operation}`)
        return await this.callOpenAI(prompt)
      }
    } catch (error) {
      console.error(`[LLM Service] Attempt ${attempt} failed:`, error)
      
      if (attempt < maxAttempts) {
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, LLM_CONFIG.fallback.retryDelay * attempt)
        )
        return this.callLLMWithFallback(operation, prompt, attempt + 1)
      }
      
      throw new Error(`All LLM services failed for ${operation}: ${error.message}`)
    }
  }

  private async callOpenAI(prompt: string): Promise<any> {
    const completion = await this.openai.chat.completions.create({
      model: LLM_CONFIG.openai.model,
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful assistant that responds only in valid JSON format.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: LLM_CONFIG.openai.maxTokens,
      temperature: LLM_CONFIG.openai.temperature,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', responseText)
      throw new Error('Invalid JSON response from OpenAI')
    }
  }

  private async callGemini(prompt: string): Promise<any> {
    const model = this.gemini.getGenerativeModel({ 
      model: LLM_CONFIG.gemini.model,
      generationConfig: {
        temperature: LLM_CONFIG.gemini.temperature,
        maxOutputTokens: LLM_CONFIG.gemini.maxTokens,
      }
    })

    // Enhanced prompt with explicit JSON structure requirements
    const enhancedPrompt = `${prompt}

CRITICAL INSTRUCTIONS:
- Respond ONLY with valid JSON format
- NO additional text, explanations, or markdown formatting
- Ensure all JSON keys are properly quoted
- Ensure the response is a complete, valid JSON object`
    
    const result = await model.generateContent(enhancedPrompt)
    const responseText = result.response.text()

    if (!responseText) {
      throw new Error('No response from Gemini')
    }

    try {
      // More robust cleaning - handle various formats
      let cleanedText = responseText.trim()
      
      // Remove markdown code blocks if present (more comprehensive)
      cleanedText = cleanedText.replace(/^```json\s*\n?/gm, '')
      cleanedText = cleanedText.replace(/^```\s*\n?/gm, '')
      cleanedText = cleanedText.replace(/```\s*$/gm, '')
      cleanedText = cleanedText.replace(/\n```$/gm, '')
      
      // Handle both object {} and array [] formats
      const jsonObjectMatch = cleanedText.match(/\{[\s\S]*\}/)
      const jsonArrayMatch = cleanedText.match(/\[[\s\S]*\]/)
      
      if (jsonArrayMatch) {
        cleanedText = jsonArrayMatch[0]
      } else if (jsonObjectMatch) {
        cleanedText = jsonObjectMatch[0]
      }
      
      // Final cleanup - remove any trailing non-JSON text
      cleanedText = cleanedText.trim()
      
      const parsed = JSON.parse(cleanedText)
      console.log('[Gemini] Successfully parsed JSON response')
      return parsed
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText)
      console.error('Parse error:', parseError.message)
      
      // Last resort: try to extract JSON-like structure
      try {
        const jsonStart = responseText.indexOf('{')
        const jsonEnd = responseText.lastIndexOf('}')
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const extracted = responseText.substring(jsonStart, jsonEnd + 1)
          return JSON.parse(extracted)
        }
      } catch (fallbackError) {
        // If all else fails, provide error with original response
        console.error('Fallback JSON extraction also failed')
      }
      
      throw new Error(`Invalid JSON response from Gemini: ${responseText.substring(0, 200)}...`)
    }
  }

  // Health check method
  async healthCheck(): Promise<{
    openai: boolean
    gemini: boolean
    timestamp: string
  }> {
    const result = {
      openai: false,
      gemini: false,
      timestamp: new Date().toISOString()
    }

    // Test OpenAI
    try {
      await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 5
      })
      result.openai = true
    } catch (error) {
      console.error('OpenAI health check failed:', error)
    }

    // Test Gemini
    try {
      const model = this.gemini.getGenerativeModel({ 
        model: LLM_CONFIG.gemini.model,
        generationConfig: {
          maxOutputTokens: 10,
        }
      })
      await model.generateContent('Test connection - respond with {"status": "ok"}')
      result.gemini = true
    } catch (error) {
      console.error('Gemini health check failed:', error)
    }

    return result
  }
}