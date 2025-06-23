import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Update project details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const body = await request.json()
    const projectId = params.id
    
    // Extract allowed fields for update
    const { start_date, end_date, status } = body
    
    // Validate status if provided
    const allowedStatuses = ['active', 'completed', 'on-hold']
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, completed, on-hold' },
        { status: 400 }
      )
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      
      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date  
    if (status !== undefined) updateData.status = status

    // Update project
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select(`
        id,
        name,
        start_date,
        end_date,
        status,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Error updating project:', updateError)
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: 'Project updated successfully'
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Project update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}