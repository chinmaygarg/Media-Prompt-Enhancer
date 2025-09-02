import { NextRequest, NextResponse } from 'next/server'
import { localFileService } from '@/lib/storage/local'

export interface UrlReferenceRequest {
  urls: string[]
  session_id?: string
}

export interface UrlReferenceResponse {
  success: boolean
  data?: {
    validated_urls: Array<{
      id: string
      url: string
      type: string
      valid: boolean
      error?: string
    }>
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [URL Reference API] POST request received')
    
    const body = await request.json() as UrlReferenceRequest
    const { urls, session_id } = body
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No URLs provided' },
        { status: 400 }
      )
    }

    const validatedUrls = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const validation = localFileService.validateUrl(url)
      
      validatedUrls.push({
        id: `url_${session_id || 'temp'}_${i}`,
        url: url.trim(),
        type: validation.type || 'unknown',
        valid: validation.valid,
        error: validation.error
      })
    }

    const response: UrlReferenceResponse = {
      success: true,
      data: {
        validated_urls: validatedUrls
      }
    }

    console.log('✅ [URL Reference API] URLs validated:', validatedUrls.length)
    return NextResponse.json(response)

  } catch (error) {
    console.error('URL Reference API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `URL validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}