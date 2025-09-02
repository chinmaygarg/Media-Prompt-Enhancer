'use client'

import { useState, useEffect } from 'react'
import { X, Check, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { ContextQuestion, QuestionAnswers, QuestionGenerationRequest, QuestionGenerationResponse } from '@/types/context-questions'
import { MediaAsset } from '@/types/media'

interface ContextQuestionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (answers: QuestionAnswers) => void
  onSkip: () => void
  requestData: {
    base_prompt: string
    config: {
      outputType: string
      platform: string
      style: string
      duration?: number
      aspectRatio: string
      qualityTier: string
    }
    media_assets?: MediaAsset[]
    text_elements?: Array<{
      id: string
      text: string
      type: 'overlay' | 'in-video'
      context?: string
    }>
    selected_model?: string
    session_id?: string
  }
}

export default function ContextQuestionsModal({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  requestData
}: ContextQuestionsModalProps) {
  const [questions, setQuestions] = useState<ContextQuestion[]>([])
  const [answers, setAnswers] = useState<QuestionAnswers>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reasoning, setReasoning] = useState<string[]>([])
  const [estimatedImprovement, setEstimatedImprovement] = useState<string>('')

  // Generate questions when modal opens
  useEffect(() => {
    if (isOpen && questions.length === 0) {
      generateQuestions()
    }
  }, [isOpen])

  const generateQuestions = async () => {
    console.log('🔥 [ContextQuestionsModal] Starting question generation', { requestData })
    
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔥 [ContextQuestionsModal] Sending API request to /api/generate-questions')
      
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData as QuestionGenerationRequest),
      })

      console.log('🔥 [ContextQuestionsModal] API response received:', {
        status: response.status,
        ok: response.ok
      })

      const data: QuestionGenerationResponse = await response.json()

      console.log('🔥 [ContextQuestionsModal] API response parsed:', {
        success: data.success,
        questions_count: data.data?.questions.length || 0,
        has_error: !!data.error
      })

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate questions')
      }

      if (data.data) {
        setQuestions(data.data.questions)
        setReasoning(data.data.reasoning)
        setEstimatedImprovement(data.data.estimated_improvement)
        
        console.log('🔥 [ContextQuestionsModal] Questions loaded successfully:', {
          questions_count: data.data.questions.length,
          question_categories: data.data.questions.map(q => q.category)
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate questions'
      
      console.error('🔥 [ContextQuestionsModal] Question generation failed:', {
        error: errorMessage,
        error_details: err
      })
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = () => {
    onSubmit(answers)
  }

  const handleSkip = () => {
    onSkip()
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const canProceed = currentQuestion && answers[currentQuestion.id]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Context Questions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Help us understand your vision better
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Analyzing your prompt and generating personalized questions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 text-center mb-4">{error}</p>
              <button
                onClick={generateQuestions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No questions generated</p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Current Question */}
              {currentQuestion && (
                <div className="mb-8">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                      {currentQuestionIndex + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {currentQuestion.question}
                      </h3>
                      <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {currentQuestion.category} • {currentQuestion.importance}
                      </div>
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-2 ml-11">
                    {currentQuestion.options.map((option, optionIndex) => {
                      const isSelected = currentQuestion.type === 'single_select'
                        ? answers[currentQuestion.id] === option
                        : Array.isArray(answers[currentQuestion.id]) && 
                          (answers[currentQuestion.id] as string[]).includes(option)

                      return (
                        <label key={optionIndex} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <input
                            type={currentQuestion.type === 'single_select' ? 'radio' : 'checkbox'}
                            name={currentQuestion.id}
                            value={option}
                            checked={isSelected}
                            onChange={(e) => {
                              if (currentQuestion.type === 'single_select') {
                                handleAnswerChange(currentQuestion.id, option)
                              } else {
                                const currentAnswers = (answers[currentQuestion.id] as string[]) || []
                                if (e.target.checked) {
                                  handleAnswerChange(currentQuestion.id, [...currentAnswers, option])
                                } else {
                                  handleAnswerChange(currentQuestion.id, currentAnswers.filter(a => a !== option))
                                }
                              }
                            }}
                            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 flex-1">{option}</span>
                        </label>
                      )
                    })}
                  </div>

                  {/* Question Reasoning */}
                  {currentQuestion.reasoning && (
                    <div className="ml-11 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 {currentQuestion.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Skip Questions
                  </button>

                  {isLastQuestion ? (
                    <button
                      onClick={handleSubmit}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Complete
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                      disabled={!canProceed}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expected Improvement */}
              {estimatedImprovement && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    Expected Improvement
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {estimatedImprovement}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}