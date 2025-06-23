import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(request)

    // Get project with all related financial data
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        client_invoices(*),
        manual_expenses(*),
        invoice_project_assignments(
          *,
          supplier_invoices(*)
        ),
        client_project_associations(
          *,
          clients(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Calculate comprehensive financial data
    const clientInvoices = project.client_invoices || []
    const manualExpenses = project.manual_expenses || []
    const supplierAssignments = project.invoice_project_assignments || []

    // Revenue calculations
    // This code calculates the total revenue and breaks it down by invoice status
    // It uses reduce() to iterate through all client invoices and accumulate totals
    const revenue = clientInvoices.reduce((acc, invoice) => {
      // Add the invoice amount to the overall total
      acc.total += invoice.amount_total

      // Add the amount to the appropriate status bucket
      if (invoice.status === 'paid') acc.paid += invoice.amount_total
      else if (invoice.status === 'pending') acc.pending += invoice.amount_total 
      else if (invoice.status === 'overdue') acc.overdue += invoice.amount_total
      else if (invoice.status === 'draft') acc.draft += invoice.amount_total

      return acc
    }, { 
      total: 0,    // Total revenue across all invoices
      paid: 0,     // Revenue from paid invoices
      pending: 0,  // Revenue from pending invoices
      overdue: 0,  // Revenue from overdue invoices 
      draft: 0     // Revenue from draft invoices
    })

    // Cost calculations
    const manualCosts = manualExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const supplierCosts = supplierAssignments.reduce((sum, assignment) => sum + assignment.amount_assigned, 0)
    const totalCosts = manualCosts + supplierCosts

    // Margin calculations (using only paid revenue)
    const margin = revenue.paid - totalCosts
    const marginPercentage = revenue.paid > 0 ? (margin / revenue.paid) * 100 : 0

    // Process supplier invoices with assignment details
    const processedSupplierInvoices = supplierAssignments.map(assignment => ({
      ...assignment.supplier_invoices,
      assignedAmount: assignment.amount_assigned,
      assignmentStatus: assignment.amount_assigned >= assignment.supplier_invoices.amount_total 
        ? 'fully-assigned' 
        : assignment.amount_assigned > 0 
        ? 'partially-assigned' 
        : 'unassigned',
      confidenceScore: assignment.confidence_score || 0,
      processedDate: assignment.created_at,
      assignmentId: assignment.id
    }))

    // Return enhanced project data
    const enhancedProject = {
      ...project,
      financials: {
        revenue,
        costs: {
          total: totalCosts,
          manual: manualCosts,
          supplier: supplierCosts
        },
        margin: {
          total: margin,
          percentage: marginPercentage
        }
      },
      invoiceStats: {
        client: {
          total: clientInvoices.length,
          paid: clientInvoices.filter(inv => inv.status === 'paid').length,
          pending: clientInvoices.filter(inv => inv.status === 'pending').length,
          overdue: clientInvoices.filter(inv => inv.status === 'overdue').length,
          draft: clientInvoices.filter(inv => inv.status === 'draft').length
        },
        supplier: {
          total: processedSupplierInvoices.length,
          fullyAssigned: processedSupplierInvoices.filter(inv => inv.assignmentStatus === 'fully-assigned').length,
          partiallyAssigned: processedSupplierInvoices.filter(inv => inv.assignmentStatus === 'partially-assigned').length,
          unassigned: processedSupplierInvoices.filter(inv => inv.assignmentStatus === 'unassigned').length
        }
      },
      processedSupplierInvoices
    }

    return NextResponse.json(enhancedProject)

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Project detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(request)

    // Update project
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name: body.name,
        description: body.description,
        client_name: body.clientName,
        currency: body.currency,
        start_date: body.startDate,
        end_date: body.endDate,
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      project,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(request)

    // Soft delete project (mark as archived)
    const { error } = await supabase
      .from('projects')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Project archived successfully'
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Project deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}