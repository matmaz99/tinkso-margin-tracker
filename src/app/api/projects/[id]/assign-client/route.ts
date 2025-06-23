import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Assign client to project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const { clientId } = await request.json()
    const projectId = params.id
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update project with client assignment
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        client_name: client.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select(`
        id,
        name,
        client_name,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Error updating project:', updateError)
      return NextResponse.json(
        { error: 'Failed to assign client to project' },
        { status: 500 }
      )
    }

    // Create client-project association
    const { error: associationError } = await supabase
      .from('client_project_associations')
      .upsert({
        client_id: clientId,
        project_id: projectId,
        role: 'primary',
      }, {
        onConflict: 'client_id,project_id'
      })

    if (associationError) {
      console.error('Error creating client-project association:', associationError)
      // Don't fail the request - association is nice to have but not critical
    }

    // Automatically link all existing client invoices to this project
    const { data: clientInvoices, error: invoicesError } = await supabase
      .from('client_invoices')
      .update({ project_id: projectId })
      .eq('client_id', clientId)
      .is('project_id', null) // Only update unassigned invoices
      .select('id, invoice_number, amount_total')

    let linkedInvoicesCount = 0
    if (clientInvoices && !invoicesError) {
      linkedInvoicesCount = clientInvoices.length
      console.log(`Automatically linked ${linkedInvoicesCount} client invoices to project ${projectId}`)
    } else if (invoicesError) {
      console.error('Error linking client invoices to project:', invoicesError)
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      client: client,
      linked_invoices: linkedInvoicesCount,
      message: `Client "${client.name}" assigned to project successfully${linkedInvoicesCount > 0 ? ` and ${linkedInvoicesCount} client invoices automatically linked` : ''}`
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Client assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove client assignment from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const projectId = params.id
    const supabase = await createClient()

    // Remove client assignment
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        client_name: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select(`
        id,
        name,
        client_name,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Error removing client assignment:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove client assignment' },
        { status: 500 }
      )
    }

    // Get the current client name before removing assignment (for unlinking invoices)
    const { data: currentProject } = await supabase
      .from('projects')
      .select('client_name')
      .eq('id', projectId)
      .single()

    // Find the client ID by name to unlink invoices
    let unlinkedInvoicesCount = 0
    if (currentProject?.client_name) {
      const { data: currentClient } = await supabase
        .from('clients')
        .select('id')
        .eq('name', currentProject.client_name)
        .single()

      if (currentClient) {
        // Unlink client invoices from this project
        const { data: unlinkedInvoices, error: unlinkError } = await supabase
          .from('client_invoices')
          .update({ project_id: null })
          .eq('client_id', currentClient.id)
          .eq('project_id', projectId)
          .select('id, invoice_number')

        if (unlinkedInvoices && !unlinkError) {
          unlinkedInvoicesCount = unlinkedInvoices.length
          console.log(`Automatically unlinked ${unlinkedInvoicesCount} client invoices from project ${projectId}`)
        } else if (unlinkError) {
          console.error('Error unlinking client invoices from project:', unlinkError)
        }
      }
    }

    // Remove client-project association
    const { error: associationError } = await supabase
      .from('client_project_associations')
      .delete()
      .eq('project_id', projectId)

    if (associationError) {
      console.error('Error removing client-project association:', associationError)
      // Don't fail the request - association removal is nice to have but not critical
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      unlinked_invoices: unlinkedInvoicesCount,
      message: `Client assignment removed successfully${unlinkedInvoicesCount > 0 ? ` and ${unlinkedInvoicesCount} client invoices unlinked` : ''}`
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Client assignment removal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}