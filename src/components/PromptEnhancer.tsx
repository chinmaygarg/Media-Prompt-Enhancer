'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Loader2, Sparkles, ArrowRight, SkipForward } from 'lucide-react'
import { formatEnhancedPrompt, formatForClipboard } from '@/utils/promptFormatter'

interface Question {
  question_id: string
  question_text: string
  options: string[]
  required?: boolean
}

interface AnalysisResult {
  product_type: string
  key_features: string[]
  emotional_appeals: string[]
  target_audience: string
  competitive_advantages: string[]
  visual_style_recommendations: string[]
}

export default function PromptEnhancer() {
  const [step, setStep] = useState<'input' | 'questions' | 'results'>('input')
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState('social_media_post')
  const [platform, setPlatform] = useState('instagram')
  
  // Analysis and questions state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  
  // Results state
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [enhancedPromptData, setEnhancedPromptData] = useState<any>(null)

  const handleInitialSubmit = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    try {
      // Step 1: Analyze the prompt
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_prompt: prompt,
          content_type: contentType,
          platform: platform
        })
      })

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze prompt')
      }

      const analyzeData = await analyzeResponse.json()
      if (!analyzeData.success) {
        throw new Error(analyzeData.error)
      }

      setAnalysis(analyzeData.data.analysis)

      // Step 2: Generate questions
      const questionsResponse = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: JSON.stringify(analyzeData.data.analysis)
        })
      })

      if (!questionsResponse.ok) {
        throw new Error('Failed to generate questions')
      }

      const questionsData = await questionsResponse.json()
      if (!questionsData.success) {
        throw new Error(questionsData.error)
      }

      setQuestions(questionsData.data.questions || [])
      setStep('questions')

    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSkipQuestions = () => {
    generateEnhancedPrompt()
  }

  const generateEnhancedPrompt = async () => {
    setLoading(true)
    try {
      const enhanceResponse = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_prompt: prompt,
          content_type: contentType,
          platform: platform,
          analysis: JSON.stringify(analysis),
          user_answers: answers
        })
      })

      if (!enhanceResponse.ok) {
        throw new Error('Failed to enhance prompt')
      }

      const enhanceData = await enhanceResponse.json()
      if (!enhanceData.success) {
        throw new Error(enhanceData.error)
      }

      setOriginalPrompt(prompt)
      
      // Store the raw data and format it for display
      const rawData = enhanceData.data.enhanced_prompt
      setEnhancedPromptData(rawData)
      
      try {
        const formattedPrompt = formatEnhancedPrompt(rawData)
        setEnhancedPrompt(formattedPrompt)
      } catch (formatError) {
        console.error('Error formatting prompt:', formatError)
        // Fallback: try to convert to JSON string or use a default message
        setEnhancedPrompt(typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2))
      }
      
      setStep('results')

    } catch (error) {
      console.error('Error:', error)
      alert('Failed to enhance prompt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('input')
    setPrompt('')
    setAnalysis(null)
    setQuestions([])
    setAnswers({})
    setOriginalPrompt('')
    setEnhancedPrompt('')
    setEnhancedPromptData(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">AI Prompt Enhancer</h1>
        <p className="text-muted-foreground">Transform your ideas into marketing-perfect prompts</p>
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Describe Your Content
            </CardTitle>
            <CardDescription>
              Tell us about the content you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">What do you want to create content for?</label>
              <Textarea
                placeholder="e.g., New eco-friendly water bottle for fitness enthusiasts"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  <option value="social_media_post">Social Media Post</option>
                  <option value="product_ad">Product Advertisement</option>
                  <option value="service_promotion">Service Promotion</option>
                  <option value="brand_awareness">Brand Awareness</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Primary Platform</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="multiple">Multiple Platforms</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={handleInitialSubmit} 
              disabled={!prompt.trim() || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze & Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Questions */}
      {step === 'questions' && (
        <Card>
          <CardHeader>
            <CardTitle>Help Us Perfect Your Content</CardTitle>
            <CardDescription>
              Answer a few quick questions to optimize your prompt (you can skip any or all)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.question_id} className="space-y-3">
                <h4 className="font-medium">
                  {index + 1}. {question.question_text}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={question.question_id}
                        value={option}
                        checked={answers[question.question_id] === option}
                        onChange={(e) => handleQuestionAnswer(question.question_id, e.target.value)}
                        className="text-primary"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleSkipQuestions}
                className="flex-1"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip Questions
              </Button>
              <Button 
                onClick={generateEnhancedPrompt}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Enhanced Prompt'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 'results' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✨ Your Enhanced Prompt</CardTitle>
              <CardDescription>
                Copy this optimized prompt for your AI content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Original Prompt:</label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {originalPrompt}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-green-600">Enhanced Prompt:</label>
                <div className="p-4 border-2 border-green-200 bg-green-50 rounded-md">
                  <p className="whitespace-pre-wrap">{enhancedPrompt}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    try {
                      // Copy the formatted version for clipboard
                      const clipboardText = formatForClipboard(enhancedPromptData || enhancedPrompt)
                      navigator.clipboard.writeText(clipboardText)
                    } catch (error) {
                      console.error('Error copying to clipboard:', error)
                      // Fallback: copy the raw text
                      navigator.clipboard.writeText(enhancedPrompt || 'Enhanced prompt not available')
                    }
                  }}
                  className="flex-1"
                >
                  Copy Enhanced Prompt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="flex-1"
                >
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}