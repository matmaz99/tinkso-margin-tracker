import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Client, Project, ClientInvoice } from '@/lib/supabase/types'

// Enhanced client interface with calculated fields
export interface ClientWithDetails extends Client {
  totalRevenue: number
  totalProjects: number
  activeProjects: number
  lastInvoiceDate?: string
  paymentTerms?: string
  projectNames: string[]
  recentActivity: string
  qontoStatus: 'connected' | 'pending' | 'error'
}

export interface ClientStatistics {
  total: number
  active: number
  inactive: number
  onHold: number
  totalRevenue: number
  totalProjects: number
  averageRevenuePerClient: number
  recentActivityCount: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStatistics = searchParams.get('includeStatistics') === 'true'
    const statusFilter = searchParams.get('status') // 'active', 'inactive', 'on-hold'
    const includeProjects = searchParams.get('includeProjects') === 'true'

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Base query for clients
    let clientsQuery = supabase
      .from('clients')
      .select(`
        *,
        client_project_associations (
          project_id,
          role,
          projects (
            id,
            name,
            status
          )
        ),
        client_invoices (
          id,
          amount_total,
          currency,
          status,
          issue_date,
          paid_date
        )
      `)

    // Apply status filter if specified
    if (statusFilter) {
      clientsQuery = clientsQuery.eq('is_active', statusFilter === 'active')
    }

    // Execute query
    const { data: clientsData, error: clientsError } = await clientsQuery

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      throw new Error('Failed to fetch clients')
    }

    // Transform clients data with calculations
    const clientsWithDetails: ClientWithDetails[] = (clientsData || []).map((client: any) => {
      const clientInvoices = client.client_invoices || []
      const clientProjects = client.client_project_associations || []
      
      // Calculate financial metrics
      const paidInvoices = clientInvoices.filter((inv: any) => inv.status === 'paid')
      const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.amount_total || 0), 0)
      
      // Calculate project metrics
      const totalProjects = clientProjects.length
      const activeProjects = clientProjects.filter((proj: any) => 
        proj.projects?.status === 'active'
      ).length
      
      // Get project names
      const projectNames = clientProjects.map((proj: any) => proj.projects?.name).filter(Boolean)
      
      // Calculate last invoice date
      const sortedInvoices = clientInvoices
        .filter((inv: any) => inv.issue_date)
        .sort((a: any, b: any) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
      const lastInvoiceDate = sortedInvoices.length > 0 ? sortedInvoices[0].issue_date : undefined
      
      // Determine recent activity
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const hasRecentActivity = lastInvoiceDate && new Date(lastInvoiceDate) > thirtyDaysAgo
      
      // Determine status based on activity and is_active flag
      let status = 'inactive'
      if (client.is_active === false) {
        status = 'inactive'
      } else if (activeProjects > 0) {
        status = 'active'
      } else if (totalProjects > 0 && !hasRecentActivity) {
        status = 'on-hold'
      } else {
        status = 'active'
      }

      return {
        ...client,
        totalRevenue,
        totalProjects,
        activeProjects,
        lastInvoiceDate,
        paymentTerms: 'Net 30', // Default payment terms - could be stored in client data
        projectNames,
        recentActivity: hasRecentActivity ? 'Recent' : 'Inactive',
        qontoStatus: client.qonto_id ? 'connected' : 'pending',
        // Override status with calculated value
        status
      }
    })

    // Apply secondary status filtering after calculations
    const filteredClients = statusFilter 
      ? clientsWithDetails.filter(client => {
          if (statusFilter === 'active') return client.status === 'active'
          if (statusFilter === 'inactive') return client.status === 'inactive'
          if (statusFilter === 'on-hold') return client.status === 'on-hold'
          return true
        })
      : clientsWithDetails

    // Calculate statistics if requested
    let statistics: ClientStatistics | undefined
    if (includeStatistics) {
      const totalRevenue = clientsWithDetails.reduce((sum, client) => sum + client.totalRevenue, 0)
      const totalProjects = clientsWithDetails.reduce((sum, client) => sum + client.totalProjects, 0)
      
      statistics = {
        total: clientsWithDetails.length,
        active: clientsWithDetails.filter(c => c.status === 'active').length,
        inactive: clientsWithDetails.filter(c => c.status === 'inactive').length,
        onHold: clientsWithDetails.filter(c => c.status === 'on-hold').length,
        totalRevenue,
        totalProjects,
        averageRevenuePerClient: clientsWithDetails.length > 0 ? totalRevenue / clientsWithDetails.length : 0,
        recentActivityCount: clientsWithDetails.filter(c => c.recentActivity === 'Recent').length
      }
    }

    const response = {
      clients: filteredClients,
      total: filteredClients.length,
      filters: {
        status: statusFilter || 'all',
        includeProjects,
        includeStatistics
      },
      ...(statistics && { statistics }),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Clients API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch clients'
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
      name,
      email,
      phone,
      address,
      country,
      currency,
      vatNumber,
      qontoId,
      isActive = true
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      )
    }

    // Create client
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        name,
        email,
        phone,
        address,
        country,
        currency: currency || 'EUR',
        vat_number: vatNumber,
        qonto_id: qontoId,
        is_active: isActive
      })
      .select()
      .single()

    if (clientError) {
      console.error('Error creating client:', clientError)
      throw new Error('Failed to create client')
    }

    return NextResponse.json({
      success: true,
      client: clientData,
      message: 'Client created successfully'
    })

  } catch (error: any) {
    console.error('Client creation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create client'
      },
      { status: 500 }
    )
  }
}