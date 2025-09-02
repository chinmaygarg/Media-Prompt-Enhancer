'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, Link, X, Plus, Tag, Eye, Sparkles, AlertCircle, CheckCircle, DollarSign } from 'lucide-react'
import { MediaDescription, createMediaDescription, updateMediaDescription, calculateAnalysisCost, AnalysisLevel, simulateAIAnalysis } from '@/lib/media-description-engine'

interface MediaAsset {
  id: string
  filename: string
  file_type: 'image' | 'video' | 'audio'
  storage_path: string
  mime_type: string
  file_size_bytes: number
}

interface MediaWithDescription extends MediaAsset {
  description?: MediaDescription
}

interface MediaDescriptionInputProps {
  onMediaChange: (assets: MediaWithDescription[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  aiAnalysisEnabled?: boolean
}

export default function MediaDescriptionInput({ 
  onMediaChange, 
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*', 'audio/*'],
  aiAnalysisEnabled = false
}: MediaDescriptionInputProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'urls'>('upload')
  const [uploading, setUploading] = useState(false)
  const [validatingUrls, setValidatingUrls] = useState(false)
  const [urls, setUrls] = useState<string[]>([''])
  const [assets, setAssets] = useState<MediaWithDescription[]>([])
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)
  const [analyzingAsset, setAnalyzingAsset] = useState<string | null>(null)
  const [analysisLevel, setAnalysisLevel] = useState<AnalysisLevel>('basic')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })
      formData.append('session_id', `session_${Date.now()}`)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (result.success && result.data?.uploaded_assets) {
        const newAssets = result.data.uploaded_assets.map((asset: MediaAsset) => ({
          ...asset,
          description: createMediaDescription(asset.id)
        }))
        
        const updatedAssets = [...assets, ...newAssets]
        setAssets(updatedAssets)
        onMediaChange(updatedAssets)
      } else {
        console.error('Upload failed:', result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleUrlValidation = async () => {
    const validUrls = urls.filter(url => url.trim().length > 0)
    if (validUrls.length === 0) return

    setValidatingUrls(true)
    try {
      const response = await fetch('/api/media/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: validUrls,
          session_id: `session_${Date.now()}`
        })
      })

      const result = await response.json()
      
      if (result.success && result.data?.validated_urls) {
        const urlMediaAssets: MediaWithDescription[] = result.data.validated_urls
          .filter((asset: any) => asset.valid)
          .map((asset: any) => ({
            id: asset.id,
            filename: asset.url.split('/').pop() || 'url-asset',
            file_type: (asset.type === 'image' ? 'image' : asset.type === 'video' ? 'video' : 'audio') as 'image' | 'video' | 'audio',
            storage_path: asset.url,
            mime_type: `${asset.type}/*`,
            file_size_bytes: 0,
            description: createMediaDescription(asset.id)
          }))
        
        const updatedAssets = [...assets, ...urlMediaAssets]
        setAssets(updatedAssets)
        onMediaChange(updatedAssets)
      }
    } catch (error) {
      console.error('URL validation error:', error)
    } finally {
      setValidatingUrls(false)
    }
  }

  const updateAssetDescription = (assetId: string, updates: {
    userDescription?: string
    tags?: string[]
    category?: MediaDescription['category']
  }) => {
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId && asset.description) {
        const updatedDescription = updateMediaDescription(asset.description, updates)
        return { ...asset, description: updatedDescription }
      }
      return asset
    }))
    
    // Update parent component
    const updatedAssets = assets.map(asset => {
      if (asset.id === assetId && asset.description) {
        const updatedDescription = updateMediaDescription(asset.description, updates)
        return { ...asset, description: updatedDescription }
      }
      return asset
    })
    onMediaChange(updatedAssets)
  }

  const runAIAnalysis = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId)
    if (!asset) return

    setAnalyzingAsset(assetId)
    try {
      const { analysis, cost } = await simulateAIAnalysis(asset, analysisLevel)
      
      setAssets(prev => prev.map(a => {
        if (a.id === assetId && a.description) {
          return {
            ...a,
            description: {
              ...a.description,
              aiAnalysis: analysis,
              metadata: {
                ...a.description.metadata,
                aiAnalysisEnabled: true,
                aiAnalysisCost: cost
              }
            }
          }
        }
        return a
      }))

      // Update parent component
      const updatedAssets = assets.map(a => {
        if (a.id === assetId && a.description) {
          return {
            ...a,
            description: {
              ...a.description,
              aiAnalysis: analysis,
              metadata: {
                ...a.description.metadata,
                aiAnalysisEnabled: true,
                aiAnalysisCost: cost
              }
            }
          }
        }
        return a
      })
      onMediaChange(updatedAssets)
      
    } catch (error) {
      console.error('AI Analysis error:', error)
    } finally {
      setAnalyzingAsset(null)
    }
  }

  const removeAsset = (assetId: string) => {
    const updatedAssets = assets.filter(asset => asset.id !== assetId)
    setAssets(updatedAssets)
    onMediaChange(updatedAssets)
  }

  const addUrlField = () => {
    setUrls(prev => [...prev, ''])
  }

  const removeUrlField = (index: number) => {
    setUrls(prev => prev.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, value: string) => {
    setUrls(prev => prev.map((url, i) => i === index ? value : url))
  }

  const addTag = (assetId: string, tag: string) => {
    const asset = assets.find(a => a.id === assetId)
    if (!asset?.description) return

    const newTags = [...(asset.description.tags || []), tag]
    updateAssetDescription(assetId, { tags: newTags })
  }

  const removeTag = (assetId: string, tagIndex: number) => {
    const asset = assets.find(a => a.id === assetId)
    if (!asset?.description) return

    const newTags = asset.description.tags.filter((_, i) => i !== tagIndex)
    updateAssetDescription(assetId, { tags: newTags })
  }

  const costCalculation = aiAnalysisEnabled ? calculateAnalysisCost(assets, analysisLevel) : null

  return (
    <Card className="glass-card hover-lift transition-smooth border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            📎
          </div>
          Enhanced Media References
        </CardTitle>
        <p className="text-muted-foreground">Upload media with detailed descriptions for better prompts</p>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('upload')}
            className="border-primary/20"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <Button
            variant={activeTab === 'urls' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('urls')}
            className="border-primary/20"
          >
            <Link className="w-4 h-4 mr-2" />
            Media URLs
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div>
              <input
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-smooth"
              />
              {uploading && <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Uploading files...
              </p>}
            </div>
          </div>
        )}

        {activeTab === 'urls' && (
          <div className="space-y-4">
            <div className="space-y-3">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="url"
                    placeholder="Enter media URL (image, video, or audio)"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                  />
                  {urls.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrlField(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={addUrlField} className="border-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Add URL
                </Button>
                <Button 
                  onClick={handleUrlValidation} 
                  disabled={validatingUrls}
                  size="sm"
                >
                  {validatingUrls ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Validating...
                    </div>
                  ) : (
                    'Validate URLs'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Controls */}
        {aiAnalysisEnabled && assets.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold text-purple-400">AI Analysis Options</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground">Analysis Level:</label>
                <select
                  value={analysisLevel}
                  onChange={(e) => setAnalysisLevel(e.target.value as AnalysisLevel)}
                  className="px-3 py-1 bg-secondary/50 border border-primary/20 rounded text-sm"
                >
                  <option value="basic">Basic ($0.002 each)</option>
                  <option value="detailed">Detailed ($0.008 each)</option>
                  <option value="premium">Premium ($0.015 each)</option>
                </select>
              </div>
              {costCalculation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>Total estimated cost: ${costCalculation.totalCost.toFixed(3)} for {assets.length} files</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media Assets with Descriptions */}
        {assets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">Media Assets</h4>
              <Badge variant="secondary">{assets.length}</Badge>
            </div>
            
            {assets.map((asset) => (
              <div key={asset.id} className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      {asset.file_type === 'image' ? '🖼️' : asset.file_type === 'video' ? '🎥' : '🎵'}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{asset.filename}</p>
                      <p className="text-xs text-muted-foreground">{asset.file_type} • {(asset.file_size_bytes / 1024).toFixed(1)}KB</p>
                    </div>
                    {asset.description?.aiAnalysis && (
                      <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        AI Analyzed
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedAsset(expandedAsset === asset.id ? null : asset.id)}
                      className="text-primary"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsset(asset.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {expandedAsset === asset.id && asset.description && (
                  <div className="space-y-4 pt-3 border-t border-primary/10">
                    {/* User Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Your Description</label>
                      <Textarea
                        placeholder="Describe what's in this media and how you want to use it..."
                        value={asset.description.userDescription || ''}
                        onChange={(e) => updateAssetDescription(asset.id, { userDescription: e.target.value })}
                        className="bg-secondary/50 border-primary/20 focus:border-primary/60 min-h-20"
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Category</label>
                      <select
                        value={asset.description.category}
                        onChange={(e) => updateAssetDescription(asset.id, { category: e.target.value as any })}
                        className="w-full p-2 bg-secondary/50 border border-primary/20 rounded focus:border-primary/60"
                      >
                        <option value="general">General</option>
                        <option value="character">Character</option>
                        <option value="environment">Environment</option>
                        <option value="object">Object</option>
                        <option value="style">Style Reference</option>
                        <option value="reference">Reference Material</option>
                      </select>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {asset.description.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="bg-primary/20 text-primary">
                            {tag}
                            <button
                              onClick={() => removeTag(asset.id, index)}
                              className="ml-2 text-primary/70 hover:text-primary"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add tag..."
                          className="bg-secondary/50 border-primary/20 focus:border-primary/60"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              addTag(asset.id, e.currentTarget.value.trim())
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* AI Analysis */}
                    {aiAnalysisEnabled && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">AI Analysis</label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runAIAnalysis(asset.id)}
                            disabled={analyzingAsset === asset.id}
                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                          >
                            {analyzingAsset === asset.id ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                Analyzing...
                              </div>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Run Analysis
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {asset.description.aiAnalysis && (
                          <div className="p-3 bg-gradient-to-r from-purple-500/5 to-purple-500/3 rounded border border-purple-500/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="font-medium text-purple-400 mb-1">Visual Analysis</p>
                                <p className="text-muted-foreground">{asset.description.aiAnalysis.visual.style} • {asset.description.aiAnalysis.visual.mood}</p>
                              </div>
                              <div>
                                <p className="font-medium text-purple-400 mb-1">Best Use</p>
                                <p className="text-muted-foreground">{asset.description.aiAnalysis.recommendations.bestUseCase.join(', ')}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>Confidence: {asset.description.aiAnalysis.confidence}% • Cost: ${asset.description.metadata.aiAnalysisCost?.toFixed(3)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}