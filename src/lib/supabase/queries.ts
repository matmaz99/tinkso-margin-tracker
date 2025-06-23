import { createClient } from './client'
import { createClient as createServerClient } from './server'
import type { 
  Project, 
  ClientInvoice, 
  SupplierInvoice, 
  ManualExpense,
  ProjectFinancials,
  DashboardSummary 
} from './types'

// Dashboard queries for real-time financial data

// Browser client queries (for client-side components)
export const dashboardQueries = {
  // Get all projects with basic financial aggregation
  async getProjectsWithFinancials(): Promise<ProjectFinancials[]> {
    const supabase = createClient()

    // Get projects with related data
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        client_invoices(*),
        manual_expenses(*),
        invoice_project_assignments(
          *,
          supplier_invoices(*)
        ),
        client_project_associations(
          *,
          clients(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (projectsError) throw projectsError

    // Calculate financials for each project
    const projectFinancials: ProjectFinancials[] = (projects || []).map(project => {
      const revenue = this.calculateProjectRevenue(project.client_invoices || [])
      const costs = this.calculateProjectCosts(
        project.manual_expenses || [],
        project.invoice_project_assignments || []
      )
      const margin = {
        total: revenue.total - costs.total,
        percentage: revenue.total > 0 ? ((revenue.total - costs.total) / revenue.total) * 100 : 0
      }

      return {
        projectId: project.id,
        projectName: project.name,
        currency: project.currency || 'EUR',
        revenue,
        costs,
        margin,
        invoices: {
          client: project.client_invoices?.length || 0,
          supplier: project.invoice_project_assignments?.length || 0,
          pending: project.client_invoices?.filter((inv: ClientInvoice) => 
            inv.status === 'pending' || inv.status === 'overdue'
          ).length || 0
        }
      }
    })

    return projectFinancials
  },

  // Get dashboard summary with totals
  async getDashboardSummary(): Promise<DashboardSummary> {
    const projectFinancials = await this.getProjectsWithFinancials()
    
    // Aggregate across all projects (convert to base currency - EUR for now)
    const totals = projectFinancials.reduce((acc, project) => {
      // Simple currency conversion (in real app, use actual exchange rates)
      const multiplier = project.currency === 'USD' ? 0.85 : 1 // EUR = 1, USD = 0.85
      
      acc.totalRevenue += project.revenue.total * multiplier
      acc.totalCosts += project.costs.total * multiplier
      acc.pendingInvoices += project.invoices.pending
      
      return acc
    }, {
      totalRevenue: 0,
      totalCosts: 0,
      pendingInvoices: 0
    })

    const totalMargin = totals.totalRevenue - totals.totalCosts
    const marginPercentage = totals.totalRevenue > 0 
      ? (totalMargin / totals.totalRevenue) * 100 
      : 0

    // Count active projects and overdue invoices
    const supabase = createClient()
    
    const { data: activeProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('status', 'active')

    const { data: overdueInvoices } = await supabase
      .from('client_invoices')
      .select('id')
      .eq('status', 'overdue')

    return {
      totalRevenue: totals.totalRevenue,
      totalCosts: totals.totalCosts,
      totalMargin,
      marginPercentage,
      currency: 'EUR', // Base currency
      activeProjects: activeProjects?.length || 0,
      pendingInvoices: totals.pendingInvoices,
      overdueInvoices: overdueInvoices?.length || 0
    }
  },

  // Calculate revenue from client invoices
  calculateProjectRevenue(clientInvoices: ClientInvoice[]) {
    return clientInvoices.reduce((acc, invoice) => {
      acc.total += invoice.amount_total
      
      if (invoice.status === 'paid') {
        acc.paid += invoice.amount_total
      } else if (invoice.status === 'pending') {
        acc.pending += invoice.amount_total
      } else if (invoice.status === 'overdue') {
        acc.overdue += invoice.amount_total
      }
      
      return acc
    }, {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0
    })
  },

  // Calculate costs from manual expenses and supplier invoices
  calculateProjectCosts(
    manualExpenses: ManualExpense[], 
    supplierAssignments: any[]
  ) {
    const manualTotal = manualExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    const supplierTotal = supplierAssignments.reduce((sum, assignment) => {
      return sum + assignment.amount_assigned
    }, 0)

    return {
      total: manualTotal + supplierTotal,
      manual: manualTotal,
      supplier: supplierTotal
    }
  },

  // Get recent activity for dashboard
  async getRecentActivity(limit = 10) {
    const supabase = createClient()

    // Get recent invoices and expenses
    const { data: recentInvoices } = await supabase
      .from('client_invoices')
      .select(`
        *,
        projects(name),
        clients(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: recentExpenses } = await supabase
      .from('manual_expenses')
      .select(`
        *,
        projects(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    return {
      invoices: recentInvoices || [],
      expenses: recentExpenses || []
    }
  },

  // Get projects by time period
  async getProjectsByPeriod(startDate: string, endDate: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client_invoices!inner(*),
        manual_expenses(*),
        invoice_project_assignments(
          *,
          supplier_invoices(*)
        )
      `)
      .gte('client_invoices.issue_date', startDate)
      .lte('client_invoices.issue_date', endDate)

    if (error) throw error
    return data || []
  }
}

// Server-side queries (for API routes and server components)
export const dashboardServerQueries = {
  // Get dashboard data for API routes
  async getDashboardData(request?: Request) {
    const supabase = request ? 
      (await import('./server')).createServerClient(request) : 
      await createServerClient()

    try {
      // Get all projects with related financial data
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          client_invoices(*),
          manual_expenses(*),
          invoice_project_assignments(
            amount_assigned,
            supplier_invoices(amount_total, currency)
          ),
          client_project_associations(
            clients(name, currency)
          )
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Process and calculate financials
      const projectsWithFinancials = (projects || []).map(project => {
        // Calculate revenue from client invoices
        const revenue = (project.client_invoices || []).reduce((acc: any, invoice: ClientInvoice) => {
          acc.total += invoice.amount_total
          if (invoice.status === 'paid') acc.paid += invoice.amount_total
          else if (invoice.status === 'pending') acc.pending += invoice.amount_total
          else if (invoice.status === 'overdue') acc.overdue += invoice.amount_total
          return acc
        }, { total: 0, paid: 0, pending: 0, overdue: 0 })

        // Calculate costs from manual expenses and supplier assignments
        const manualCosts = (project.manual_expenses || []).reduce((sum: number, expense: ManualExpense) => 
          sum + expense.amount, 0
        )
        
        const supplierCosts = (project.invoice_project_assignments || []).reduce((sum: number, assignment: any) =>
          sum + (assignment.amount_assigned || 0), 0
        )

        const totalCosts = manualCosts + supplierCosts
        const margin = revenue.total - totalCosts
        const marginPercentage = revenue.total > 0 ? (margin / revenue.total) * 100 : 0

        return {
          ...project,
          financials: {
            revenue,
            costs: {
              total: totalCosts,
              manual: manualCosts,
              supplier: supplierCosts
            },
            margin: {
              total: margin,
              percentage: marginPercentage
            }
          }
        }
      })

      return projectsWithFinancials
    } catch (error) {
      console.error('Dashboard data query error:', error)
      throw error
    }
  },

  // Get summary statistics
  async getSummaryStats(request?: Request) {
    const supabase = request ? 
      (await import('./server')).createServerClient(request) : 
      await createServerClient()

    try {
      // Get counts and totals
      const [
        { count: totalProjects },
        { count: activeProjects },
        { count: pendingInvoices },
        { count: overdueInvoices },
        { data: revenueData },
        { data: costData }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('client_invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('client_invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
        supabase.from('client_invoices').select('amount_total, status'),
        supabase.from('manual_expenses').select('amount')
      ])

      // Calculate financial totals
      const totalRevenue = (revenueData || []).reduce((sum: number, invoice: any) => 
        invoice.status === 'paid' ? sum + invoice.amount_total : sum, 0
      )

      const totalCosts = (costData || []).reduce((sum: number, expense: any) => 
        sum + expense.amount, 0
      )

      const totalMargin = totalRevenue - totalCosts
      const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0

      return {
        projects: {
          total: totalProjects || 0,
          active: activeProjects || 0
        },
        invoices: {
          pending: pendingInvoices || 0,
          overdue: overdueInvoices || 0
        },
        financials: {
          totalRevenue,
          totalCosts,
          totalMargin,
          marginPercentage
        }
      }
    } catch (error) {
      console.error('Summary stats query error:', error)
      throw error
    }
  }
}