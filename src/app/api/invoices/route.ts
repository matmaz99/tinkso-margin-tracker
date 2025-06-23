import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ClientInvoice, SupplierInvoice, Project, Client } from '@/lib/supabase/types'

// Combined invoice interface for the API response
export interface InvoiceWithDetails {
  id: string
  invoiceNumber: string
  type: 'client' | 'supplier'
  projectName?: string
  clientSupplierName: string
  amount: number
  currency: string
  status: string
  issueDate: string
  dueDate?: string
  paidDate?: string
  description?: string
  documentUrl?: string
  isAutoDetected?: boolean
  vatAmount?: number
  netAmount: number
  projectId?: string
  clientId?: string
  qontoId?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStatistics = searchParams.get('includeStatistics') === 'true'
    const typeFilter = searchParams.get('type') // 'client', 'supplier', or null for all
    const statusFilter = searchParams.get('status') // 'paid', 'pending', 'overdue', 'draft'
    const projectId = searchParams.get('projectId') // Filter by specific project

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch both client and supplier invoices
    let clientInvoicesQuery = supabase
      .from('client_invoices')
      .select(`
        *,
        clients (
          id,
          name
        ),
        projects (
          id,
          name
        )
      `)

    let supplierInvoicesQuery = supabase
      .from('supplier_invoices')
      .select(`
        *,
        invoice_project_assignments (
          amount_assigned,
          projects (
            id,
            name
          )
        )
      `)

    // Apply project filter if specified
    if (projectId) {
      clientInvoicesQuery = clientInvoicesQuery.eq('project_id', projectId)
      supplierInvoicesQuery = supplierInvoicesQuery.eq(
        'invoice_project_assignments.project_id', 
        projectId
      )
    }

    // Apply status filter if specified
    if (statusFilter) {
      clientInvoicesQuery = clientInvoicesQuery.eq('status', statusFilter)
      supplierInvoicesQuery = supplierInvoicesQuery.eq('status', statusFilter)
    }

    // Execute queries
    const [clientInvoicesResult, supplierInvoicesResult] = await Promise.all([
      typeFilter !== 'supplier' ? clientInvoicesQuery : Promise.resolve({ data: [], error: null }),
      typeFilter !== 'client' ? supplierInvoicesQuery : Promise.resolve({ data: [], error: null })
    ])

    if (clientInvoicesResult.error) {
      console.error('Error fetching client invoices:', clientInvoicesResult.error)
      throw new Error('Failed to fetch client invoices')
    }

    if (supplierInvoicesResult.error) {
      console.error('Error fetching supplier invoices:', supplierInvoicesResult.error)
      throw new Error('Failed to fetch supplier invoices')
    }

    // Transform client invoices
    const clientInvoices: InvoiceWithDetails[] = (clientInvoicesResult.data || []).map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      type: 'client' as const,
      projectName: invoice.projects?.name,
      clientSupplierName: invoice.clients?.name || 'Unknown Client',
      amount: invoice.amount_total,
      currency: invoice.currency,
      status: invoice.status || 'draft',
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      paidDate: invoice.paid_date,
      description: invoice.description,
      documentUrl: invoice.pdf_url,
      isAutoDetected: invoice.is_auto_detected || false,
      vatAmount: invoice.amount_vat,
      netAmount: invoice.amount_net,
      projectId: invoice.project_id,
      clientId: invoice.client_id,
      qontoId: invoice.qonto_id
    }))

    // Transform supplier invoices
    const supplierInvoices: InvoiceWithDetails[] = (supplierInvoicesResult.data || []).map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: `SUP-${invoice.id.slice(0, 8)}`, // Generate invoice number from ID
      type: 'supplier' as const,
      projectName: invoice.invoice_project_assignments?.[0]?.projects?.name,
      clientSupplierName: invoice.supplier_name || 'Unknown Supplier',
      amount: invoice.amount_total,
      currency: invoice.currency,
      status: invoice.status || 'pending',
      issueDate: invoice.invoice_date,
      dueDate: invoice.invoice_date, // Supplier invoices typically don't have due dates
      paidDate: invoice.status === 'paid' ? invoice.updated_at : null,
      description: invoice.description,
      documentUrl: invoice.pdf_url,
      isAutoDetected: true, // Supplier invoices are typically auto-detected
      vatAmount: invoice.amount_vat,
      netAmount: invoice.amount_net || invoice.amount_total,
      projectId: invoice.invoice_project_assignments?.[0]?.projects?.id,
      qontoId: invoice.qonto_id
    }))

    // Combine and sort invoices by issue date (newest first)
    const allInvoices = [...clientInvoices, ...supplierInvoices]
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())

    // Calculate statistics if requested
    let statistics = {}
    if (includeStatistics) {
      const clientInvoiceStats = {
        total: clientInvoices.length,
        paid: clientInvoices.filter(inv => inv.status === 'paid').length,
        pending: clientInvoices.filter(inv => inv.status === 'pending').length,
        overdue: clientInvoices.filter(inv => inv.status === 'overdue').length,
        draft: clientInvoices.filter(inv => inv.status === 'draft').length,
        totalRevenue: clientInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0),
        pendingRevenue: clientInvoices
          .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
          .reduce((sum, inv) => sum + inv.amount, 0)
      }

      const supplierInvoiceStats = {
        total: supplierInvoices.length,
        assigned: supplierInvoices.filter(inv => inv.projectId).length,
        unassigned: supplierInvoices.filter(inv => !inv.projectId).length,
        totalCosts: supplierInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0),
        pendingCosts: supplierInvoices
          .filter(inv => inv.status === 'pending')
          .reduce((sum, inv) => sum + inv.amount, 0)
      }

      statistics = {
        client: clientInvoiceStats,
        supplier: supplierInvoiceStats,
        combined: {
          total: allInvoices.length,
          totalAmount: clientInvoiceStats.totalRevenue + supplierInvoiceStats.totalCosts,
          netMargin: clientInvoiceStats.totalRevenue - supplierInvoiceStats.totalCosts
        }
      }
    }

    const response = {
      invoices: allInvoices,
      total: allInvoices.length,
      filters: {
        type: typeFilter || 'all',
        status: statusFilter || 'all',
        projectId: projectId || null
      },
      ...(includeStatistics && { statistics }),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Invoices API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch invoices'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, ...invoiceData } = body

    let result
    if (type === 'client') {
      // Create client invoice
      result = await supabase
        .from('client_invoices')
        .insert({
          invoice_number: invoiceData.invoiceNumber,
          client_id: invoiceData.clientId,
          project_id: invoiceData.projectId,
          amount_total: invoiceData.amount,
          amount_net: invoiceData.netAmount || invoiceData.amount,
          amount_vat: invoiceData.vatAmount || 0,
          currency: invoiceData.currency || 'EUR',
          status: invoiceData.status || 'draft',
          issue_date: invoiceData.issueDate,
          due_date: invoiceData.dueDate,
          description: invoiceData.description,
          pdf_url: invoiceData.documentUrl
        })
        .select()
        .single()
    } else if (type === 'supplier') {
      // Create supplier invoice
      result = await supabase
        .from('supplier_invoices')
        .insert({
          supplier_name: invoiceData.supplierName,
          amount_total: invoiceData.amount,
          amount_net: invoiceData.netAmount || invoiceData.amount,
          amount_vat: invoiceData.vatAmount || 0,
          currency: invoiceData.currency || 'EUR',
          status: invoiceData.status || 'pending',
          invoice_date: invoiceData.issueDate,
          description: invoiceData.description,
          pdf_url: invoiceData.documentUrl
        })
        .select()
        .single()
    } else {
      return NextResponse.json(
        { error: 'Invalid invoice type. Must be "client" or "supplier"' },
        { status: 400 }
      )
    }

    if (result.error) {
      console.error('Error creating invoice:', result.error)
      throw new Error('Failed to create invoice')
    }

    return NextResponse.json({
      success: true,
      invoice: result.data,
      message: `${type} invoice created successfully`
    })

  } catch (error: any) {
    console.error('Invoice creation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create invoice'
      },
      { status: 500 }
    )
  }
}