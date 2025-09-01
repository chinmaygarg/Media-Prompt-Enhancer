import { NextRequest, NextResponse } from 'next/server'
import { getLLMService } from '@/lib/llm/factory'
import { createServiceSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Test LLM services (automatically chooses real or mock)
    const llmService = await getLLMService()
    const llmHealth = await llmService.healthCheck()
    
    // Test database connection
    const supabase = createServiceSupabase()
    let dbHealth = false
    try {
      const { data } = await supabase
        .from('prompt_templates')
        .select('count(*)')
        .limit(1)
      
      dbHealth = data !== null
    } catch (dbError) {
      console.error('Database health check failed:', dbError)
    }
    
    // Test environment variables
    const envHealth = {
      openai_key: !!process.env.OPENAI_API_KEY,
      google_key: !!process.env.GOOGLE_API_KEY,
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      redis_url: !!process.env.UPSTASH_REDIS_REST_URL,
      redis_token: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    }
    
    const processingTime = Date.now() - startTime
    
    // Overall system health
    const overallHealth = llmHealth.openai || llmHealth.gemini // At least one LLM working
    
    return NextResponse.json(
      {
        status: overallHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        processing_time_ms: processingTime,
        services: {
          llm: {
            openai: llmHealth.openai,
            gemini: llmHealth.gemini,
            at_least_one_working: llmHealth.openai || llmHealth.gemini
          },
          database: {
            connected: dbHealth,
            provider: 'supabase'
          },
          environment: envHealth,
          cache: {
            redis: envHealth.redis_url && envHealth.redis_token
          }
        },
        version: '1.0.0'
      },
      { 
        status: overallHealth ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        services: {
          llm: { openai: false, gemini: false },
          database: { connected: false },
          environment: {},
          cache: { redis: false }
        }
      },
      { status: 503 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}