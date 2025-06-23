import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { createClickUpClient } from '@/lib/clickup/client'
import { createQontoClient } from '@/lib/qonto/client'

// Integration status and management endpoint
export async function GET(request: NextRequest) {
  try {
    await authMiddleware.requireAuth(request)
    const supabase = await createClient()

    // Check ClickUp integration status
    const clickupClient = await createClickUpClient()
    let clickupStatus = 'unavailable'
    let clickupError: string | null = null
    let clickupLastSync: string | null = null

    if (clickupClient) {
      const connectionTest = await clickupClient.testConnection()
      if (connectionTest.success) {
        clickupStatus = 'connected'
        
        // Get last sync time
        const { data: lastClickUpSync } = await supabase
          .from('clickup_sync_log')
          .select('completed_at')
          .eq('sync_status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()
        
        clickupLastSync = lastClickUpSync?.completed_at || null
      } else {
        clickupStatus = 'error'
        clickupError = connectionTest.error || 'Connection failed'
      }
    }

    // Check Qonto integration status
    const qontoClient = await createQontoClient()
    let qontoStatus = 'unavailable'
    let qontoError: string | null = null
    let qontoLastSync: string | null = null
    let qontoOrganization: any = null

    if (qontoClient) {
      const connectionTest = await qontoClient.testConnection()
      if (connectionTest.success) {
        qontoStatus = 'connected'
        qontoOrganization = connectionTest.organization
        
        // Get last sync time
        const { data: lastQontoSync } = await supabase
          .from('qonto_sync_log')
          .select('completed_at')
          .eq('sync_status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()
        
        qontoLastSync = lastQontoSync?.completed_at || null
      } else {
        qontoStatus = 'error'
        qontoError = connectionTest.error || 'Connection failed'
      }
    }

    // Get sync statistics
    const { data: clickupSyncStats } = await supabase
      .from('clickup_sync_log')
      .select('sync_status, count(*)')
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const { data: qontoSyncStats } = await supabase
      .from('qonto_sync_log')
      .select('sync_status, count(*)')
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Get data statistics
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    const { count: supplierInvoiceCount } = await supabase
      .from('supplier_invoices')
      .select('*', { count: 'exact', head: true })

    const { count: clientInvoiceCount } = await supabase
      .from('client_invoices')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      integrations: {
        clickup: {
          status: clickupStatus,
          last_sync: clickupLastSync,
          error: clickupError,
          sync_stats: clickupSyncStats || []
        },
        qonto: {
          status: qontoStatus,
          last_sync: qontoLastSync,
          error: qontoError,
          organization: qontoOrganization,
          sync_stats: qontoSyncStats || []
        }
      },
      data_statistics: {
        projects: projectCount || 0,
        supplier_invoices: supplierInvoiceCount || 0,
        client_invoices: clientInvoiceCount || 0
      },
      system_status: 'operational'
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Integration status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for manual sync triggers
export async function POST(request: NextRequest) {
  try {
    await authMiddleware.requireAuth(request)
    
    const body = await request.json()
    const { integration, action } = body

    if (!integration || !action) {
      return NextResponse.json(
        { error: 'Missing integration or action parameter' },
        { status: 400 }
      )
    }

    // Trigger manual sync based on integration type
    if (integration === 'clickup' && action === 'sync') {
      // Trigger ClickUp sync
      const syncResponse = await fetch(`${request.nextUrl.origin}/api/integrations/clickup/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || ''
        },
        body: JSON.stringify({ force_full_sync: false })
      })

      const syncResult = await syncResponse.json()
      
      return NextResponse.json({
        integration: 'clickup',
        action: 'sync',
        success: syncResponse.ok,
        result: syncResult
      })

    } else if (integration === 'qonto' && action === 'sync') {
      // Trigger Qonto sync
      const syncResponse = await fetch(`${request.nextUrl.origin}/api/integrations/qonto/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || ''
        },
        body: JSON.stringify({ 
          force_full_sync: false,
          sync_type: 'all'
        })
      })

      const syncResult = await syncResponse.json()
      
      return NextResponse.json({
        integration: 'qonto',
        action: 'sync',
        success: syncResponse.ok,
        result: syncResult
      })

    } else if (action === 'test_connection') {
      // Test connection for specified integration
      if (integration === 'clickup') {
        const clickupClient = await createClickUpClient()
        const testResult = clickupClient ? await clickupClient.testConnection() : { success: false, error: 'Client not available' }
        
        return NextResponse.json({
          integration: 'clickup',
          action: 'test_connection',
          ...testResult
        })

      } else if (integration === 'qonto') {
        const qontoClient = await createQontoClient()
        const testResult = qontoClient ? await qontoClient.testConnection() : { success: false, error: 'Client not available' }
        
        return NextResponse.json({
          integration: 'qonto',
          action: 'test_connection',
          ...testResult
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid integration or action' },
      { status: 400 }
    )

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Integration action API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}