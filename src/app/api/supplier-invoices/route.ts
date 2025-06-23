import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supplier invoice interface for the API response
export interface SupplierInvoiceWithDetails {
  id: string
  qontoId?: string
  supplierName: string
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
    }[]
    extractedText?: string
    processingStatus?: string
  }
  // Project assignments
  assignments?: {
    projectId: string
    projectName: string
    amountAssigned: number
    percentage?: number
    assignmentType: string
    assignedBy?: string
    assignedAt: string
  }[]
}

export interface SupplierInvoiceStatistics {
  total: number
  totalAmount: number
  byStatus: {
    status: string
    count: number
    amount: number
  }[]
  averageAmount: number
  pendingAssignmentCount: number
  highConfidenceCount: number
  processingStats: {
    totalProcessed: number
    avgConfidence: number
    recentProcessingCount: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStatistics = searchParams.get('includeStatistics') === 'true'
    const statusFilter = searchParams.get('status')
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true'
    const highConfidenceOnly = searchParams.get('highConfidenceOnly') === 'true'
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

    // Build base query for supplier invoices
    let invoicesQuery = supabase
      .from('supplier_invoices')
      .select('*')
      .order('invoice_date', { ascending: false })

    // Apply filters
    if (statusFilter) {
      invoicesQuery = invoicesQuery.eq('status', statusFilter)
    }

    if (unassignedOnly) {
      // Include all statuses except 'assigned' - invoices that need manual or AI review
      invoicesQuery = invoicesQuery.in('status', ['pending-assignment', 'low-confidence', 'no-match', 'high-confidence', 'medium-confidence'])
    }

    // Execute main query
    const { data: invoicesData, error: invoicesError } = await invoicesQuery

    if (invoicesError) {
      console.error('Error fetching supplier invoices:', invoicesError)
      throw new Error('Failed to fetch supplier invoices')
    }

    let supplierInvoices: SupplierInvoiceWithDetails[] = (invoicesData || []).map((invoice: any) => ({
      id: invoice.id,
      qontoId: invoice.qonto_id,
      supplierName: invoice.supplier_name,
      amountTotal: invoice.amount_total,
      amountNet: invoice.amount_net,
      amountVat: invoice.amount_vat,
      currency: invoice.currency,
      invoiceDate: invoice.invoice_date,
      processingDate: invoice.processing_date,
      description: invoice.description,
      pdfUrl: invoice.pdf_url,
      attachmentId: invoice.attachment_id, // Add attachment_id field
      qontoTransactionId: invoice.qonto_transaction_id,
      status: invoice.status,
      isProcessed: invoice.is_processed,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at
    }))

    // Fetch AI Vision processing results if requested
    if (includeAI) {
      const { data: aiData, error: aiError } = await supabase
        .from('ai_processing_results')
        .select('*')
        .in('supplier_invoice_id', supplierInvoices.map(inv => inv.id))
        .eq('processing_type', 'vision_project_matching')
        .order('processed_at', { ascending: false })

      if (!aiError && aiData) {
        console.log('🔍 AI Data retrieved from database:', aiData.length, 'records')
        aiData.forEach((ai, index) => {
          console.log(`  ${index}: Invoice ${ai.supplier_invoice_id}, Type: ${ai.processing_type}, Status: ${ai.processing_status}, Confidence: ${ai.confidence_score}`)
        })
        
        // Group by supplier_invoice_id and get the latest vision result for each invoice
        const aiMap = new Map()
        
        aiData.forEach(ai => {
          const invoiceId = ai.supplier_invoice_id
          const existing = aiMap.get(invoiceId)
          
          if (!existing) {
            // No existing result, use this one
            aiMap.set(invoiceId, ai)
          } else {
            // Keep the newer one (already sorted by processed_at desc)
            if (new Date(ai.processed_at) > new Date(existing.processed_at)) {
              aiMap.set(invoiceId, ai)
            }
          }
        })
        
        supplierInvoices = supplierInvoices.map(invoice => {
          const aiResult = aiMap.get(invoice.id)
          if (aiResult) {
            invoice.aiExtraction = {
              confidence: aiResult.confidence_score || 0,
              projectMatches: aiResult.project_matches || [],
              extractedText: aiResult.extracted_text,
              processingStatus: aiResult.processing_status
            }
          }
          return invoice
        })
      }
    }

    // Filter by high confidence if requested
    if (highConfidenceOnly) {
      supplierInvoices = supplierInvoices.filter(invoice => 
        invoice.aiExtraction && invoice.aiExtraction.confidence >= 80
      )
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
        .in('supplier_invoice_id', supplierInvoices.map(inv => inv.id))

      if (!assignmentError && assignmentData) {
        const assignmentMap = new Map<string, any[]>()
        
        assignmentData.forEach(assignment => {
          const invoiceId = assignment.supplier_invoice_id
          if (!assignmentMap.has(invoiceId)) {
            assignmentMap.set(invoiceId, [])
          }
          assignmentMap.get(invoiceId)!.push({
            projectId: assignment.project_id,
            projectName: assignment.projects?.name,
            amountAssigned: assignment.amount_assigned,
            percentage: assignment.percentage,
            assignmentType: assignment.assignment_type,
            assignedBy: assignment.assigned_by,
            assignedAt: assignment.assigned_at
          })
        })

        supplierInvoices = supplierInvoices.map(invoice => {
          invoice.assignments = assignmentMap.get(invoice.id) || []
          return invoice
        })
      }
    }

    // Calculate statistics if requested
    let statistics = {}
    if (includeStatistics) {
      const totalAmount = supplierInvoices.reduce((sum, invoice) => sum + invoice.amountTotal, 0)

      // Group by status
      const statusGroups = supplierInvoices.reduce((acc: any, invoice) => {
        const status = invoice.status
        if (!acc[status]) {
          acc[status] = { count: 0, amount: 0 }
        }
        acc[status].count += 1
        acc[status].amount += invoice.amountTotal
        return acc
      }, {})

      const byStatus = Object.entries(statusGroups).map(([status, data]: [string, any]) => ({
        status,
        count: data.count,
        amount: data.amount
      }))

      const pendingAssignmentCount = supplierInvoices.filter(inv => 
        ['pending-assignment', 'low-confidence', 'no-match', 'high-confidence', 'medium-confidence'].includes(inv.status)
      ).length

      const highConfidenceCount = supplierInvoices.filter(inv => 
        inv.aiExtraction && inv.aiExtraction.confidence >= 80
      ).length

      const processedInvoices = supplierInvoices.filter(inv => inv.aiExtraction)
      const avgConfidence = processedInvoices.length > 0 
        ? processedInvoices.reduce((sum, inv) => sum + (inv.aiExtraction?.confidence || 0), 0) / processedInvoices.length
        : 0

      statistics = {
        total: supplierInvoices.length,
        totalAmount,
        byStatus,
        averageAmount: supplierInvoices.length > 0 ? totalAmount / supplierInvoices.length : 0,
        pendingAssignmentCount,
        highConfidenceCount,
        processingStats: {
          totalProcessed: processedInvoices.length,
          avgConfidence: Math.round(avgConfidence),
          recentProcessingCount: processedInvoices.filter(inv => {
            const processingDate = new Date(inv.processingDate)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            return processingDate >= sevenDaysAgo
          }).length
        }
      }
    }

    const response = {
      supplierInvoices,
      total: supplierInvoices.length,
      filters: {
        status: statusFilter || null,
        unassignedOnly: unassignedOnly || false,
        highConfidenceOnly: highConfidenceOnly || false,
        includeAI: includeAI || false,
        includeAssignments: includeAssignments || false
      },
      ...(includeStatistics && { statistics }),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Supplier Invoices API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch supplier invoices'
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
    const {
      qontoId,
      supplierName,
      amountTotal,
      amountNet,
      amountVat,
      currency = 'EUR',
      invoiceDate,
      description,
      pdfUrl,
      qontoTransactionId,
      status = 'pending-assignment',
      projectAssignments // Array of {projectId, amountAssigned, assignmentType}
    } = body

    // Validate required fields
    if (!supplierName || !amountTotal || !invoiceDate) {
      return NextResponse.json(
        { error: 'Missing required fields: supplierName, amountTotal, invoiceDate' },
        { status: 400 }
      )
    }

    // Insert supplier invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .insert({
        qonto_id: qontoId,
        supplier_name: supplierName,
        amount_total: parseFloat(amountTotal),
        amount_net: amountNet ? parseFloat(amountNet) : null,
        amount_vat: amountVat ? parseFloat(amountVat) : null,
        currency,
        invoice_date: invoiceDate,
        description,
        pdf_url: pdfUrl,
        qonto_transaction_id: qontoTransactionId,
        status,
        is_processed: false
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating supplier invoice:', invoiceError)
      throw new Error('Failed to create supplier invoice')
    }

    // Handle project assignments if provided
    if (projectAssignments && projectAssignments.length > 0) {
      const assignmentInserts = projectAssignments.map((assignment: any) => ({
        supplier_invoice_id: invoiceData.id,
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
        console.error('Error creating project assignments:', assignmentError)
        // Don't fail the entire request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      supplierInvoice: invoiceData,
      message: 'Supplier invoice created successfully'
    })

  } catch (error: any) {
    console.error('Supplier invoice creation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create supplier invoice'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      id,
      status,
      description,
      projectAssignments
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier invoice ID is required for updates' },
        { status: 400 }
      )
    }

    // Update supplier invoice
    const updateData: any = {}
    if (status) updateData.status = status
    if (description !== undefined) updateData.description = description
    updateData.updated_at = new Date().toISOString()

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (invoiceError) {
      console.error('Error updating supplier invoice:', invoiceError)
      throw new Error('Failed to update supplier invoice')
    }

    // Handle project assignments if provided
    if (projectAssignments) {
      // First, delete existing assignments
      await supabase
        .from('invoice_project_assignments')
        .delete()
        .eq('supplier_invoice_id', id)

      // Then, insert new assignments
      if (projectAssignments.length > 0) {
        const assignmentInserts = projectAssignments.map((assignment: any) => ({
          supplier_invoice_id: id,
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
        }
      }
    }

    return NextResponse.json({
      success: true,
      supplierInvoice: invoiceData,
      message: 'Supplier invoice updated successfully'
    })

  } catch (error: any) {
    console.error('Supplier invoice update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update supplier invoice'
      },
      { status: 500 }
    )
  }
}