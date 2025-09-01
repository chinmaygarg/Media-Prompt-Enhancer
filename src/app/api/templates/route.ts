import { NextRequest, NextResponse } from 'next/server'
import { templateManager } from '@/lib/templates'
import { promptTemplateSchema } from '@/lib/validation'
import { configurableRateLimit } from '@/lib/rate-limit'

// GET - Fetch all active templates or a specific template type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type')

    if (templateType) {
      // Get specific template type
      const template = await templateManager.getTemplate(templateType)
      
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: template
      })
    } else {
      // Get all templates
      const templates = await templateManager.getAllTemplates()
      
      return NextResponse.json({
        success: true,
        data: templates,
        count: templates.length
      })
    }

  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Create a new template (admin only)
export async function POST(request: NextRequest) {
  try {
    // Apply configurable rate limiting for template creation
    const identifier = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await configurableRateLimit(`admin:${identifier}`, 'templates')
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = promptTemplateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid template format',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const templateData = validationResult.data

    // Create the template
    const newTemplate = await templateManager.createTemplate(templateData)
    
    if (!newTemplate) {
      return NextResponse.json(
        { success: false, error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: newTemplate,
        message: 'Template created successfully'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}