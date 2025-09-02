'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Link, X, Image, Video, Music, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export interface MediaAsset {
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
  source: 'upload' | 'url'
  url?: string
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}

interface MediaUploadSectionProps {
  outputType: string
  mediaAssets: MediaAsset[]
  onMediaAssetsChange: (assets: MediaAsset[]) => void
  maxFiles?: number
}

export default function MediaUploadSection({ 
  outputType, 
  mediaAssets, 
  onMediaAssetsChange,
  maxFiles = 5
}: MediaUploadSectionProps) {
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if media input is required/supported for current output type
  const isMediaRequired = outputType.includes('image-text-to-')
  const isMediaSupported = outputType.includes('image-text-to-') || outputType === 'text-to-video' || outputType === 'text-to-video-audio'
  
  // Don't show section if media is not supported
  if (!isMediaSupported) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFileUpload(files)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (mediaAssets.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']
    const validFiles = files.filter(file => supportedTypes.includes(file.type))
    
    if (validFiles.length !== files.length) {
      alert('Some files have unsupported formats')
    }

    // Create pending assets
    const newAssets: MediaAsset[] = validFiles.map(file => ({
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      file_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
      storage_path: '',
      mime_type: file.type,
      file_size_bytes: file.size,
      source: 'upload',
      uploadStatus: 'uploading',
      description: {
        userDescription: '',
        tags: [],
        category: 'general'
      }
    }))

    onMediaAssetsChange([...mediaAssets, ...newAssets])

    // Upload files
    const formData = new FormData()
    validFiles.forEach(file => formData.append('files', file))
    formData.append('session_id', `session_${Date.now()}`)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success && result.data?.uploaded_assets) {
        // Update assets with successful upload data
        const updatedAssets = mediaAssets.filter(asset => asset.uploadStatus !== 'uploading').concat(
          result.data.uploaded_assets.map((uploadedAsset: any) => ({
            ...uploadedAsset,
            source: 'upload',
            uploadStatus: 'success',
            description: {
              userDescription: '',
              tags: [],
              category: 'general'
            }
          }))
        )
        onMediaAssetsChange(updatedAssets)
      } else {
        // Mark failed uploads
        const failedAssets = newAssets.map(asset => ({
          ...asset,
          uploadStatus: 'error' as const,
          errorMessage: result.error || 'Upload failed'
        }))
        onMediaAssetsChange([...mediaAssets.filter(asset => asset.uploadStatus !== 'uploading'), ...failedAssets])
      }
    } catch (error) {
      console.error('Upload error:', error)
      const failedAssets = newAssets.map(asset => ({
        ...asset,
        uploadStatus: 'error' as const,
        errorMessage: 'Network error'
      }))
      onMediaAssetsChange([...mediaAssets.filter(asset => asset.uploadStatus !== 'uploading'), ...failedAssets])
    }
  }

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return
    
    if (mediaAssets.length >= maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newAsset: MediaAsset = {
      id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: urlInput.split('/').pop()?.split('?')[0] || 'URL Asset',
      file_type: 'image', // Default to image for URLs
      storage_path: urlInput,
      mime_type: 'image/jpeg', // Default
      file_size_bytes: 0,
      source: 'url',
      url: urlInput,
      uploadStatus: 'success',
      description: {
        userDescription: '',
        tags: [],
        category: 'reference'
      }
    }

    onMediaAssetsChange([...mediaAssets, newAsset])
    setUrlInput('')
    setShowUrlInput(false)
  }

  const removeAsset = (assetId: string) => {
    onMediaAssetsChange(mediaAssets.filter(asset => asset.id !== assetId))
  }

  const updateAssetDescription = (assetId: string, field: string, value: any) => {
    onMediaAssetsChange(
      mediaAssets.map(asset =>
        asset.id === assetId
          ? {
              ...asset,
              description: {
                ...asset.description!,
                [field]: value
              }
            }
          : asset
      )
    )
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <Image className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Music className="w-4 h-4" />
      default: return <Image className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'uploading': return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return null
    }
  }

  return (
    <Card className="glass-card hover-lift transition-smooth border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            🖼️
          </div>
          Reference Media
          {isMediaRequired && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
              Required
            </span>
          )}
        </CardTitle>
        <p className="text-muted-foreground">
          {isMediaRequired 
            ? `Upload up to ${maxFiles} images/videos that this model will use as reference for generation`
            : `Optionally add up to ${maxFiles} reference images/videos to guide the generation`
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-primary/30 hover:border-primary/60'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Drop files here or click to upload</h3>
              <p className="text-sm text-muted-foreground">
                Supports: Images (JPG, PNG, WebP, GIF), Videos (MP4, WebM), Audio (MP3, WAV)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {maxFiles} files • {mediaAssets.length}/{maxFiles} used
              </p>
            </div>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              <Link className="w-4 h-4 mr-2" />
              Add from URL
            </Button>
          </div>
          
          {showUrlInput && (
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-secondary/50 border-primary/20 focus:border-primary/60"
              />
              <Button 
                onClick={handleUrlAdd}
                disabled={!urlInput.trim()}
                className="bg-primary/20 hover:bg-primary/30 text-primary"
              >
                Add
              </Button>
            </div>
          )}
        </div>

        {/* Media Assets List */}
        {mediaAssets.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Uploaded Media ({mediaAssets.length})
            </h4>
            
            <div className="space-y-4">
              {mediaAssets.map((asset, index) => (
                <div key={asset.id} className="p-4 bg-secondary/20 rounded-lg border border-primary/10 space-y-4">
                  
                  {/* Asset Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(asset.file_type)}
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {asset.filename}
                          {getStatusIcon(asset.uploadStatus)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {asset.source === 'url' ? 'From URL' : `${(asset.file_size_bytes / 1024 / 1024).toFixed(2)} MB`}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsset(asset.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Error Message */}
                  {asset.uploadStatus === 'error' && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                      {asset.errorMessage || 'Upload failed'}
                    </div>
                  )}

                  {/* Asset Configuration */}
                  {asset.uploadStatus === 'success' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* User Description */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Description (What should this be used for?)
                        </label>
                        <Textarea
                          placeholder="Describe what this image shows and how it should influence the generation..."
                          value={asset.description?.userDescription || ''}
                          onChange={(e) => updateAssetDescription(asset.id, 'userDescription', e.target.value)}
                          className="min-h-20 bg-secondary/50 border-primary/20 focus:border-primary/60 text-sm"
                        />
                      </div>

                      {/* Category Selection */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Category</label>
                          <select
                            value={asset.description?.category || 'general'}
                            onChange={(e) => updateAssetDescription(asset.id, 'category', e.target.value)}
                            className="w-full p-2 text-sm bg-secondary/50 border border-primary/20 rounded focus:border-primary/60"
                          >
                            <option value="character">Character Reference</option>
                            <option value="environment">Environment/Setting</option>
                            <option value="object">Object/Product</option>
                            <option value="style">Style Reference</option>
                            <option value="reference">General Reference</option>
                            <option value="general">General</option>
                          </select>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Tags</label>
                          <Input
                            placeholder="style, mood, colors, etc. (comma separated)"
                            value={asset.description?.tags?.join(', ') || ''}
                            onChange={(e) => updateAssetDescription(
                              asset.id, 
                              'tags', 
                              e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                            )}
                            className="bg-secondary/50 border-primary/20 focus:border-primary/60 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Requirements Notice */}
        {isMediaRequired && mediaAssets.length === 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-400">Media Required</h4>
                <p className="text-sm text-amber-400/80 mt-1">
                  The selected output type "{outputType}" requires at least one image or video as reference material.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="font-medium text-blue-400 mb-2">💡 Tips for Better Results</h4>
          <ul className="text-sm text-blue-400/80 space-y-1">
            <li>• <strong>Character Reference:</strong> Clear, well-lit photos work best</li>
            <li>• <strong>Environment:</strong> Include contextual details in descriptions</li>
            <li>• <strong>Style Reference:</strong> Describe the visual style you want to copy</li>
            <li>• <strong>Quality:</strong> Higher resolution images (1024px+) give better results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}