'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  DollarSign, 
  Settings, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react'
import { 
  AIAnalysisService, 
  BudgetSettings, 
  AnalysisLevel,
  formatCost,
  formatProcessingTime,
  getAnalysisLevelDescription,
  ANALYSIS_COSTS
} from '@/lib/ai-analysis-service'

interface AIAnalysisControlPanelProps {
  analysisService: AIAnalysisService
  onSettingsChange?: (settings: BudgetSettings) => void
  onAnalysisRequest?: (mediaAssetId: string, level: AnalysisLevel) => void
}

export default function AIAnalysisControlPanel({ 
  analysisService,
  onSettingsChange,
  onAnalysisRequest 
}: AIAnalysisControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'queue' | 'analytics'>('overview')
  const [costInfo, setCostInfo] = useState(analysisService.getCostInfo())
  const [queueStatus, setQueueStatus] = useState(analysisService.getQueueStatus())
  const [analytics, setAnalytics] = useState(analysisService.getAnalyticsData())
  const [tempBudgetSettings, setTempBudgetSettings] = useState<BudgetSettings>(costInfo.budget)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Refresh data every 2 seconds
    const interval = setInterval(() => {
      setCostInfo(analysisService.getCostInfo())
      setQueueStatus(analysisService.getQueueStatus())
      setAnalytics(analysisService.getAnalyticsData())
    }, 2000)

    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [analysisService])

  const handleSettingsSave = () => {
    analysisService.updateBudgetSettings(tempBudgetSettings)
    setCostInfo(analysisService.getCostInfo())
    onSettingsChange?.(tempBudgetSettings)
  }

  const handleResetCosts = (type: 'daily' | 'monthly' | 'all') => {
    analysisService.resetCostTracker(type)
    setCostInfo(analysisService.getCostInfo())
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-400'
    if (percentage < 80) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="glass-card hover-lift transition-smooth border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          AI Analysis Control Center
        </CardTitle>
        <p className="text-muted-foreground">Manage AI-powered analysis with cost controls and budget monitoring</p>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="border-primary/20"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('settings')}
            className="border-primary/20"
          >
            <Settings className="w-4 h-4 mr-2" />
            Budget Settings
          </Button>
          <Button
            variant={activeTab === 'queue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('queue')}
            className="border-primary/20"
          >
            <Clock className="w-4 h-4 mr-2" />
            Queue Status
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
            className="border-primary/20"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Budget Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">Daily Budget</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span className={getUtilizationColor(costInfo.utilization.daily)}>
                      {formatCost(costInfo.tracker.dailySpent)} / {formatCost(costInfo.budget.dailyLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(costInfo.utilization.daily)}`}
                      style={{ width: `${Math.min(100, costInfo.utilization.daily)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCost(costInfo.remaining.daily)} remaining
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-400">Monthly Budget</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span className={getUtilizationColor(costInfo.utilization.monthly)}>
                      {formatCost(costInfo.tracker.monthlySpent)} / {formatCost(costInfo.budget.monthlyLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(costInfo.utilization.monthly)}`}
                      style={{ width: `${Math.min(100, costInfo.utilization.monthly)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCost(costInfo.remaining.monthly)} remaining
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-purple-400">Queue Status</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-foreground">{queueStatus.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing</span>
                    <span className="text-foreground">{queueStatus.processing}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. Wait</span>
                    <span className="text-foreground">
                      {formatProcessingTime(queueStatus.estimatedWaitTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold text-orange-400">Total Spent</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">
                    {formatCost(costInfo.tracker.totalSpent)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {analytics.totalRequests} analyses completed
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {formatCost(analytics.averageCost)} per analysis
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Levels Pricing */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Analysis Levels & Pricing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(ANALYSIS_COSTS).map(([level, cost]) => (
                  <div key={level} className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-foreground capitalize">{level}</h5>
                      <Badge variant="outline" className="text-primary border-primary/50">
                        {formatCost(cost)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {getAnalysisLevelDescription(level as AnalysisLevel)}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Used: {analytics.requestsByLevel[level as AnalysisLevel]} times
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResetCosts('daily')}
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Daily
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResetCosts('monthly')}
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Monthly
              </Button>
              {costInfo.budget.emergencyStop && (
                <Badge variant="destructive" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Emergency Stop Active
                </Badge>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Budget Limits
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Daily Limit ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tempBudgetSettings.dailyLimit}
                      onChange={(e) => setTempBudgetSettings(prev => ({ 
                        ...prev, 
                        dailyLimit: parseFloat(e.target.value) || 0 
                      }))}
                      className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Monthly Limit ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tempBudgetSettings.monthlyLimit}
                      onChange={(e) => setTempBudgetSettings(prev => ({ 
                        ...prev, 
                        monthlyLimit: parseFloat(e.target.value) || 0 
                      }))}
                      className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Per Analysis Limit ($)</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={tempBudgetSettings.perAnalysisLimit}
                      onChange={(e) => setTempBudgetSettings(prev => ({ 
                        ...prev, 
                        perAnalysisLimit: parseFloat(e.target.value) || 0 
                      }))}
                      className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Approval Settings
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Auto-approve under ($)</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={tempBudgetSettings.autoApproveUnder}
                      onChange={(e) => setTempBudgetSettings(prev => ({ 
                        ...prev, 
                        autoApproveUnder: parseFloat(e.target.value) || 0 
                      }))}
                      className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically approve requests below this amount
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Require confirmation over ($)</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={tempBudgetSettings.requireConfirmationOver}
                      onChange={(e) => setTempBudgetSettings(prev => ({ 
                        ...prev, 
                        requireConfirmationOver: parseFloat(e.target.value) || 0 
                      }))}
                      className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                    />
                    <p className="text-xs text-muted-foreground">
                      Require user confirmation for requests above this amount
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                    <input
                      type="checkbox"
                      id="emergencyStop"
                      checked={tempBudgetSettings.emergencyStop}
                      onChange={(e) => setTempBudgetSettings(prev => ({ 
                        ...prev, 
                        emergencyStop: e.target.checked 
                      }))}
                      className="w-4 h-4"
                    />
                    <label htmlFor="emergencyStop" className="text-sm font-medium text-foreground">
                      Emergency Stop
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Halt all analysis if budget limits are exceeded
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSettingsSave} className="bg-primary hover:bg-primary/80">
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTempBudgetSettings(costInfo.budget)}
                className="border-primary/20"
              >
                Reset Changes
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Processing Queue</h4>
              <Badge variant="outline" className="border-primary/50 text-primary">
                {queueStatus.pending + queueStatus.processing} active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">Pending</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{queueStatus.pending}</div>
                <p className="text-sm text-muted-foreground">Waiting to process</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-400">Processing</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{queueStatus.processing}</div>
                <p className="text-sm text-muted-foreground">Currently analyzing</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">Completed</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{queueStatus.completed}</div>
                <p className="text-sm text-muted-foreground">Successfully processed</p>
              </div>
            </div>

            {queueStatus.estimatedWaitTime > 0 && (
              <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Estimated Wait Time</span>
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatProcessingTime(queueStatus.estimatedWaitTime)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {queueStatus.pending} pending requests
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-purple-400">Total Requests</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{analytics.totalRequests}</div>
                <p className="text-sm text-muted-foreground">All time</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">Success Rate</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{analytics.successRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Completion rate</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold text-orange-400">Avg Cost</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{formatCost(analytics.averageCost)}</div>
                <p className="text-sm text-muted-foreground">Per analysis</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-400">Avg Time</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatProcessingTime(analytics.averageProcessingTime)}
                </div>
                <p className="text-sm text-muted-foreground">Processing time</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Usage by Analysis Level</h4>
              <div className="space-y-2">
                {Object.entries(analytics.requestsByLevel).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize text-primary border-primary/50">
                        {level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatCost(ANALYSIS_COSTS[level as AnalysisLevel])} each
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{count} requests</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCost(analytics.costByLevel[level as AnalysisLevel])} total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}