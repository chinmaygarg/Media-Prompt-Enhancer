'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MediaDescriptionInput from './MediaDescriptionInput'
import AIAnalysisControlPanel from './AIAnalysisControlPanel'
import ParameterSelectionInterface from './ParameterSelectionInterface'
import { aiAnalysisService } from '@/lib/ai-analysis-service'
import { Sparkles, Settings, Copy, Download } from 'lucide-react'

interface MediaAsset {
  id: string
  filename: string
  file_type: 'image' | 'video' | 'audio'
  storage_path: string
  mime_type: string
  file_size_bytes: number
  description?: {
    userDescription?: string
    aiAnalysis?: any
    tags: string[]
    category: 'character' | 'environment' | 'object' | 'style' | 'reference' | 'general'
  }
}

interface EnhancementConfig {
  outputType: 'text-to-image' | 'image-text-to-image' | 'text-to-video' | 'image-text-to-video' | 'text-to-video-audio' | 'image-text-to-video-audio'
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
  style: string
  duration?: number
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5'
  qualityTier: 'draft' | 'social' | 'production'
}

interface TextElement {
  id: string
  text: string
  type: 'overlay' | 'in-video'
  position?: { x: number; y: number; anchor: string }
  timing?: { startTime: number; endTime: number }
  context?: 'sign' | 'screen' | 'paper' | 'billboard' | 'book' | 'laptop' | 'phone'
  style?: any
}

interface EnhancedPrompt {
  primary_prompt: string
  negative_prompt: string
  model_selected: string
  estimated_cost: number
  shots?: Array<{
    prompt: string
    duration: number
    transition: string
  }>
  text_instructions?: string[]
  text_warnings?: string[]
  media_insights?: string[]
}

export default function PromptEnhancer() {
  const [basePrompt, setBasePrompt] = useState('')
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [config, setConfig] = useState<EnhancementConfig>({
    outputType: 'text-to-image',
    platform: 'general',
    style: '',
    aspectRatio: '1:1',
    qualityTier: 'social'
  })
  const [enhancedPrompt, setEnhancedPrompt] = useState<EnhancedPrompt | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [parameterMode, setParameterMode] = useState<'auto' | 'manual'>('auto')
  const [selectedParameters, setSelectedParameters] = useState<any>({})

  const outputTypes = [
    { value: 'text-to-image', label: 'Text → Image' },
    { value: 'image-text-to-image', label: 'Image + Text → Image' },
    { value: 'text-to-video', label: 'Text → Video' },
    { value: 'image-text-to-video', label: 'Image + Text → Video' },
    { value: 'text-to-video-audio', label: 'Text → Video + Audio' },
    { value: 'image-text-to-video-audio', label: 'Image + Text → Video + Audio' },
  ]

  const platforms = [
    { value: 'general', label: 'General Purpose' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube Shorts' },
    { value: 'linkedin', label: 'LinkedIn' },
  ]

  const aspectRatios = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '16:9', label: '16:9 (Horizontal)' },
    { value: '4:5', label: '4:5 (Portrait)' },
  ]

  const qualityTiers = [
    { value: 'draft', label: 'Draft (Fast, Lower Cost)' },
    { value: 'social', label: 'Social (Balanced)' },
    { value: 'production', label: 'Production (High Quality)' },
  ]

  const handleEnhance = async () => {
    if (!basePrompt.trim()) return

    setEnhancing(true)
    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_prompt: basePrompt,
          media_assets: mediaAssets,
          text_elements: textElements,
          config: config,
          session_id: `session_${Date.now()}`
        })
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        setEnhancedPrompt(result.data)
      } else {
        console.error('Enhancement failed:', result.error)
      }
    } catch (error) {
      console.error('Enhancement error:', error)
    } finally {
      setEnhancing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportResult = () => {
    if (!enhancedPrompt) return
    
    const exportData = {
      enhanced_prompt: enhancedPrompt,
      original_prompt: basePrompt,
      media_assets: mediaAssets,
      config: config,
      timestamp: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `enhanced-prompt-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-6 py-12">
          <div className="relative">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
              <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-primary inline-block mr-4 float pulse-glow" />
              Media Prompt Enhancer
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-lg blur opacity-30 animate-pulse"></div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform your creative ideas into <span className="text-primary font-semibold">optimized prompts</span> for 
            AI image, video, and audio generation with <span className="text-primary font-semibold">professional-grade results</span>
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>20+ AI Models</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Multi-Platform Optimization</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Cost-Effective Selection</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-8">
            {/* Base Prompt */}
            <Card className="glass-card hover-lift transition-smooth border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-3 text-primary">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    ✨
                  </div>
                  Your Creative Vision
                </CardTitle>
                <p className="text-muted-foreground">Describe your idea and watch it transform</p>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="A cinematic sunset over a futuristic city with flying cars, vibrant colors, dramatic lighting..."
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  className="min-h-36 bg-secondary/50 border-primary/20 focus:border-primary/60 transition-smooth resize-none text-base leading-relaxed"
                />
              </CardContent>
            </Card>

            {/* Enhanced Media References */}
            <MediaDescriptionInput 
              onMediaChange={setMediaAssets} 
              aiAnalysisEnabled={true}
            />

            {/* Text Elements */}
            <Card className="glass-card hover-lift transition-smooth border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-3 text-primary">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    📝
                  </div>
                  Text Elements
                </CardTitle>
                <p className="text-muted-foreground">Add overlay text or in-video text elements</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {textElements.map((element, index) => (
                  <div key={element.id} className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">
                          {element.type === 'overlay' ? 'Overlay' : 'In-Video'}
                        </span>
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTextElements(prev => prev.filter((_, i) => i !== index))}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        placeholder="Enter text content..."
                        value={element.text}
                        onChange={(e) => setTextElements(prev => 
                          prev.map((el, i) => i === index ? { ...el, text: e.target.value } : el)
                        )}
                        className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Type</label>
                          <select
                            value={element.type}
                            onChange={(e) => setTextElements(prev => 
                              prev.map((el, i) => i === index ? { ...el, type: e.target.value as 'overlay' | 'in-video' } : el)
                            )}
                            className="w-full p-2 text-sm bg-secondary/50 border border-primary/20 rounded focus:border-primary/60"
                          >
                            <option value="overlay">Overlay</option>
                            <option value="in-video">In-Video</option>
                          </select>
                        </div>
                        {element.type === 'in-video' && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Context</label>
                            <select
                              value={element.context || 'custom'}
                              onChange={(e) => setTextElements(prev => 
                                prev.map((el, i) => i === index ? { ...el, context: e.target.value as any } : el)
                              )}
                              className="w-full p-2 text-sm bg-secondary/50 border border-primary/20 rounded focus:border-primary/60"
                            >
                              <option value="sign">Sign/Signage</option>
                              <option value="screen">Digital Screen</option>
                              <option value="paper">Paper/Document</option>
                              <option value="billboard">Billboard</option>
                              <option value="book">Book/Magazine</option>
                              <option value="laptop">Laptop Screen</option>
                              <option value="phone">Phone Screen</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                        )}
                        {element.type === 'overlay' && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Position</label>
                            <select
                              value={element.position?.anchor || 'center'}
                              onChange={(e) => setTextElements(prev => 
                                prev.map((el, i) => i === index ? { 
                                  ...el, 
                                  position: { x: 50, y: 50, anchor: e.target.value }
                                } : el)
                              )}
                              className="w-full p-2 text-sm bg-secondary/50 border border-primary/20 rounded focus:border-primary/60"
                            >
                              <option value="top-left">Top Left</option>
                              <option value="top-center">Top Center</option>
                              <option value="top-right">Top Right</option>
                              <option value="center-left">Center Left</option>
                              <option value="center">Center</option>
                              <option value="center-right">Center Right</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-center">Bottom Center</option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTextElements(prev => [...prev, {
                      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      text: '',
                      type: 'overlay'
                    }])}
                    className="flex-1 border-primary/20 text-primary hover:bg-primary/10"
                  >
                    + Add Overlay Text
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setTextElements(prev => [...prev, {
                      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      text: '',
                      type: 'in-video'
                    }])}
                    className="flex-1 border-primary/20 text-primary hover:bg-primary/10"
                  >
                    + Add In-Video Text
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Control Panel */}
            <AIAnalysisControlPanel 
              analysisService={aiAnalysisService}
              onSettingsChange={(settings) => {
                console.log('Budget settings updated:', settings)
              }}
              onAnalysisRequest={(mediaAssetId, level) => {
                console.log('Analysis requested:', mediaAssetId, level)
              }}
            />

            {/* Smart Parameter Selection */}
            <ParameterSelectionInterface
              basePrompt={basePrompt}
              outputType={config.outputType}
              platform={config.platform}
              mediaAssets={mediaAssets}
              textElements={textElements}
              onParametersChange={(params) => {
                setSelectedParameters(params)
                // Update config with AI-selected parameters if in auto mode
                if (parameterMode === 'auto' && params.model) {
                  setConfig(prev => ({
                    ...prev,
                    aspectRatio: params.aspectRatio || prev.aspectRatio,
                    qualityTier: params.qualityTier || prev.qualityTier,
                    duration: params.duration || prev.duration,
                    style: params.style || prev.style
                  }))
                }
              }}
              onModeChange={(mode) => {
                setParameterMode(mode)
                console.log('Parameter mode changed to:', mode)
              }}
            />

            {/* Configuration */}
            <Card className="glass-card hover-lift transition-smooth border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-3 text-primary">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  Smart Configuration
                  {parameterMode === 'auto' && selectedParameters.confidence && (
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                        AI Optimized
                      </div>
                      <span className="text-sm text-green-400 font-medium">
                        {selectedParameters.confidence}% confidence
                      </span>
                    </div>
                  )}
                </CardTitle>
                <p className="text-muted-foreground">
                  {parameterMode === 'auto' 
                    ? 'Settings optimized by AI - you can still override them below' 
                    : 'Fine-tune your content generation settings manually'}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Output Type
                  </label>
                  <select
                    value={config.outputType}
                    onChange={(e) => setConfig(prev => ({ ...prev, outputType: e.target.value as any }))}
                    className="w-full p-3 bg-secondary/50 border border-primary/20 rounded-lg focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-smooth text-foreground"
                  >
                    {outputTypes.map(type => (
                      <option key={type.value} value={type.value} className="bg-secondary text-foreground">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Platform
                    </label>
                    <select
                      value={config.platform}
                      onChange={(e) => setConfig(prev => ({ ...prev, platform: e.target.value as any }))}
                      className="w-full p-3 bg-secondary/50 border border-primary/20 rounded-lg focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-smooth text-foreground"
                    >
                      {platforms.map(platform => (
                        <option key={platform.value} value={platform.value} className="bg-secondary text-foreground">
                          {platform.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      Aspect Ratio
                    </label>
                    <select
                      value={config.aspectRatio}
                      onChange={(e) => setConfig(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                      className="w-full p-3 bg-secondary/50 border border-primary/20 rounded-lg focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-smooth text-foreground"
                    >
                      {aspectRatios.map(ratio => (
                        <option key={ratio.value} value={ratio.value} className="bg-secondary text-foreground">
                          {ratio.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Quality Tier
                  </label>
                  <select
                    value={config.qualityTier}
                    onChange={(e) => setConfig(prev => ({ ...prev, qualityTier: e.target.value as any }))}
                    className="w-full p-3 bg-secondary/50 border border-primary/20 rounded-lg focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-smooth text-foreground"
                  >
                    {qualityTiers.map(tier => (
                      <option key={tier.value} value={tier.value} className="bg-secondary text-foreground">
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    Style Description
                  </label>
                  <Input
                    placeholder="cinematic, dreamy, photorealistic, anime, vintage film..."
                    value={config.style}
                    onChange={(e) => setConfig(prev => ({ ...prev, style: e.target.value }))}
                    className="bg-secondary/50 border-primary/20 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-smooth text-base"
                  />
                </div>

                {config.outputType.includes('video') && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      Duration (seconds)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={config.duration || 5}
                      onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="bg-secondary/50 border-primary/20 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-smooth text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Longer videos will be split into multiple optimized clips
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Generate Button */}
            <div className="relative">
              <Button 
                onClick={handleEnhance}
                disabled={!basePrompt.trim() || enhancing}
                className="w-full h-16 text-lg font-semibold btn-gradient hover:scale-[1.02] transition-smooth relative overflow-hidden group"
                size="lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {enhancing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Crafting Magic...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 animate-pulse" />
                      <span>✨ Enhance Prompt</span>
                      <div className="w-2 h-2 bg-current rounded-full animate-ping"></div>
                    </>
                  )}
                </div>
              </Button>
              {!basePrompt.trim() && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Enter your creative idea above to get started
                </p>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-8">
            {enhancedPrompt ? (
              <>
                <Card className="glass-card hover-lift transition-smooth border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full blur-3xl"></div>
                  <CardHeader className="pb-4 relative">
                    <CardTitle className="text-2xl flex items-center justify-between text-primary">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          ✨
                        </div>
                        <span>Enhanced Result</span>
                        <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Ready
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(enhancedPrompt.primary_prompt)}
                          className="bg-secondary/50 border-primary/20 hover:border-primary/60 hover:bg-primary/10 transition-smooth"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportResult}
                          className="bg-secondary/50 border-primary/20 hover:border-primary/60 hover:bg-primary/10 transition-smooth"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 relative">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Optimized Prompt
                      </h4>
                      <div className="p-4 bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-lg border border-primary/20 font-mono text-sm leading-relaxed text-foreground backdrop-blur-sm">
                        {enhancedPrompt.primary_prompt}
                      </div>
                    </div>

                    {enhancedPrompt.negative_prompt && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          Negative Prompt
                        </h4>
                        <div className="p-4 bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20 font-mono text-sm leading-relaxed text-foreground backdrop-blur-sm">
                          {enhancedPrompt.negative_prompt}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="font-semibold text-blue-400">Selected Model</span>
                        </div>
                        <p className="text-foreground font-medium">{enhancedPrompt.model_selected}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="font-semibold text-green-400">Estimated Cost</span>
                        </div>
                        <p className="text-foreground font-medium">${enhancedPrompt.estimated_cost.toFixed(3)}</p>
                      </div>
                    </div>

                    {enhancedPrompt.shots && enhancedPrompt.shots.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          Video Sequence ({enhancedPrompt.shots.length} clips)
                        </h4>
                        <div className="space-y-3">
                          {enhancedPrompt.shots.map((shot, index) => (
                            <div key={index} className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20 backdrop-blur-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">
                                    {index + 1}
                                  </div>
                                  <span className="font-medium text-purple-400">
                                    {shot.duration}s • {shot.transition}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Scene {index + 1}
                                </div>
                              </div>
                              <div className="text-sm text-foreground font-mono leading-relaxed">{shot.prompt}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(enhancedPrompt.text_instructions?.length || enhancedPrompt.text_warnings?.length) && (
                      <div className="space-y-4">
                        {enhancedPrompt.text_instructions && enhancedPrompt.text_instructions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                              Text Processing Instructions
                            </h4>
                            <div className="space-y-2">
                              {enhancedPrompt.text_instructions.map((instruction, index) => (
                                <div key={index} className="p-3 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 rounded-lg border border-cyan-500/20 backdrop-blur-sm">
                                  <div className="text-sm text-foreground leading-relaxed">{instruction}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {enhancedPrompt.text_warnings && enhancedPrompt.text_warnings.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                              Text Processing Warnings
                            </h4>
                            <div className="space-y-2">
                              {enhancedPrompt.text_warnings.map((warning, index) => (
                                <div key={index} className="p-3 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 rounded-lg border border-yellow-500/20 backdrop-blur-sm">
                                  <div className="text-sm text-foreground leading-relaxed">{warning}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {enhancedPrompt.media_insights && enhancedPrompt.media_insights.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                          Media Insights
                        </h4>
                        <div className="space-y-2">
                          {enhancedPrompt.media_insights.map((insight, index) => (
                            <div key={index} className="p-3 bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20 backdrop-blur-sm">
                              <div className="text-sm text-foreground leading-relaxed">{insight}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-card hover-lift transition-smooth border-primary/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-600/5"></div>
                <CardContent className="flex items-center justify-center py-16 relative">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <Sparkles className="w-16 h-16 mx-auto text-primary/60 float" />
                      <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-40"></div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Create Magic</h3>
                    <p className="text-muted-foreground">Your enhanced prompt will appear here once generated</p>
                    <div className="mt-4 flex justify-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span>Professional Quality</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Cost Optimized</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}