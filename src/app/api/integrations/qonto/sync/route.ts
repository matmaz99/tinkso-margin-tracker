import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { 
  createQontoClient, 
  QontoClientData,
  QontoClientInvoice,
  QontoSupplierInvoice
} from '@/lib/qonto/client'
import { getVisionProcessor } from '@/lib/ocr/vision-invoice-processor'

// Qonto Business API data sync (clients, client invoices, supplier invoices)
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)

    const body = await request.json()
    const { 
      force_full_sync = false,
      sync_type = 'all' // 'all', 'clients', 'client_invoices', 'supplier_invoices'
    } = body

    // Create Qonto client
    const qontoClient = await createQontoClient()
    if (!qontoClient) {
      return NextResponse.json(
        { error: 'Qonto integration not configured' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const syncStartTime = new Date().toISOString()

    // Log sync start
    const { data: syncLog, error: logError } = await supabase
      .from('qonto_sync_log')
      .insert({
        sync_type: sync_type,
        sync_status: 'started',
        started_at: syncStartTime
      })
      .select()
      .single()

    if (logError) {
      console.error('Failed to create sync log:', logError)
      return NextResponse.json(
        { error: 'Failed to initialize sync' },
        { status: 500 }
      )
    }

    let recordsProcessed = 0
    let recordsCreated = 0
    let recordsUpdated = 0
    let errorMessage: string | null = null

    try {
      // Sync based on type
      if (sync_type === 'all' || sync_type === 'clients') {
        const clientsResult = await syncQontoClients(supabase, qontoClient, force_full_sync)
        recordsProcessed += clientsResult.processed
        recordsCreated += clientsResult.created
        recordsUpdated += clientsResult.updated
      }

      if (sync_type === 'all' || sync_type === 'client_invoices') {
        const clientInvoicesResult = await syncQontoClientInvoices(supabase, qontoClient, force_full_sync)
        recordsProcessed += clientInvoicesResult.processed
        recordsCreated += clientInvoicesResult.created
        recordsUpdated += clientInvoicesResult.updated
      }

      if (sync_type === 'all' || sync_type === 'supplier_invoices') {
        const supplierInvoicesResult = await syncQontoSupplierInvoices(supabase, qontoClient, force_full_sync)
        recordsProcessed += supplierInvoicesResult.processed
        recordsCreated += supplierInvoicesResult.created
        recordsUpdated += supplierInvoicesResult.updated
      }

      // Update sync log with success
      await supabase
        .from('qonto_sync_log')
        .update({
          sync_status: 'completed',
          records_processed: recordsProcessed,
          records_updated: recordsUpdated,
          records_created: recordsCreated,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

      return NextResponse.json({
        success: true,
        sync_id: syncLog.id,
        records_processed: recordsProcessed,
        records_updated: recordsUpdated,
        records_created: recordsCreated,
        sync_type: force_full_sync ? 'full' : 'incremental',
        api_type: sync_type
      })

    } catch (syncError) {
      errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error'
      console.error('Qonto sync failed:', syncError)

      // Update sync log with error
      await supabase
        .from('qonto_sync_log')
        .update({
          sync_status: 'failed',
          records_processed: recordsProcessed,
          records_updated: recordsUpdated,
          records_created: recordsCreated,
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

      return NextResponse.json(
        {
          error: 'Sync failed',
          details: errorMessage,
          records_processed: recordsProcessed
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Qonto sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Sync clients from Qonto Business API
async function syncQontoClients(
  supabase: any, 
  qontoClient: any, 
  forceFullSync: boolean
): Promise<{ processed: number; created: number; updated: number }> {
  let processed = 0
  let created = 0
  let updated = 0

  let currentPage = 1
  let hasMorePages = true

  while (hasMorePages) {
    console.log(`Syncing clients - Page ${currentPage}...`)
    const { clients, meta } = await qontoClient.getClients({
      current_page: currentPage,
      per_page: 100
    })

    console.log(`Fetched ${clients.length} clients (Page ${currentPage}/${meta.total_pages || '?'}, Total: ${meta.total_count || '?'})`)
    processed += clients.length

    for (const clientData of clients) {
      try {
        // Check if client already exists
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id, qonto_id')
          .eq('qonto_id', clientData.id)
          .single()

        const clientRecord = {
          qonto_id: clientData.id,
          name: clientData.name,
          email: clientData.email || null,
          phone: clientData.phone || null,
          address: clientData.address || null,
          vat_number: clientData.vat_number || null,
          country: clientData.country || null,
          currency: 'EUR', // Default for Qonto
          last_sync_at: new Date().toISOString(),
          is_active: true
        }

        if (existingClient) {
          // Update existing client
          await supabase
            .from('clients')
            .update(clientRecord)
            .eq('id', existingClient.id)
          updated++
        } else {
          // Create new client
          await supabase
            .from('clients')
            .insert([clientRecord])
          created++
        }
      } catch (error) {
        console.error(`Failed to sync client ${clientData.id}:`, error)
      }
    }

    hasMorePages = meta.next_page !== null
    if (hasMorePages) {
      currentPage = meta.next_page!
    }
  }

  return { processed, created, updated }
}

// Sync client invoices from Qonto Business API
async function syncQontoClientInvoices(
  supabase: any, 
  qontoClient: any, 
  forceFullSync: boolean
): Promise<{ processed: number; created: number; updated: number }> {
  let processed = 0
  let created = 0
  let updated = 0

  let currentPage = 1
  let hasMorePages = true

  while (hasMorePages) {
    console.log(`Syncing client invoices - Page ${currentPage}...`)
    const { client_invoices, meta } = await qontoClient.getClientInvoices({
      current_page: currentPage,
      per_page: 100
    })

    console.log(`Fetched ${client_invoices.length} client invoices (Page ${currentPage}/${meta.total_pages || '?'}, Total: ${meta.total_count || '?'})`)
    processed += client_invoices.length

    for (const qontoInvoice of client_invoices) {
      try {
        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from('client_invoices')
          .select('id, qonto_id')
          .eq('qonto_id', qontoInvoice.id)
          .single()

        // Find corresponding client
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('qonto_id', qontoInvoice.client?.id)
          .single()

        // Check if client has an assigned project (for automatic linking)
        let assignedProjectId = null
        if (client) {
          const { data: clientProject } = await supabase
            .from('projects')
            .select('id')
            .eq('client_name', qontoInvoice.client?.name)
            .single()
          
          assignedProjectId = clientProject?.id || null
        }

        const invoiceData = {
          qonto_id: qontoInvoice.id,
          invoice_number: qontoInvoice.number || qontoInvoice.invoice_number,
          client_id: client?.id || null,
          project_id: assignedProjectId, // Automatically link to project if client is assigned
          amount_total: parseFloat(qontoInvoice.total_amount?.value || '0'),
          amount_net: parseFloat(qontoInvoice.total_amount?.value || '0') - parseFloat(qontoInvoice.vat_amount?.value || '0'),
          amount_vat: parseFloat(qontoInvoice.vat_amount?.value || '0'),
          currency: qontoInvoice.total_amount?.currency || 'EUR',
          status: qontoInvoice.status,
          issue_date: qontoInvoice.issue_date,
          due_date: qontoInvoice.due_date || null,
          paid_date: qontoInvoice.paid_at || null,
          description: qontoInvoice.description || qontoInvoice.terms_and_conditions || null,
          attachment_id: qontoInvoice.attachment_id || null, // Store attachment ID for PDF retrieval
          pdf_url: qontoInvoice.invoice_url || null,
          is_auto_detected: true
        }

        // Log automatic project linking
        if (assignedProjectId) {
          console.log(`Auto-linking client invoice ${qontoInvoice.number} to project ${assignedProjectId} for client "${qontoInvoice.client?.name}"`)
        }

        let invoiceId: string

        if (existingInvoice) {
          // Update existing invoice
          const { data: updatedInvoice } = await supabase
            .from('client_invoices')
            .update(invoiceData)
            .eq('id', existingInvoice.id)
            .select('id')
            .single()
          invoiceId = existingInvoice.id
          updated++
        } else {
          // Create new invoice
          const { data: newInvoice } = await supabase
            .from('client_invoices')
            .insert([invoiceData])
            .select('id')
            .single()
          invoiceId = newInvoice?.id
          created++
        }

        // Process line items if they exist
        if (qontoInvoice.items && qontoInvoice.items.length > 0 && invoiceId) {
          // Remove existing line items for this invoice
          await supabase
            .from('client_invoice_line_items')
            .delete()
            .eq('invoice_id', invoiceId)

          // Insert new line items
          const lineItemsData = qontoInvoice.items.map((item, index) => ({
            invoice_id: invoiceId,
            qonto_line_item_id: `${qontoInvoice.id}_item_${index}`, // Generate unique ID
            description: `${item.title || ''} ${item.description || ''}`.trim(),
            quantity: parseFloat(item.quantity || '1'),
            unit_price: parseFloat(item.unit_price?.value || '0'),
            total_amount: parseFloat(item.total_amount?.value || '0'),
            vat_rate: parseFloat(item.vat_rate || '0'),
            vat_amount: parseFloat(item.total_vat?.value || '0')
          }))

          const { error: lineItemsError } = await supabase
            .from('client_invoice_line_items')
            .insert(lineItemsData)

          if (lineItemsError) {
            console.error(`Failed to insert line items for invoice ${qontoInvoice.number}:`, lineItemsError)
          } else {
            console.log(`✅ Processed ${lineItemsData.length} line items for invoice ${qontoInvoice.number}`)
          }
        }
      } catch (error) {
        console.error(`Failed to sync client invoice ${qontoInvoice.id}:`, error)
      }
    }

    hasMorePages = meta.next_page !== null
    if (hasMorePages) {
      currentPage = meta.next_page!
    }
  }

  return { processed, created, updated }
}

// Sync supplier invoices from Qonto Business API
async function syncQontoSupplierInvoices(
  supabase: any, 
  qontoClient: any, 
  forceFullSync: boolean
): Promise<{ processed: number; created: number; updated: number }> {
  let processed = 0
  let created = 0
  let updated = 0
  let skipped = 0
  let visionScheduled = 0 // Counter for vision processing tasks
  const processedSuppliers = new Set<string>()

  let currentPage = 1
  let hasMorePages = true

  while (hasMorePages) {
    console.log(`Syncing supplier invoices - Page ${currentPage}...`)
    const { supplier_invoices, meta } = await qontoClient.getSupplierInvoices({
      current_page: currentPage,
      per_page: 100
    })

    console.log(`Fetched ${supplier_invoices.length} supplier invoices (Page ${currentPage}/${meta.total_pages || '?'}, Total: ${meta.total_count || '?'})`)
    processed += supplier_invoices.length

    for (const qontoInvoice of supplier_invoices) {
      try {
        // Filter: Only process invoices from suppliers with IBAN (project partners/contractors)
        const hasIban = qontoInvoice.supplier_snapshot?.iban
        if (!hasIban) {
          console.log(`Skipping supplier invoice ${qontoInvoice.id} - supplier "${qontoInvoice.supplier_name}" has no IBAN (likely general expense)`)
          skipped++
          continue
        }

        // Track processed suppliers
        processedSuppliers.add(`${qontoInvoice.supplier_name} (${qontoInvoice.supplier_snapshot.iban})`)

        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from('supplier_invoices')
          .select('id, qonto_id')
          .eq('qonto_id', qontoInvoice.id)
          .single()

        const invoiceData = {
          qonto_id: qontoInvoice.id,
          supplier_name: qontoInvoice.supplier_name,
          amount_total: parseFloat(qontoInvoice.total_amount?.value || '0'),
          amount_net: parseFloat(qontoInvoice.payable_amount?.value || '0'), 
          amount_vat: parseFloat(qontoInvoice.total_amount_credit_notes?.value || '0'),
          currency: qontoInvoice.total_amount?.currency || 'EUR',
          invoice_date: qontoInvoice.issue_date,
          description: qontoInvoice.description || qontoInvoice.invoice_number || null,
          attachment_id: qontoInvoice.attachment_id || null, // Store attachment ID for PDF retrieval
          pdf_url: qontoInvoice.pdf_url || null,
          status: 'pending-assignment', // Default status for processing
          is_processed: false,
          supplier_iban: qontoInvoice.supplier_snapshot.iban // Store IBAN for reference
        }

        let newInvoiceId: string | null = null

        if (existingInvoice) {
          // Update existing invoice
          await supabase
            .from('supplier_invoices')
            .update(invoiceData)
            .eq('id', existingInvoice.id)
          updated++
          newInvoiceId = existingInvoice.id
        } else {
          // Create new invoice
          const { data: insertedInvoice } = await supabase
            .from('supplier_invoices')
            .insert([invoiceData])
            .select('id')
            .single()
          created++
          newInvoiceId = insertedInvoice?.id
        }

        // Process vision analysis for new invoices with attachment IDs
        if (newInvoiceId && qontoInvoice.attachment_id && !existingInvoice) {
          // Calculate delay based on vision processing queue to respect rate limits
          // Target: 1 invoice per 15 seconds (4 per minute max)
          const processingDelay = (visionScheduled * 15000) + Math.random() * 3000 // 15s base + 0-3s random
          visionScheduled++ // Increment vision processing counter
          console.log(`🤖 Scheduling vision analysis for "${qontoInvoice.supplier_name}" (delay: ${Math.round(processingDelay/1000)}s, queue position: ${visionScheduled})`)
          // Schedule vision processing asynchronously with delay to avoid rate limiting
          // This will: 1) Analyze PDF with Claude Vision, 2) Match to projects, 3) Auto-assign if confidence ≥80%
          setTimeout(() => {
            processSupplierInvoiceVision(newInvoiceId, qontoInvoice.attachment_id).catch(error => {
              console.error(`Vision processing failed for invoice ${newInvoiceId}:`, error)
            })
          }, processingDelay)
        }
      } catch (error) {
        console.error(`Failed to sync supplier invoice ${qontoInvoice.id}:`, error)
      }
    }

    hasMorePages = meta.next_page !== null
    if (hasMorePages) {
      currentPage = meta.next_page!
    }
  }

  console.log(`Supplier invoice sync complete: ${processed} processed, ${created} created, ${updated} updated, ${skipped} skipped (no IBAN)`)
  console.log(`🤖 Vision processing scheduled for ${visionScheduled} invoices with PDFs`)
  console.log(`Project partners with IBAN processed: ${Array.from(processedSuppliers).join(', ')}`)
  return { processed, created, updated }
}

// GET endpoint for sync status
export async function GET(request: NextRequest) {
  try {
    await authMiddleware.requireAuth(request)
    const supabase = await createClient()

    // Get recent sync logs
    const { data: syncLogs, error } = await supabase
      .from('qonto_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sync logs' },
        { status: 500 }
      )
    }

    // Get last successful sync
    const lastSuccessfulSync = syncLogs.find(log => log.sync_status === 'completed')

    // Get sync statistics by type
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .not('qonto_id', 'is', null)

    const { count: supplierInvoiceCount } = await supabase
      .from('supplier_invoices')
      .select('*', { count: 'exact', head: true })
      .not('qonto_id', 'is', null)

    const { count: clientInvoiceCount } = await supabase
      .from('client_invoices')
      .select('*', { count: 'exact', head: true })
      .not('qonto_id', 'is', null)

    return NextResponse.json({
      last_sync: lastSuccessfulSync?.completed_at || null,
      sync_logs: syncLogs,
      status: 'available',
      statistics: {
        clients: clientCount || 0,
        supplier_invoices: supplierInvoiceCount || 0,
        client_invoices: clientInvoiceCount || 0
      }
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process supplier invoice with Claude Vision for project matching
 * This runs asynchronously after invoice sync to avoid blocking the main sync process
 */
async function processSupplierInvoiceVision(supplierInvoiceId: string, attachmentId: string) {
  try {
    console.log(`🤖 Starting vision analysis for supplier invoice ${supplierInvoiceId}`)
    
    // Get Qonto client to fetch the PDF
    const qontoClient = await createQontoClient()
    if (!qontoClient) {
      throw new Error('Qonto client not available for vision processing')
    }
    
    // Get the PDF attachment URL from Qonto
    const { url: pdfUrl } = await qontoClient.getAttachmentUrl(attachmentId)
    
    // Download the PDF
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.status}`)
    }
    
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())
    
    // Process with Claude Vision using PDF URL (skip status update, we'll handle assignment here)
    const visionProcessor = await getVisionProcessor()
    const result = await visionProcessor.processSupplierInvoice(pdfBuffer, supplierInvoiceId, pdfUrl, true)
    
    console.log(`✅ Vision analysis completed for invoice ${supplierInvoiceId}:`)
    console.log(`   - Text extracted: ${result.extractedText.length} characters`)
    console.log(`   - Confidence: ${result.confidence}%`)
    console.log(`   - Project matches: ${result.projectMatches.length}`)
    
    if (result.projectMatches.length > 0) {
      const bestMatch = result.projectMatches[0]
      console.log(`   - Best match: "${bestMatch.projectName}" (${bestMatch.confidence}% confidence)`)
      console.log(`   - Keywords: ${bestMatch.matchedKeywords.join(', ')}`)
      console.log(`   - Reasoning: ${bestMatch.reasoning}`)
      
      // Auto-assign to project if confidence is ≥ 80%
      if (bestMatch.confidence >= 80) {
        await autoAssignInvoiceToProject(supplierInvoiceId, bestMatch)
      } else {
        // Update status for lower confidence matches (not auto-assigned)
        const supabase = await createClient()
        const newStatus = bestMatch.confidence >= 60 ? 'medium-confidence' : 'low-confidence'
        
        await supabase
          .from('supplier_invoices')
          .update({ 
            status: newStatus,
            is_processed: true 
          })
          .eq('id', supplierInvoiceId)
        
        console.log(`📝 Updated invoice status to "${newStatus}" (confidence: ${bestMatch.confidence}%)`)
      }
    } else {
      // No project matches found - update status to no-match
      const supabase = await createClient()
      
      await supabase
        .from('supplier_invoices')
        .update({ 
          status: 'no-match',
          is_processed: true 
        })
        .eq('id', supplierInvoiceId)
      
      console.log(`📝 No project matches found - updated status to "no-match"`)
    }
    
    if (result.invoiceDetails) {
      console.log(`   - Invoice details: ${JSON.stringify(result.invoiceDetails)}`)
    }
    
  } catch (error) {
    console.error(`❌ Vision processing failed for supplier invoice ${supplierInvoiceId}:`, error)
    
    // Store failed result in database
    const supabase = await createClient()
    await supabase
      .from('ai_processing_results')
      .upsert({
        supplier_invoice_id: supplierInvoiceId,
        processing_type: 'vision_project_matching',
        confidence_score: 0,
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown vision processing error',
        processed_at: new Date().toISOString()
      })
  }
}

/**
 * Auto-assign supplier invoice to project when confidence is ≥ 80%
 */
async function autoAssignInvoiceToProject(supplierInvoiceId: string, projectMatch: any) {
  const supabase = await createClient()
  
  try {
    console.log(`🎯 Auto-assigning invoice ${supplierInvoiceId} to project "${projectMatch.projectName}" (${projectMatch.confidence}% confidence)`)
    
    // Get the project ID by name
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('name', projectMatch.projectName)
      .single()
    
    if (projectError || !project) {
      console.error(`❌ Project "${projectMatch.projectName}" not found for auto-assignment:`, projectError)
      return
    }
    
    // Get the invoice total amount
    const { data: invoice, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .select('amount_total, supplier_name')
      .eq('id', supplierInvoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      console.error(`❌ Invoice ${supplierInvoiceId} not found for auto-assignment:`, invoiceError)
      return
    }
    
    // Create project assignment record
    const { error: assignmentError } = await supabase
      .from('invoice_project_assignments')
      .insert({
        supplier_invoice_id: supplierInvoiceId,
        project_id: project.id,
        amount_assigned: invoice.amount_total,
        percentage: 100, // Full amount assigned
        assignment_type: 'ai_auto_assigned',
        assigned_by: 'Claude Vision AI'
      })
    
    if (assignmentError) {
      console.error(`❌ Failed to create project assignment:`, assignmentError)
      return
    }
    
    // Update invoice status to 'assigned'
    const { error: statusError } = await supabase
      .from('supplier_invoices')
      .update({ 
        status: 'assigned',
        is_processed: true 
      })
      .eq('id', supplierInvoiceId)
    
    if (statusError) {
      console.error(`❌ Failed to update invoice status:`, statusError)
      return
    }
    
    console.log(`✅ Successfully auto-assigned invoice from "${invoice.supplier_name}" (€${invoice.amount_total}) to project "${project.name}"`)
    console.log(`   - Assignment Type: ai_auto_assigned`)
    console.log(`   - Confidence: ${projectMatch.confidence}%`)
    console.log(`   - Keywords: ${projectMatch.matchedKeywords?.join(', ') || 'None'}`)
    console.log(`   - Reasoning: ${projectMatch.reasoning || 'AI Vision analysis'}`)
    
  } catch (error) {
    console.error(`❌ Auto-assignment failed for invoice ${supplierInvoiceId}:`, error)
  }
}

