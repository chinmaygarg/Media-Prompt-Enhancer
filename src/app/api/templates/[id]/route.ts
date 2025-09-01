import { NextRequest, NextResponse } from 'next/server'
import { templateManager } from '@/lib/templates'
import { promptTemplateSchema } from '@/lib/validation'

// PUT - Update a specific template (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id

    // Parse and validate request body
    const body = await request.json()
    const updates = promptTemplateSchema.partial().safeParse(body)
    
    if (!updates.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid update format',
          details: updates.error.errors
        },
        { status: 400 }
      )
    }

    // Update the template
    const updatedTemplate = await templateManager.updateTemplate(
      templateId, 
      updates.data
    )
    
    if (!updatedTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    })

  } catch (error) {
    console.error('Template UPDATE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE - Deactivate a template (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id

    // Deactivate the template (don't actually delete)
    const success = await templateManager.deactivateTemplate(templateId)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Template not found or deactivation failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template deactivated successfully'
    })

  } catch (error) {
    console.error('Template DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate template' },
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
        'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}