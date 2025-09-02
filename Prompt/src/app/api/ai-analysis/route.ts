import { NextRequest, NextResponse } from 'next/server'
import { aiAnalysisService, AnalysisLevel } from '@/lib/ai-analysis-service'

interface AnalysisRequestBody {
  mediaAssetId: string
  analysisLevel: AnalysisLevel
  sessionId: string
  userId?: string
  priority?: 'low' | 'medium' | 'high'
  userConfirmed?: boolean
}

interface BulkAnalysisRequestBody {
  requests: AnalysisRequestBody[]
  skipBudgetCheck?: boolean
}

interface BudgetUpdateBody {
  dailyLimit?: number
  monthlyLimit?: number
  perAnalysisLimit?: number
  autoApproveUnder?: number
  requireConfirmationOver?: number
  emergencyStop?: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 [AI Analysis API] POST request received')
    
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'analyze'
    
    switch (action) {
      case 'analyze':
        return handleAnalysisRequest(request)
      case 'bulk':
        return handleBulkAnalysisRequest(request)
      case 'status':
        return handleStatusRequest(request)
      case 'result':
        return handleResultRequest(request)
      case 'cancel':
        return handleCancelRequest(request)
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ [AI Analysis API] Request failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `AI Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

async function handleAnalysisRequest(request: NextRequest) {
  const body = await request.json() as AnalysisRequestBody
  const { mediaAssetId, analysisLevel, sessionId, userId, priority, userConfirmed } = body

  if (!mediaAssetId || !analysisLevel || !sessionId) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: mediaAssetId, analysisLevel, sessionId' },
      { status: 400 }
    )
  }

  console.log('🔍 [AI Analysis API] Requesting analysis', {
    mediaAssetId,
    analysisLevel,
    sessionId,
    priority: priority || 'medium'
  })

  const result = aiAnalysisService.requestAnalysis(mediaAssetId, analysisLevel, {
    sessionId,
    userId,
    priority,
    userConfirmed
  })

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: result.error,
      cost: result.cost,
      requiresConfirmation: result.requiresConfirmation
    }, { status: result.requiresConfirmation ? 202 : 400 })
  }

  return NextResponse.json({
    success: true,
    data: {
      requestId: result.requestId,
      cost: result.cost,
      status: 'queued'
    }
  })
}

async function handleBulkAnalysisRequest(request: NextRequest) {
  const body = await request.json() as BulkAnalysisRequestBody
  const { requests, skipBudgetCheck } = body

  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Missing or empty requests array' },
      { status: 400 }
    )
  }

  console.log('🔍 [AI Analysis API] Bulk analysis request', {
    requestCount: requests.length,
    skipBudgetCheck
  })

  const results = []
  let totalCost = 0
  let successCount = 0
  let failureCount = 0

  for (const req of requests) {
    const result = aiAnalysisService.requestAnalysis(req.mediaAssetId, req.analysisLevel, {
      sessionId: req.sessionId,
      userId: req.userId,
      priority: req.priority,
      userConfirmed: req.userConfirmed,
      skipBudgetCheck
    })

    results.push({
      mediaAssetId: req.mediaAssetId,
      ...result
    })

    if (result.success) {
      successCount++
      totalCost += result.cost || 0
    } else {
      failureCount++
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      results,
      summary: {
        total: requests.length,
        successful: successCount,
        failed: failureCount,
        totalCost
      }
    }
  })
}

async function handleStatusRequest(request: NextRequest) {
  const url = new URL(request.url)
  const requestId = url.searchParams.get('requestId')

  if (requestId) {
    const analysisRequest = aiAnalysisService.getAnalysisResult(requestId)
    if (!analysisRequest) {
      return NextResponse.json(
        { success: false, error: 'Analysis request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        status: analysisRequest.status,
        progress: analysisRequest.status === 'processing' ? 'analyzing' : analysisRequest.status,
        result: analysisRequest.result,
        error: analysisRequest.errorMessage
      }
    })
  }

  // Return overall queue status
  const queueStatus = aiAnalysisService.getQueueStatus()
  const costInfo = aiAnalysisService.getCostInfo()
  
  return NextResponse.json({
    success: true,
    data: {
      queue: queueStatus,
      budget: costInfo,
      service: {
        status: 'operational',
        lastUpdate: new Date().toISOString()
      }
    }
  })
}

async function handleResultRequest(request: NextRequest) {
  const url = new URL(request.url)
  const requestId = url.searchParams.get('requestId')

  if (!requestId) {
    return NextResponse.json(
      { success: false, error: 'Missing requestId parameter' },
      { status: 400 }
    )
  }

  const analysisRequest = aiAnalysisService.getAnalysisResult(requestId)
  if (!analysisRequest) {
    return NextResponse.json(
      { success: false, error: 'Analysis request not found' },
      { status: 404 }
    )
  }

  if (analysisRequest.status !== 'completed') {
    return NextResponse.json(
      { 
        success: false, 
        error: `Analysis not completed yet. Current status: ${analysisRequest.status}` 
      },
      { status: 202 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      requestId,
      result: analysisRequest.result,
      cost: analysisRequest.estimatedCost,
      completedAt: analysisRequest.completedAt,
      processingTime: analysisRequest.result?.processingTime
    }
  })
}

async function handleCancelRequest(request: NextRequest) {
  const url = new URL(request.url)
  const requestId = url.searchParams.get('requestId')

  if (!requestId) {
    return NextResponse.json(
      { success: false, error: 'Missing requestId parameter' },
      { status: 400 }
    )
  }

  const cancelled = aiAnalysisService.cancelAnalysis(requestId)
  
  return NextResponse.json({
    success: cancelled,
    data: {
      requestId,
      cancelled
    }
  })
}

// GET endpoint for status and analytics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'status'

    switch (type) {
      case 'status':
        const queueStatus = aiAnalysisService.getQueueStatus()
        const costInfo = aiAnalysisService.getCostInfo()
        
        return NextResponse.json({
          success: true,
          data: {
            queue: queueStatus,
            budget: costInfo,
            timestamp: new Date().toISOString()
          }
        })

      case 'analytics':
        const analytics = aiAnalysisService.getAnalyticsData()
        
        return NextResponse.json({
          success: true,
          data: analytics
        })

      case 'pricing':
        const { ANALYSIS_COSTS } = await import('@/lib/ai-analysis-service')
        
        return NextResponse.json({
          success: true,
          data: {
            levels: ANALYSIS_COSTS,
            currency: 'USD',
            lastUpdated: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ [AI Analysis API] GET failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `GET request failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

// PUT endpoint for updating settings
export async function PUT(request: NextRequest) {
  try {
    console.log('⚙️ [AI Analysis API] PUT request for settings update')
    
    const body = await request.json() as BudgetUpdateBody
    
    // Validate settings
    const validKeys = ['dailyLimit', 'monthlyLimit', 'perAnalysisLimit', 'autoApproveUnder', 'requireConfirmationOver', 'emergencyStop']
    const invalidKeys = Object.keys(body).filter(key => !validKeys.includes(key))
    
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid settings keys: ${invalidKeys.join(', ')}` },
        { status: 400 }
      )
    }

    // Update settings
    aiAnalysisService.updateBudgetSettings(body)
    const updatedInfo = aiAnalysisService.getCostInfo()

    console.log('✅ [AI Analysis API] Settings updated successfully')

    return NextResponse.json({
      success: true,
      data: {
        message: 'Budget settings updated successfully',
        settings: updatedInfo.budget
      }
    })
  } catch (error) {
    console.error('❌ [AI Analysis API] PUT failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Settings update failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint for resetting costs
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [AI Analysis API] DELETE request for cost reset')
    
    const url = new URL(request.url)
    const resetType = url.searchParams.get('reset') as 'daily' | 'monthly' | 'all' || 'all'
    
    if (!['daily', 'monthly', 'all'].includes(resetType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset type. Use: daily, monthly, or all' },
        { status: 400 }
      )
    }

    aiAnalysisService.resetCostTracker(resetType)
    const updatedInfo = aiAnalysisService.getCostInfo()

    console.log(`✅ [AI Analysis API] ${resetType} costs reset successfully`)

    return NextResponse.json({
      success: true,
      data: {
        message: `${resetType} costs reset successfully`,
        costInfo: updatedInfo
      }
    })
  } catch (error) {
    console.error('❌ [AI Analysis API] DELETE failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Cost reset failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}