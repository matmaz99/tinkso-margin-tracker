import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)

    const supabase = createServerClient(request)
    const url = new URL(request.url)
    const includeFinancials = url.searchParams.get('includeFinancials') === 'true'

    let query = supabase
      .from('projects')
      .select(`
        *,
        client_project_associations(
          clients(name, email, currency)
        )
      `)

    // Include financial data if requested
    if (includeFinancials) {
      query = supabase
        .from('projects')
        .select(`
          *,
          client_invoices(*),
          manual_expenses(*),
          invoice_project_assignments(
            amount_assigned,
            supplier_invoices(amount_total, currency)
          ),
          client_project_associations(
            clients(name, email, currency)
          )
        `)
    }

    const { data: projects, error } = await query
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 400 }
      )
    }

    // Calculate financials if requested
    const processedProjects = includeFinancials ? projects?.map(project => {
      // Calculate revenue from client invoices
      const revenue = (project.client_invoices || []).reduce((acc: any, invoice: any) => {
        acc.total += invoice.amount_total
        if (invoice.status === 'paid') acc.paid += invoice.amount_total
        else if (invoice.status === 'pending') acc.pending += invoice.amount_total
        else if (invoice.status === 'overdue') acc.overdue += invoice.amount_total
        return acc
      }, { total: 0, paid: 0, pending: 0, overdue: 0 })

      // Calculate costs
      const manualCosts = (project.manual_expenses || []).reduce((sum: number, expense: any) => 
        sum + expense.amount, 0
      )
      
      const supplierCosts = (project.invoice_project_assignments || []).reduce((sum: number, assignment: any) =>
        sum + (assignment.amount_assigned || 0), 0
      )

      const totalCosts = manualCosts + supplierCosts
      const margin = revenue.paid - totalCosts
      const marginPercentage = revenue.paid > 0 ? (margin / revenue.paid) * 100 : 0

      return {
        ...project,
        financials: {
          revenue,
          costs: { total: totalCosts, manual: manualCosts, supplier: supplierCosts },
          margin: { total: margin, percentage: marginPercentage }
        }
      }
    }) : projects

    return NextResponse.json({
      projects: processedProjects || [],
      count: processedProjects?.length || 0
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Projects API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await authMiddleware.requireAuth(request)
    
    const body = await request.json()
    const { name, description, clientName, currency, startDate, endDate } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(request)

    // Create new project
    const { data: project, error } = await supabase
      .from('projects')
      .insert([{
        name,
        description: description || null,
        client_name: clientName || null,
        currency: currency || 'EUR',
        start_date: startDate || null,
        end_date: endDate || null,
        status: 'active'
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      project,
      message: 'Project created successfully'
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}