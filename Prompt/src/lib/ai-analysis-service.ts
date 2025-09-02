// AI Analysis Service with Cost Controls
// Manages AI-powered analysis requests with budget management and user consent

export interface AnalysisRequest {
  id: string
  mediaAssetId: string
  userId?: string
  sessionId: string
  analysisLevel: AnalysisLevel
  priority: 'low' | 'medium' | 'high'
  estimatedCost: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  completedAt?: string
  errorMessage?: string
  result?: any
}

export interface BudgetSettings {
  dailyLimit: number
  monthlyLimit: number
  perAnalysisLimit: number
  autoApproveUnder: number // Auto-approve requests under this amount
  requireConfirmationOver: number // Require explicit confirmation over this amount
  emergencyStop: boolean // Halt all analysis if budget exceeded
}

export interface CostTracker {
  dailySpent: number
  monthlySpent: number
  totalSpent: number
  lastReset: {
    daily: string
    monthly: string
  }
  currentMonth: string
  currentDay: string
}

export interface AnalysisQueue {
  pending: AnalysisRequest[]
  processing: AnalysisRequest[]
  completed: AnalysisRequest[]
  failed: AnalysisRequest[]
}

export type AnalysisLevel = 'basic' | 'detailed' | 'premium'

// Default budget settings
export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  dailyLimit: 5.00,
  monthlyLimit: 50.00,
  perAnalysisLimit: 1.00,
  autoApproveUnder: 0.01,
  requireConfirmationOver: 0.25,
  emergencyStop: false
}

// Analysis costs by level
export const ANALYSIS_COSTS: Record<AnalysisLevel, number> = {
  basic: 0.002,
  detailed: 0.008,
  premium: 0.015
}

// Service features and their costs
export const FEATURE_COSTS = {
  visualAnalysis: 0.002,
  contentDetection: 0.003,
  styleAnalysis: 0.002,
  qualityAssessment: 0.001,
  recommendations: 0.002,
  multilingualSupport: 0.001,
  advancedInsights: 0.004
} as const

/**
 * AI Analysis Service Class
 */
export class AIAnalysisService {
  private queue: AnalysisQueue = {
    pending: [],
    processing: [],
    completed: [],
    failed: []
  }
  private costTracker: CostTracker
  private budgetSettings: BudgetSettings

  constructor(
    budgetSettings: BudgetSettings = DEFAULT_BUDGET_SETTINGS,
    existingCostTracker?: CostTracker
  ) {
    this.budgetSettings = budgetSettings
    this.costTracker = existingCostTracker || this.initializeCostTracker()
  }

  private initializeCostTracker(): CostTracker {
    const now = new Date()
    const currentMonth = now.toISOString().substring(0, 7) // YYYY-MM
    const currentDay = now.toISOString().substring(0, 10) // YYYY-MM-DD

    return {
      dailySpent: 0,
      monthlySpent: 0,
      totalSpent: 0,
      lastReset: {
        daily: currentDay,
        monthly: currentMonth
      },
      currentMonth,
      currentDay
    }
  }

  /**
   * Check if analysis can be performed within budget
   */
  canAffordAnalysis(cost: number): {
    canAfford: boolean
    reason?: string
    suggestions?: string[]
  } {
    this.updateCostTracker()

    const suggestions: string[] = []

    if (this.budgetSettings.emergencyStop) {
      return {
        canAfford: false,
        reason: 'Emergency stop activated - all analysis suspended',
        suggestions: ['Contact administrator to reactivate analysis']
      }
    }

    if (cost > this.budgetSettings.perAnalysisLimit) {
      return {
        canAfford: false,
        reason: `Analysis cost ($${cost.toFixed(3)}) exceeds per-analysis limit ($${this.budgetSettings.perAnalysisLimit.toFixed(3)})`,
        suggestions: [
          'Choose a lower analysis level',
          'Increase per-analysis limit in settings',
          'Consider basic analysis instead'
        ]
      }
    }

    if (this.costTracker.dailySpent + cost > this.budgetSettings.dailyLimit) {
      const remaining = this.budgetSettings.dailyLimit - this.costTracker.dailySpent
      return {
        canAfford: false,
        reason: `Would exceed daily budget limit ($${this.budgetSettings.dailyLimit.toFixed(3)}). Remaining: $${remaining.toFixed(3)}`,
        suggestions: [
          'Wait until tomorrow for budget reset',
          'Increase daily limit in settings',
          'Use a lower cost analysis level'
        ]
      }
    }

    if (this.costTracker.monthlySpent + cost > this.budgetSettings.monthlyLimit) {
      const remaining = this.budgetSettings.monthlyLimit - this.costTracker.monthlySpent
      return {
        canAfford: false,
        reason: `Would exceed monthly budget limit ($${this.budgetSettings.monthlyLimit.toFixed(3)}). Remaining: $${remaining.toFixed(3)}`,
        suggestions: [
          'Wait until next month for budget reset',
          'Increase monthly limit in settings',
          'Prioritize most important analyses'
        ]
      }
    }

    if (cost >= this.budgetSettings.requireConfirmationOver) {
      suggestions.push('This analysis requires explicit confirmation due to cost')
    }

    return {
      canAfford: true,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    }
  }

  /**
   * Create an analysis request
   */
  requestAnalysis(
    mediaAssetId: string,
    analysisLevel: AnalysisLevel,
    options: {
      sessionId: string
      userId?: string
      priority?: 'low' | 'medium' | 'high'
      skipBudgetCheck?: boolean
      userConfirmed?: boolean
    }
  ): {
    success: boolean
    requestId?: string
    cost?: number
    error?: string
    requiresConfirmation?: boolean
  } {
    const cost = ANALYSIS_COSTS[analysisLevel]
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Budget check
    if (!options.skipBudgetCheck) {
      const budgetCheck = this.canAffordAnalysis(cost)
      if (!budgetCheck.canAfford) {
        return {
          success: false,
          error: budgetCheck.reason,
          cost
        }
      }

      // Check if confirmation is required
      if (cost >= this.budgetSettings.requireConfirmationOver && !options.userConfirmed) {
        return {
          success: false,
          requiresConfirmation: true,
          cost,
          error: `Analysis cost ($${cost.toFixed(3)}) requires user confirmation`
        }
      }
    }

    // Create request
    const request: AnalysisRequest = {
      id: requestId,
      mediaAssetId,
      userId: options.userId,
      sessionId: options.sessionId,
      analysisLevel,
      priority: options.priority || 'medium',
      estimatedCost: cost,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    this.queue.pending.push(request)
    
    // Start processing if queue is not busy
    this.processNextRequest()

    return {
      success: true,
      requestId,
      cost
    }
  }

  /**
   * Process next request in queue
   */
  private async processNextRequest(): Promise<void> {
    if (this.queue.processing.length >= 3) return // Max 3 concurrent
    if (this.queue.pending.length === 0) return

    // Sort by priority and creation time
    this.queue.pending.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    const request = this.queue.pending.shift()!
    request.status = 'processing'
    this.queue.processing.push(request)

    try {
      // Simulate analysis (in production, this would call actual AI services)
      const result = await this.performAnalysis(request)
      
      // Update cost tracking
      this.costTracker.dailySpent += request.estimatedCost
      this.costTracker.monthlySpent += request.estimatedCost
      this.costTracker.totalSpent += request.estimatedCost

      // Move to completed
      request.status = 'completed'
      request.completedAt = new Date().toISOString()
      request.result = result
      
      this.queue.processing = this.queue.processing.filter(r => r.id !== request.id)
      this.queue.completed.push(request)

    } catch (error) {
      request.status = 'failed'
      request.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.queue.processing = this.queue.processing.filter(r => r.id !== request.id)
      this.queue.failed.push(request)
    }

    // Process next request
    setTimeout(() => this.processNextRequest(), 100)
  }

  /**
   * Simulate AI analysis (replace with actual AI service calls)
   */
  private async performAnalysis(request: AnalysisRequest): Promise<any> {
    // Simulate processing time based on analysis level
    const processingTime = {
      basic: 1000,
      detailed: 3000,
      premium: 5000
    }[request.analysisLevel]

    await new Promise(resolve => setTimeout(resolve, processingTime))

    // Return mock analysis result
    return {
      visual: {
        colors: ['#FF6B35', '#F7931E', '#FFD23F'],
        composition: 'balanced',
        lighting: 'natural',
        style: request.analysisLevel === 'premium' ? 'professional photography' : 'photographic',
        mood: 'neutral'
      },
      content: {
        subjects: request.analysisLevel !== 'basic' ? ['person', 'object'] : ['general content'],
        setting: 'indoor',
        actions: request.analysisLevel === 'premium' ? ['standing', 'presenting'] : [],
        objects: request.analysisLevel === 'premium' ? ['table', 'document'] : []
      },
      technical: {
        quality: 'high',
        resolution: '1920x1080',
        aspectRatio: '16:9',
        estimatedQuality: 85
      },
      recommendations: {
        bestUseCase: request.analysisLevel === 'premium' 
          ? ['character reference', 'professional photography', 'presentation context']
          : ['general reference'],
        promptSuggestions: [
          'high quality',
          request.analysisLevel !== 'basic' ? 'professional' : 'detailed',
          ...(request.analysisLevel === 'premium' ? ['commercial grade', 'studio lighting'] : [])
        ],
        compatibleModels: ['qwen-image', 'ideogram-v3', 'imagen-4']
      },
      confidence: request.analysisLevel === 'basic' ? 75 : request.analysisLevel === 'detailed' ? 85 : 95,
      analysisLevel: request.analysisLevel,
      processingTime: processingTime
    }
  }

  /**
   * Get analysis result
   */
  getAnalysisResult(requestId: string): AnalysisRequest | null {
    const allRequests = [
      ...this.queue.completed,
      ...this.queue.failed,
      ...this.queue.processing,
      ...this.queue.pending
    ]
    
    return allRequests.find(r => r.id === requestId) || null
  }

  /**
   * Cancel analysis request
   */
  cancelAnalysis(requestId: string): boolean {
    const pendingIndex = this.queue.pending.findIndex(r => r.id === requestId)
    if (pendingIndex !== -1) {
      const request = this.queue.pending[pendingIndex]
      request.status = 'cancelled'
      this.queue.pending.splice(pendingIndex, 1)
      return true
    }
    return false
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number
    processing: number
    completed: number
    failed: number
    estimatedWaitTime: number
  } {
    const avgProcessingTime = 3000 // 3 seconds average
    const estimatedWaitTime = (this.queue.pending.length + this.queue.processing.length) * avgProcessingTime

    return {
      pending: this.queue.pending.length,
      processing: this.queue.processing.length,
      completed: this.queue.completed.length,
      failed: this.queue.failed.length,
      estimatedWaitTime
    }
  }

  /**
   * Get cost tracking info
   */
  getCostInfo(): {
    tracker: CostTracker
    budget: BudgetSettings
    remaining: {
      daily: number
      monthly: number
    }
    utilization: {
      daily: number
      monthly: number
    }
  } {
    this.updateCostTracker()
    
    return {
      tracker: this.costTracker,
      budget: this.budgetSettings,
      remaining: {
        daily: Math.max(0, this.budgetSettings.dailyLimit - this.costTracker.dailySpent),
        monthly: Math.max(0, this.budgetSettings.monthlyLimit - this.costTracker.monthlySpent)
      },
      utilization: {
        daily: (this.costTracker.dailySpent / this.budgetSettings.dailyLimit) * 100,
        monthly: (this.costTracker.monthlySpent / this.budgetSettings.monthlyLimit) * 100
      }
    }
  }

  /**
   * Update budget settings
   */
  updateBudgetSettings(newSettings: Partial<BudgetSettings>): void {
    this.budgetSettings = { ...this.budgetSettings, ...newSettings }
  }

  /**
   * Reset cost tracker for testing or manual reset
   */
  resetCostTracker(type: 'daily' | 'monthly' | 'all' = 'all'): void {
    const now = new Date()
    const currentDay = now.toISOString().substring(0, 10)
    const currentMonth = now.toISOString().substring(0, 7)

    switch (type) {
      case 'daily':
        this.costTracker.dailySpent = 0
        this.costTracker.lastReset.daily = currentDay
        this.costTracker.currentDay = currentDay
        break
      case 'monthly':
        this.costTracker.monthlySpent = 0
        this.costTracker.lastReset.monthly = currentMonth
        this.costTracker.currentMonth = currentMonth
        break
      case 'all':
        this.costTracker = this.initializeCostTracker()
        break
    }
  }

  /**
   * Update cost tracker based on current date
   */
  private updateCostTracker(): void {
    const now = new Date()
    const currentDay = now.toISOString().substring(0, 10)
    const currentMonth = now.toISOString().substring(0, 7)

    // Reset daily if new day
    if (currentDay !== this.costTracker.currentDay) {
      this.costTracker.dailySpent = 0
      this.costTracker.lastReset.daily = currentDay
      this.costTracker.currentDay = currentDay
    }

    // Reset monthly if new month
    if (currentMonth !== this.costTracker.currentMonth) {
      this.costTracker.monthlySpent = 0
      this.costTracker.lastReset.monthly = currentMonth
      this.costTracker.currentMonth = currentMonth
    }
  }

  /**
   * Get analysis statistics
   */
  getAnalyticsData(): {
    totalRequests: number
    successRate: number
    averageCost: number
    costByLevel: Record<AnalysisLevel, number>
    requestsByLevel: Record<AnalysisLevel, number>
    averageProcessingTime: number
  } {
    const allRequests = [
      ...this.queue.completed,
      ...this.queue.failed
    ]

    const totalRequests = allRequests.length
    const successfulRequests = this.queue.completed.length
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0

    const totalCost = allRequests.reduce((sum, req) => sum + req.estimatedCost, 0)
    const averageCost = totalRequests > 0 ? totalCost / totalRequests : 0

    const costByLevel: Record<AnalysisLevel, number> = { basic: 0, detailed: 0, premium: 0 }
    const requestsByLevel: Record<AnalysisLevel, number> = { basic: 0, detailed: 0, premium: 0 }

    allRequests.forEach(req => {
      costByLevel[req.analysisLevel] += req.estimatedCost
      requestsByLevel[req.analysisLevel]++
    })

    const completedWithTimes = this.queue.completed.filter(r => r.result?.processingTime)
    const averageProcessingTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, req) => sum + req.result.processingTime, 0) / completedWithTimes.length
      : 0

    return {
      totalRequests,
      successRate,
      averageCost,
      costByLevel,
      requestsByLevel,
      averageProcessingTime
    }
  }
}

// Global service instance (in production, this would be properly managed)
export const aiAnalysisService = new AIAnalysisService()

/**
 * Helper function to format cost for display
 */
export function formatCost(amount: number): string {
  return `$${amount.toFixed(3)}`
}

/**
 * Helper function to format processing time
 */
export function formatProcessingTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

/**
 * Helper function to get analysis level description
 */
export function getAnalysisLevelDescription(level: AnalysisLevel): string {
  const descriptions = {
    basic: 'Quick visual analysis with basic insights',
    detailed: 'Comprehensive content and visual analysis',
    premium: 'Full analysis with advanced recommendations and insights'
  }
  return descriptions[level]
}