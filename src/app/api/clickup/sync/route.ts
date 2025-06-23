import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createClickUpClient, ProjectSyncService } from '@/lib/clickup/client'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)

    const body = await request.json()
    const { action, project_id } = body

    // Create ClickUp client
    const clickupClient = await createClickUpClient()
    if (!clickupClient) {
      return NextResponse.json(
        { error: 'ClickUp integration not configured' },
        { status: 400 }
      )
    }

    const syncService = new ProjectSyncService(clickupClient)

    if (action === 'sync_project' && project_id) {
      // Sync single project
      const { data: project, error } = await (await import('@/lib/supabase/server')).createClient()
        .from('projects')
        .select(`
          id,
          name,
          description,
          clickup_task_id,
          sync_enabled,
          client_invoices(amount_total, status),
          manual_expenses(amount),
          invoice_project_assignments(amount_assigned)
        `)
        .eq('id', project_id)
        .single()

      if (error || !project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      // Calculate financial data
      const revenue = (project.client_invoices || []).reduce((sum: number, inv: any) => 
        inv.status === 'paid' ? sum + inv.amount_total : sum, 0
      )
      const costs = (project.manual_expenses || []).reduce((sum: number, exp: any) => 
        sum + exp.amount, 0
      ) + (project.invoice_project_assignments || []).reduce((sum: number, assign: any) => 
        sum + assign.amount_assigned, 0
      )
      const margin = revenue - costs
      const marginPercentage = revenue > 0 ? (margin / revenue) * 100 : 0

      const syncData = {
        project_id: project.id,
        project_name: project.name,
        project_description: project.description,
        clickup_task_id: project.clickup_task_id,
        sync_enabled: project.sync_enabled,
        financial_data: {
          revenue,
          costs,
          margin,
          margin_percentage: marginPercentage
        }
      }

      const result = await syncService.syncProjectToClickUp(syncData)

      return NextResponse.json({
        action: 'sync_project',
        project_id,
        ...result
      })

    } else if (action === 'sync_all') {
      // Sync all projects
      const result = await syncService.syncAllProjects()

      return NextResponse.json({
        action: 'sync_all',
        ...result
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing parameters' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('ClickUp sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}