import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createQontoClient } from '@/lib/qonto/client'
import { getVisionProcessor } from '@/lib/ocr/vision-invoice-processor'

// Manual OCR processing endpoint for supplier invoices
export async function POST(
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
    const supplierInvoiceId = id

    // Get supplier invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .select('id, supplier_name, attachment_id, status')
      .eq('id', supplierInvoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Supplier invoice not found' },
        { status: 404 }
      )
    }

    if (!invoice.attachment_id) {
      return NextResponse.json(
        { error: 'No PDF attachment found for this invoice' },
        { status: 400 }
      )
    }

    // Check if vision processing already exists for this invoice
    const { data: existingProcessing } = await supabase
      .from('ai_processing_results')
      .select('id, processing_status, confidence_score, project_matches, processing_type')
      .eq('supplier_invoice_id', supplierInvoiceId)
      .eq('processing_type', 'vision_project_matching')
      .order('processed_at', { ascending: false })
      .limit(1)
      .single()

    // Only skip if we have successful vision processing
    if (existingProcessing && existingProcessing.processing_status === 'success') {
      console.log(`✅ Vision processing already exists for invoice ${supplierInvoiceId}`)
      return NextResponse.json({
        message: 'AI Vision analysis already completed for this invoice',
        existing_result: {
          confidence: existingProcessing.confidence_score,
          project_matches: existingProcessing.project_matches,
          processing_type: existingProcessing.processing_type
        }
      })
    }

    // Start AI Vision processing
    console.log(`🔍 AI Vision processing requested for supplier invoice: ${invoice.supplier_name}`)

    try {
      // Get Qonto client to fetch the PDF
      const qontoClient = await createQontoClient()
      if (!qontoClient) {
        throw new Error('Qonto integration not available')
      }

      // Get the PDF attachment URL from Qonto
      const { url: pdfUrl } = await qontoClient.getAttachmentUrl(invoice.attachment_id)

      // Download the PDF
      const pdfResponse = await fetch(pdfUrl)
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.status}`)
      }

      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())

      // Process with Claude Vision using PDF URL (no image conversion needed)
      console.log('🤖 Using Claude Vision for invoice analysis...')
      const visionProcessor = await getVisionProcessor()
      const result = await visionProcessor.processSupplierInvoice(pdfBuffer, supplierInvoiceId, pdfUrl)
      await visionProcessor.cleanup()

      return NextResponse.json({
        success: true,
        message: 'AI Vision processing completed',
        result: {
          confidence: result.confidence,
          project_matches: result.projectMatches,
          extracted_text_length: result.extractedText.length,
          processing_time_ms: result.processingTime,
          status: result.status
        }
      })

    } catch (visionError) {
      console.error(`❌ AI Vision processing failed for invoice ${supplierInvoiceId}:`, visionError)

      // Store failed result in database
      await supabase
        .from('ai_processing_results')
        .upsert({
          supplier_invoice_id: supplierInvoiceId,
          processing_type: 'vision_project_matching',
          confidence_score: 0,
          processing_status: 'failed',
          error_message: visionError instanceof Error ? visionError.message : 'Unknown processing error',
          processed_at: new Date().toISOString()
        })

      return NextResponse.json(
        {
          error: 'AI Vision processing failed',
          details: visionError instanceof Error ? visionError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('AI Vision API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to process AI Vision'
      },
      { status: 500 }
    )
  }
}

// Get AI Vision processing status and results
export async function GET(
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
    const supplierInvoiceId = id

    // Get vision processing results only
    const { data: visionResults, error } = await supabase
      .from('ai_processing_results')
      .select('*')
      .eq('supplier_invoice_id', supplierInvoiceId)
      .eq('processing_type', 'vision_project_matching')
      .order('processed_at', { ascending: false })

    if (error) {
      console.error('Error fetching AI Vision results:', error)
      return NextResponse.json(
        { error: 'Failed to fetch AI Vision results' },
        { status: 500 }
      )
    }

    if (!visionResults || visionResults.length === 0) {
      return NextResponse.json({
        message: 'No AI Vision processing found for this invoice',
        has_processing: false
      })
    }

    const latestResult = visionResults[0]

    return NextResponse.json({
      has_processing: true,
      result: {
        id: latestResult.id,
        confidence: latestResult.confidence_score,
        project_matches: latestResult.project_matches,
        processing_status: latestResult.processing_status,
        processing_time_ms: latestResult.processing_time_ms,
        processed_at: latestResult.processed_at,
        error_message: latestResult.error_message,
        extracted_text_preview: latestResult.extracted_text?.substring(0, 200) + '...',
        full_extracted_text: latestResult.extracted_text // Debug: include full text
      }
    })

  } catch (error: any) {
    console.error('AI Vision status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}