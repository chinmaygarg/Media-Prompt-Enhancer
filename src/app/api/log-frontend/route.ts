import { NextRequest, NextResponse } from 'next/server'
import { logger, LogEntry } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const logEntry: LogEntry = await request.json()
    
    // Write to appropriate log file based on component
    const filename = getLogFilename(logEntry.component)
    logger.log(filename, logEntry)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Frontend Logger] Error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

function getLogFilename(component: string): string {
  switch (component) {
    case 'PromptEnhancer':
      return 'prompt-enhancer.log'
    case 'ContextQuestionsModal':
      return 'modal.log'
    case 'MediaUploadSection':
      return 'media-upload.log'
    default:
      return 'frontend.log'
  }
}

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