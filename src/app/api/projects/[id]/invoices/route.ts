import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Get client invoices for a specific project with line items
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const projectId = params.id
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch client invoices for this project
    const { data: invoices, error: invoicesError } = await supabase
      .from('client_invoices')
      .select(`
        id,
        invoice_number,
        qonto_id,
        attachment_id,
        pdf_url,
        client_id,
        project_id,
        amount_total,
        amount_net,
        amount_vat,
        currency,
        status,
        issue_date,
        due_date,
        paid_date,
        description,
        is_auto_detected,
        created_at
      `)
      .eq('project_id', projectId)
      .order('issue_date', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    // Fetch line items for all invoices
    const invoiceIds = invoices?.map(inv => inv.id) || []
    let lineItemsData: any[] = []
    
    if (invoiceIds.length > 0) {
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('client_invoice_line_items')
        .select(`
          id,
          invoice_id,
          qonto_line_item_id,
          description,
          quantity,
          unit_price,
          total_amount,
          vat_rate,
          vat_amount
        `)
        .in('invoice_id', invoiceIds)
        .order('created_at', { ascending: true })

      if (lineItemsError) {
        console.error('Error fetching line items:', lineItemsError)
        // Don't fail the request, just log the error
      } else {
        lineItemsData = lineItems || []
      }
    }

    // Group line items by invoice
    const invoicesWithLineItems = invoices?.map(invoice => ({
      ...invoice,
      line_items: lineItemsData.filter(item => item.invoice_id === invoice.id)
    })) || []

    // Calculate summary statistics
    const totalAmount = invoicesWithLineItems.reduce((sum, inv) => sum + (inv.amount_total || 0), 0)
    const paidAmount = invoicesWithLineItems
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount_total || 0), 0)
    const pendingAmount = totalAmount - paidAmount

    const summary = {
      total_invoices: invoicesWithLineItems.length,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      currency: invoicesWithLineItems[0]?.currency || 'EUR'
    }

    return NextResponse.json({
      success: true,
      invoices: invoicesWithLineItems,
      summary
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Project invoices API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}