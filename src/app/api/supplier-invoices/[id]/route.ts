import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Individual supplier invoice interface for the API response
export interface SupplierInvoiceWithDetails {
  id: string
  qontoId?: string
  supplierName: string
  supplierIban?: string
  amountTotal: number
  amountNet?: number
  amountVat?: number
  currency: string
  invoiceDate: string
  processingDate: string
  description?: string
  pdfUrl?: string
  attachmentId?: string
  qontoTransactionId?: string
  status: string
  isProcessed: boolean
  created_at: string
  updated_at: string
  // AI processing data
  aiExtraction?: {
    confidence: number
    projectMatches: {
      projectName: string
      confidence: number
      keywords: string[]
      reasoning?: string
    }[]
    extractedText?: string
    processingStatus?: string
  }
  // Project assignments
  assignments?: {
    id: string
    projectId: string
    projectName: string
    amountAssigned: number
    percentage?: number
    assignmentType: string
    assignedBy?: string
    assignedAt: string
  }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAI = searchParams.get('includeAI') === 'true'
    const includeAssignments = searchParams.get('includeAssignments') === 'true'

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const invoiceId = id

    // Fetch the main supplier invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError) {
      if (invoiceError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching supplier invoice:', invoiceError)
      throw new Error('Failed to fetch supplier invoice')
    }

    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Transform to our interface
    let invoice: SupplierInvoiceWithDetails = {
      id: invoiceData.id,
      qontoId: invoiceData.qonto_id,
      supplierName: invoiceData.supplier_name,
      supplierIban: invoiceData.supplier_iban,
      amountTotal: invoiceData.amount_total,
      amountNet: invoiceData.amount_net,
      amountVat: invoiceData.amount_vat,
      currency: invoiceData.currency,
      invoiceDate: invoiceData.invoice_date,
      processingDate: invoiceData.processing_date,
      description: invoiceData.description,
      pdfUrl: invoiceData.pdf_url,
      attachmentId: invoiceData.attachment_id,
      qontoTransactionId: invoiceData.qonto_transaction_id,
      status: invoiceData.status,
      isProcessed: invoiceData.is_processed,
      created_at: invoiceData.created_at,
      updated_at: invoiceData.updated_at
    }

    // Fetch AI Vision processing results if requested
    if (includeAI) {
      const { data: aiData, error: aiError } = await supabase
        .from('ai_processing_results')
        .select('*')
        .eq('supplier_invoice_id', invoiceId)
        .eq('processing_type', 'vision_project_matching')
        .order('processed_at', { ascending: false })
        .limit(1)

      if (!aiError && aiData && aiData.length > 0) {
        const aiResult = aiData[0]
        invoice.aiExtraction = {
          confidence: aiResult.confidence_score || 0,
          projectMatches: aiResult.project_matches || [],
          extractedText: aiResult.extracted_text,
          processingStatus: aiResult.processing_status
        }
      }
    }

    // Fetch project assignments if requested
    if (includeAssignments) {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('invoice_project_assignments')
        .select(`
          *,
          projects (
            id,
            name
          )
        `)
        .eq('supplier_invoice_id', invoiceId)

      if (!assignmentError && assignmentData) {
        invoice.assignments = assignmentData.map(assignment => ({
          id: assignment.id,
          projectId: assignment.project_id,
          projectName: assignment.projects?.name || 'Unknown Project',
          amountAssigned: assignment.amount_assigned,
          percentage: assignment.percentage,
          assignmentType: assignment.assignment_type,
          assignedBy: assignment.assigned_by,
          assignedAt: assignment.assigned_at
        }))
      }
    }

    return NextResponse.json({
      invoice,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Supplier Invoice Details API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch invoice details'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const invoiceId = id

    const body = await request.json()
    const {
      status,
      description,
      supplierName,
      amountTotal,
      amountNet,
      amountVat,
      invoiceDate,
      projectAssignments
    } = body

    // Update supplier invoice
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (description !== undefined) updateData.description = description
    if (supplierName !== undefined) updateData.supplier_name = supplierName
    if (amountTotal !== undefined) updateData.amount_total = parseFloat(amountTotal)
    if (amountNet !== undefined) updateData.amount_net = amountNet ? parseFloat(amountNet) : null
    if (amountVat !== undefined) updateData.amount_vat = amountVat ? parseFloat(amountVat) : null
    if (invoiceDate !== undefined) updateData.invoice_date = invoiceDate
    updateData.updated_at = new Date().toISOString()

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single()

    if (invoiceError) {
      if (invoiceError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        )
      }
      console.error('Error updating supplier invoice:', invoiceError)
      throw new Error('Failed to update supplier invoice')
    }

    // Handle project assignments if provided
    if (projectAssignments !== undefined) {
      // First, delete existing assignments
      await supabase
        .from('invoice_project_assignments')
        .delete()
        .eq('supplier_invoice_id', invoiceId)

      // Then, insert new assignments
      if (projectAssignments.length > 0) {
        const assignmentInserts = projectAssignments.map((assignment: any) => ({
          supplier_invoice_id: invoiceId,
          project_id: assignment.projectId,
          amount_assigned: parseFloat(assignment.amountAssigned),
          percentage: assignment.percentage || null,
          assignment_type: assignment.assignmentType || 'manual',
          assigned_by: user.email || 'Unknown User'
        }))

        const { error: assignmentError } = await supabase
          .from('invoice_project_assignments')
          .insert(assignmentInserts)

        if (assignmentError) {
          console.error('Error updating project assignments:', assignmentError)
          return NextResponse.json(
            { error: 'Failed to update project assignments' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
      message: 'Invoice updated successfully'
    })

  } catch (error: any) {
    console.error('Supplier Invoice Update API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update invoice'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const invoiceId = id

    // First, delete related assignments
    await supabase
      .from('invoice_project_assignments')
      .delete()
      .eq('supplier_invoice_id', invoiceId)

    // Delete AI processing results
    await supabase
      .from('ai_processing_results')
      .delete()
      .eq('supplier_invoice_id', invoiceId)

    // Finally, delete the invoice
    const { error: deleteError } = await supabase
      .from('supplier_invoices')
      .delete()
      .eq('id', invoiceId)

    if (deleteError) {
      console.error('Error deleting supplier invoice:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    })

  } catch (error: any) {
    console.error('Supplier Invoice Delete API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to delete invoice'
      },
      { status: 500 }
    )
  }
}