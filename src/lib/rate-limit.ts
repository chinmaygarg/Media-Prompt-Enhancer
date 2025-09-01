import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 3600 // 1 hour in seconds
): Promise<RateLimitResult> {
  try {
    const key = `rate_limit:${identifier}`
    const now = Date.now()
    const windowStart = now - window * 1000

    // Use Redis sorted set to track requests within the window
    const pipeline = redis.pipeline()
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart)
    
    // Count current requests
    pipeline.zcard(key)
    
    // Add current request
    pipeline.zadd(key, { score: now, member: now })
    
    // Set expiry
    pipeline.expire(key, window)

    const results = await pipeline.exec()
    const requestCount = (results[1] as number) || 0

    const isAllowed = requestCount < limit
    const remaining = Math.max(0, limit - requestCount - 1)
    const resetTime = new Date(now + window * 1000)

    return {
      success: isAllowed,
      limit,
      remaining: isAllowed ? remaining : 0,
      reset: resetTime,
      retryAfter: isAllowed ? undefined : Math.ceil(window),
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow the request if rate limiting is down
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: new Date(Date.now() + window * 1000),
    }
  }
}

// Environment-configurable rate limits with sensible defaults
export const RATE_LIMITS = {
  free: { requests: 10, window: 3600 }, // 10 per hour
  creator: { requests: 50, window: 3600 }, // 50 per hour
  professional: { requests: 200, window: 3600 }, // 200 per hour
  enterprise: { requests: 1000, window: 3600 }, // 1000 per hour
}

// API endpoint rate limit configuration
const API_RATE_LIMITS = {
  analyze: {
    production: parseInt(process.env.RATE_LIMIT_ANALYZE_REQUESTS || '20'),
    development: parseInt(process.env.RATE_LIMIT_ANALYZE_REQUESTS || '200')
  },
  questions: {
    production: parseInt(process.env.RATE_LIMIT_QUESTIONS_REQUESTS || '30'),
    development: parseInt(process.env.RATE_LIMIT_QUESTIONS_REQUESTS || '300')
  },
  enhance: {
    production: parseInt(process.env.RATE_LIMIT_ENHANCE_REQUESTS || '15'),
    development: parseInt(process.env.RATE_LIMIT_ENHANCE_REQUESTS || '150')
  },
  templates: {
    production: parseInt(process.env.RATE_LIMIT_TEMPLATES_REQUESTS || '10'),
    development: parseInt(process.env.RATE_LIMIT_TEMPLATES_REQUESTS || '100')
  }
}

const DEFAULT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '3600') // 1 hour

// Enhanced rate limiting with development mode
export async function developmentRateLimit(
  identifier: string,
  productionLimit: number,
  window: number = DEFAULT_WINDOW
): Promise<RateLimitResult> {
  // In development, use much higher limits
  const isDevelopment = process.env.NODE_ENV === 'development'
  const effectiveLimit = isDevelopment ? productionLimit * 10 : productionLimit // 10x higher in dev
  
  return rateLimit(identifier, effectiveLimit, window)
}

// Configurable rate limiting for specific API endpoints
export async function configurableRateLimit(
  identifier: string,
  endpoint: keyof typeof API_RATE_LIMITS,
  window: number = DEFAULT_WINDOW
): Promise<RateLimitResult> {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const limit = isDevelopment 
    ? API_RATE_LIMITS[endpoint].development
    : API_RATE_LIMITS[endpoint].production
  
  console.log(`[Rate Limit] ${endpoint} endpoint: ${limit} requests/${window}s (${isDevelopment ? 'development' : 'production'} mode)`)
  
  return rateLimit(identifier, limit, window)
}