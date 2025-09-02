'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Link, X, Plus } from 'lucide-react'

interface MediaAsset {
  id: string
  filename: string
  file_type: 'image' | 'video' | 'audio'
  storage_path: string
  mime_type: string
  file_size_bytes: number
}

interface MediaInputProps {
  onMediaChange: (assets: MediaAsset[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export default function MediaInput({ 
  onMediaChange, 
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*', 'audio/*']
}: MediaInputProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'urls'>('upload')
  const [uploading, setUploading] = useState(false)
  const [validatingUrls, setValidatingUrls] = useState(false)
  const [urls, setUrls] = useState<string[]>([''])
  const [uploadedAssets, setUploadedAssets] = useState<MediaAsset[]>([])
  const [urlAssets, setUrlAssets] = useState<any[]>([])

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
        const newAssets = result.data.uploaded_assets
        setUploadedAssets(prev => [...prev, ...newAssets])
        onMediaChange([...uploadedAssets, ...newAssets])
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
        setUrlAssets(result.data.validated_urls)
        // Convert URL assets to MediaAsset format for consistency
        const urlMediaAssets: MediaAsset[] = result.data.validated_urls
          .filter((asset: any) => asset.valid)
          .map((asset: any) => ({
            id: asset.id,
            filename: asset.url.split('/').pop() || 'url-asset',
            file_type: (asset.type === 'image' ? 'image' : asset.type === 'video' ? 'video' : 'audio') as 'image' | 'video' | 'audio',
            storage_path: asset.url,
            mime_type: `${asset.type}/*`,
            file_size_bytes: 0
          }))
        
        onMediaChange([...uploadedAssets, ...urlMediaAssets])
      }
    } catch (error) {
      console.error('URL validation error:', error)
    } finally {
      setValidatingUrls(false)
    }
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

  const removeAsset = (assetId: string, type: 'upload' | 'url') => {
    if (type === 'upload') {
      setUploadedAssets(prev => prev.filter(asset => asset.id !== assetId))
    } else {
      setUrlAssets(prev => prev.filter(asset => asset.id !== assetId))
    }
    // Update parent component
    const remainingUploaded = uploadedAssets.filter(asset => asset.id !== assetId)
    const remainingUrls = urlAssets.filter(asset => asset.id !== assetId)
    const urlMediaAssets = remainingUrls
      .filter((asset: any) => asset.valid)
      .map((asset: any) => ({
        id: asset.id,
        filename: asset.url.split('/').pop() || 'url-asset',
        file_type: (asset.type === 'image' ? 'image' : asset.type === 'video' ? 'video' : 'audio') as 'image' | 'video' | 'audio',
        storage_path: asset.url,
        mime_type: `${asset.type}/*`,
        file_size_bytes: 0
      }))
    onMediaChange([...remainingUploaded, ...urlMediaAssets])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reference Media</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <Button
            variant={activeTab === 'urls' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('urls')}
          >
            <Link className="w-4 h-4 mr-2" />
            Media URLs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div>
              <input
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
            </div>
            
            {uploadedAssets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Uploaded Files:</h4>
                {uploadedAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {asset.filename} ({asset.file_type})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsset(asset.id, 'upload')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'urls' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="url"
                    placeholder="Enter media URL (image, video, or audio)"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                  />
                  {urls.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrlField(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={addUrlField}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add URL
                </Button>
                <Button 
                  onClick={handleUrlValidation} 
                  disabled={validatingUrls}
                  size="sm"
                >
                  {validatingUrls ? 'Validating...' : 'Validate URLs'}
                </Button>
              </div>
            </div>

            {urlAssets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">URL Validation Results:</h4>
                {urlAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {asset.valid ? '✅' : '❌'} {asset.type || 'unknown'}
                      </span>
                      <p className="text-xs text-gray-600 truncate">{asset.url}</p>
                      {asset.error && <p className="text-xs text-red-600">{asset.error}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsset(asset.id, 'url')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}