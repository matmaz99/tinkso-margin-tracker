import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Debug endpoint to check line items
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const supabase = await createClient()

    // Get recent client invoices with their line items
    const { data: invoices, error: invoicesError } = await supabase
      .from('client_invoices')
      .select(`
        id,
        invoice_number,
        qonto_id,
        attachment_id,
        amount_total,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (invoicesError) {
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    // Get line items for these invoices
    const invoiceIds = invoices?.map(inv => inv.id) || []
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('client_invoice_line_items')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('created_at', { ascending: false })

    if (lineItemsError) {
      console.error('Line items error:', lineItemsError)
    }

    // Group line items by invoice
    const invoicesWithLineItems = invoices?.map(invoice => ({
      ...invoice,
      line_items: lineItems?.filter(item => item.invoice_id === invoice.id) || []
    }))

    return NextResponse.json({
      success: true,
      invoices: invoicesWithLineItems,
      total_line_items: lineItems?.length || 0
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}