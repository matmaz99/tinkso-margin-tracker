import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { QontoClient } from '@/lib/qonto/client'

// Proxy endpoint to serve PDF with proper headers for inline display
export async function GET(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const attachmentId = params.attachmentId
    
    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      )
    }

    // Parse login from QONTO_API_KEY format: "organization_slug:secret_key"
    const apiKey = process.env.QONTO_API_KEY
    if (!apiKey || !apiKey.includes(':')) {
      return NextResponse.json(
        { error: 'Qonto credentials not configured' },
        { status: 500 }
      )
    }

    const [login, secretKey] = apiKey.split(':')
    
    const qonto = new QontoClient({
      login,
      secretKey,
      baseUrl: 'https://thirdparty.qonto.com/v2'
    })

    // Get the attachment URL from Qonto
    const attachmentResult = await qonto.getAttachmentUrl(attachmentId)
    
    if (!attachmentResult.url) {
      return NextResponse.json(
        { error: 'PDF URL not available' },
        { status: 404 }
      )
    }

    // Fetch the PDF from Qonto
    const pdfResponse = await fetch(attachmentResult.url)
    
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch PDF from Qonto' },
        { status: 500 }
      )
    }

    // Get the PDF content
    const pdfContent = await pdfResponse.arrayBuffer()

    // Return PDF with proper headers for inline display
    return new NextResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline', // Force inline display instead of download
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('PDF proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}