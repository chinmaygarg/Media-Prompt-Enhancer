'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Settings, 
  Brain, 
  Target, 
  DollarSign, 
  Clock, 
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Shield
} from 'lucide-react'
import { 
  selectOptimalParameters, 
  AutoParameterResult, 
  UserPreferences,
  ManualOverride
} from '@/lib/parameter-intelligence'

interface ParameterSelectionProps {
  basePrompt: string
  outputType: string
  platform: string
  mediaAssets?: any[]
  textElements?: any[]
  onParametersChange: (parameters: any) => void
  onModeChange: (mode: 'auto' | 'manual') => void
  className?: string
}

export default function ParameterSelectionInterface({
  basePrompt,
  outputType,
  platform,
  mediaAssets = [],
  textElements = [],
  onParametersChange,
  onModeChange,
  className
}: ParameterSelectionProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [autoResult, setAutoResult] = useState<AutoParameterResult | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    preferredModels: [],
    budgetPriority: 'balanced',
    speedPreference: 'balanced',
    riskTolerance: 'moderate',
    experienceLevel: 'intermediate'
  })
  const [manualOverrides, setManualOverrides] = useState<ManualOverride>({
    enabled: false,
    overriddenParameters: {},
    userPreferences,
    expertMode: false
  })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recommendations: true,
    alternatives: false,
    manual: false,
    preferences: false
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Auto-analyze when inputs change
  useEffect(() => {
    if (mode === 'auto' && basePrompt.trim()) {
      analyzeParameters()
    }
  }, [basePrompt, outputType, platform, mediaAssets, textElements, userPreferences, mode])

  const analyzeParameters = async () => {
    setIsAnalyzing(true)
    try {
      // Simulate analysis delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const result = selectOptimalParameters({
        basePrompt,
        outputType,
        platform,
        mediaAssets,
        textElements,
        userPreferences
      })
      
      setAutoResult(result)
      
      // Update parent component with selected parameters
      onParametersChange({
        model: result.modelRecommendation.primaryModel,
        qualityTier: result.qualitySettings.recommendedTier,
        aspectRatio: result.platformOptimization.recommendedAspectRatio,
        duration: result.platformOptimization.recommendedDuration,
        style: result.platformOptimization.styleKeywords.join(', '),
        processingPriority: result.qualitySettings.processingPriority,
        estimatedCost: result.costOptimization.estimatedCost,
        confidence: result.confidenceScore
      })
    } catch (error) {
      console.error('Parameter analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleModeChange = (newMode: 'auto' | 'manual') => {
    setMode(newMode)
    onModeChange(newMode)
    
    if (newMode === 'auto' && basePrompt.trim()) {
      analyzeParameters()
    }
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setUserPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleManualOverride = (parameter: string, value: any) => {
    setManualOverrides(prev => ({
      ...prev,
      enabled: true,
      overriddenParameters: {
        ...prev.overriddenParameters,
        [parameter]: value
      }
    }))
    
    // Update parent with manual parameters
    onParametersChange({
      ...manualOverrides.overriddenParameters,
      [parameter]: value,
      mode: 'manual'
    })
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getConfidenceBadge = (score: number) => {
    if (score >= 85) return 'high'
    if (score >= 70) return 'medium'
    return 'low'
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <Card className={`glass-card hover-lift transition-smooth border-primary/20 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          Smart Parameter Selection
        </CardTitle>
        <p className="text-muted-foreground">
          Let AI optimize your settings automatically or take manual control
        </p>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant={mode === 'auto' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('auto')}
            className="border-primary/20"
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto Optimize
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('manual')}
            className="border-primary/20"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manual Control
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {mode === 'auto' && (
          <div className="space-y-6">
            {/* Analysis Status */}
            {isAnalyzing && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <p className="font-medium text-primary">Analyzing your requirements...</p>
                    <p className="text-sm text-muted-foreground">Finding optimal parameters based on your input</p>
                  </div>
                </div>
              </div>
            )}

            {/* User Preferences */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                onClick={() => toggleSection('preferences')}
                className="w-full justify-between text-left p-0 h-auto font-semibold text-foreground hover:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Your Preferences
                </div>
                {expandedSections.preferences ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </Button>

              {expandedSections.preferences && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Budget Priority</label>
                    <select
                      value={userPreferences.budgetPriority}
                      onChange={(e) => handlePreferenceChange('budgetPriority', e.target.value)}
                      className="w-full p-2 bg-secondary/50 border border-primary/20 rounded focus:border-primary/60 text-sm"
                    >
                      <option value="cost">Cost First</option>
                      <option value="balanced">Balanced</option>
                      <option value="quality">Quality First</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Speed Preference</label>
                    <select
                      value={userPreferences.speedPreference}
                      onChange={(e) => handlePreferenceChange('speedPreference', e.target.value)}
                      className="w-full p-2 bg-secondary/50 border border-primary/20 rounded focus:border-primary/60 text-sm"
                    >
                      <option value="fastest">Fastest</option>
                      <option value="balanced">Balanced</option>
                      <option value="highest_quality">Highest Quality</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Experience Level</label>
                    <select
                      value={userPreferences.experienceLevel}
                      onChange={(e) => handlePreferenceChange('experienceLevel', e.target.value)}
                      className="w-full p-2 bg-secondary/50 border border-primary/20 rounded focus:border-primary/60 text-sm"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Risk Tolerance</label>
                    <select
                      value={userPreferences.riskTolerance}
                      onChange={(e) => handlePreferenceChange('riskTolerance', e.target.value)}
                      className="w-full p-2 bg-secondary/50 border border-primary/20 rounded focus:border-primary/60 text-sm"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Auto Recommendations */}
            {autoResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => toggleSection('recommendations')}
                    className="text-left p-0 h-auto font-semibold text-foreground hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      AI Recommendations
                    </div>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${getConfidenceColor(autoResult.confidenceScore)} border-current`}
                    >
                      {getConfidenceBadge(autoResult.confidenceScore)} confidence
                    </Badge>
                    <span className={`text-sm font-medium ${getConfidenceColor(autoResult.confidenceScore)}`}>
                      {autoResult.confidenceScore}%
                    </span>
                  </div>
                </div>

                {expandedSections.recommendations && (
                  <div className="space-y-4">
                    {/* Model Recommendation */}
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-green-400 mb-1">Recommended Model</h4>
                          <p className="text-xl font-bold text-foreground">{autoResult.modelRecommendation.primaryModel}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-green-400 border-green-500/50 mb-1">
                            {autoResult.modelRecommendation.qualityRating}
                          </Badge>
                          <p className="text-sm text-muted-foreground">{autoResult.modelRecommendation.reason}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-green-400 mb-1">Strengths</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {autoResult.modelRecommendation.strengths.map((strength, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {autoResult.modelRecommendation.limitations.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-orange-400 mb-1">Considerations</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {autoResult.modelRecommendation.limitations.map((limitation, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                  {limitation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quality & Cost Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-blue-400" />
                          <span className="font-semibold text-blue-400">Quality</span>
                        </div>
                        <p className="text-lg font-bold text-foreground capitalize">
                          {autoResult.qualitySettings.recommendedTier}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {autoResult.qualitySettings.processingPriority} priority
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="font-semibold text-green-400">Cost</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          ${autoResult.costOptimization.estimatedCost.toFixed(3)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {autoResult.costOptimization.budgetLevel} tier
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-purple-400" />
                          <span className="font-semibold text-purple-400">Platform</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          {autoResult.platformOptimization.recommendedAspectRatio}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Optimized for {platform}
                        </p>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">Why These Settings?</span>
                      </div>
                      <ul className="space-y-2">
                        {autoResult.reasoning.map((reason, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Alternative Options */}
                {autoResult.alternativeOptions.length > 0 && (
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      onClick={() => toggleSection('alternatives')}
                      className="w-full justify-between text-left p-0 h-auto font-semibold text-foreground hover:bg-transparent"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                        Alternative Options ({autoResult.alternativeOptions.length})
                      </div>
                      {expandedSections.alternatives ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      }
                    </Button>

                    {expandedSections.alternatives && (
                      <div className="space-y-3">
                        {autoResult.alternativeOptions.map((option, index) => (
                          <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-foreground">{option.title}</h5>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                              </div>
                              <div className="text-right">
                                {option.savings && (
                                  <Badge 
                                    variant="outline" 
                                    className={option.savings > 0 ? 'text-green-400 border-green-500/50' : 'text-red-400 border-red-500/50'}
                                  >
                                    {option.savings > 0 ? '-' : '+'}${Math.abs(option.savings).toFixed(3)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-medium text-orange-400 mb-1">Trade-offs</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {option.tradeoffs.map((tradeoff, tIndex) => (
                                    <li key={tIndex} className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                                      {tradeoff}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="w-full mt-2 border-primary/20 text-primary hover:bg-primary/10"
                              >
                                Switch to This Option
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-orange-400" />
                <h4 className="font-semibold text-orange-400">Manual Control Mode</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                You have full control over all generation parameters. AI recommendations are disabled.
              </p>
            </div>

            {/* Manual Parameter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Model Selection</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">AI Model</label>
                    <select
                      onChange={(e) => handleManualOverride('model', e.target.value)}
                      className="w-full p-3 bg-secondary/50 border border-primary/20 rounded focus:border-primary/60"
                    >
                      <option value="qwen-image">Qwen Image (Fast, Budget)</option>
                      <option value="ideogram-v3">Ideogram v3 (Text Excellent)</option>
                      <option value="imagen-4">Imagen 4 (Premium Quality)</option>
                      <option value="veo-3">Veo 3 (Video + Audio)</option>
                      <option value="kling-2.1">Kling 2.1 (Cinema Quality)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Quality Tier</label>
                    <select
                      onChange={(e) => handleManualOverride('qualityTier', e.target.value)}
                      className="w-full p-3 bg-secondary/50 border border-primary/20 rounded focus:border-primary/60"
                    >
                      <option value="draft">Draft (Fastest)</option>
                      <option value="social">Social (Balanced)</option>
                      <option value="production">Production (Highest)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Output Settings</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
                    <select
                      onChange={(e) => handleManualOverride('aspectRatio', e.target.value)}
                      className="w-full p-3 bg-secondary/50 border border-primary/20 rounded focus:border-primary/60"
                    >
                      <option value="1:1">1:1 (Square)</option>
                      <option value="16:9">16:9 (Widescreen)</option>
                      <option value="9:16">9:16 (Vertical)</option>
                      <option value="4:5">4:5 (Portrait)</option>
                    </select>
                  </div>

                  {outputType.includes('video') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Duration (seconds)</label>
                      <Input
                        type="number"
                        min="5"
                        max="120"
                        placeholder="30"
                        onChange={(e) => handleManualOverride('duration', parseInt(e.target.value))}
                        className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expert Mode Toggle */}
            <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-foreground">Expert Mode</h5>
                  <p className="text-sm text-muted-foreground">Access advanced parameters and fine-tuning controls</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManualOverrides(prev => ({ ...prev, expertMode: !prev.expertMode }))}
                  className="border-primary/20 text-primary hover:bg-primary/10"
                >
                  {manualOverrides.expertMode ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>

            {/* Expert Controls */}
            {manualOverrides.expertMode && (
              <div className="p-4 bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h4 className="font-semibold text-red-400">Expert Parameters</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Sampling Steps</label>
                    <Input
                      type="number"
                      min="10"
                      max="100"
                      placeholder="20"
                      onChange={(e) => handleManualOverride('steps', parseInt(e.target.value))}
                      className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">CFG Scale</label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      placeholder="7.5"
                      onChange={(e) => handleManualOverride('cfgScale', parseFloat(e.target.value))}
                      className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-red-400 mt-3">
                  ⚠️ Modifying expert parameters may produce unexpected results. Use with caution.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}