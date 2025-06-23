import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createQontoClient } from '@/lib/qonto/client'

// Get PDF URL for attachment (valid for 30 minutes)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)
    
    const attachmentId = params.id
    
    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      )
    }

    // Create Qonto client
    const qontoClient = await createQontoClient()
    if (!qontoClient) {
      return NextResponse.json(
        { error: 'Qonto integration not configured' },
        { status: 400 }
      )
    }

    try {
      // Get fresh attachment URL from Qonto
      const attachmentData = await qontoClient.getAttachmentUrl(attachmentId)
      
      return NextResponse.json({
        success: true,
        attachment_id: attachmentId,
        url: attachmentData.url,
        expires_at: attachmentData.expires_at,
        expires_in_minutes: 30
      })

    } catch (qontoError: any) {
      console.error('Qonto attachment error:', qontoError)
      
      // Handle specific Qonto API errors
      if (qontoError.message.includes('404')) {
        return NextResponse.json(
          { error: 'Attachment not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to retrieve attachment URL' },
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

    console.error('Attachment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}