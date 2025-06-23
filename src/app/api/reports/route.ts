import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Reports data interfaces
export interface MonthlyReportData {
  month: string
  revenue: number
  costs: number
  margin: number
  marginPercent: number
  invoiceCount: number
  projectCount: number
}

export interface ProjectPerformance {
  projectId: string
  projectName: string
  margin: number
  marginPercent: number
  status: string
  revenue: number
  costs: number
  clientName?: string
}

export interface FinancialInsights {
  totalRevenue: number
  totalCosts: number
  totalMargin: number
  averageMargin: number
  activeProjects: number
  completedProjects: number
  overdueInvoices: number
  pendingInvoices: number
  collectionRate: number
  costBreakdown: {
    personnel: number
    infrastructure: number
    externalServices: number
    other: number
  }
  alerts: {
    type: 'low-margin' | 'payment-delay' | 'target-achievement' | 'cost-overrun'
    title: string
    message: string
    severity: 'info' | 'warning' | 'error'
    count?: number
    amount?: number
  }[]
}

export interface ReportsResponse {
  monthlyData: MonthlyReportData[]
  projectPerformance: ProjectPerformance[]
  insights: FinancialInsights
  dateRange: {
    start: string
    end: string
    months: number
  }
  timestamp: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date()
    const startDateObj = startDate ? new Date(startDate) : new Date(endDateObj.getFullYear(), endDateObj.getMonth() - months + 1, 1)

    // Fetch all projects with financial data
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        created_at,
        updated_at,
        client_name,
        client_invoices (
          amount_total,
          amount_net,
          currency,
          status,
          issue_date,
          paid_date
        ),
        manual_expenses (
          amount,
          currency,
          expense_date
        )
      `)

    if (projectsError) {
      console.error('Error fetching projects for reports:', projectsError)
      throw new Error('Failed to fetch projects data')
    }

    // Fetch supplier invoice assignments
    const { data: supplierAssignments, error: supplierError } = await supabase
      .from('invoice_project_assignments')
      .select(`
        project_id,
        amount_assigned,
        supplier_invoices (
          amount_total,
          currency,
          invoice_date,
          status
        )
      `)

    if (supplierError) {
      console.error('Error fetching supplier assignments:', supplierError)
      throw new Error('Failed to fetch supplier invoice data')
    }

    // Process monthly data
    const monthlyData: MonthlyReportData[] = []
    const monthsArray: Date[] = []
    
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - i, 1)
      monthsArray.unshift(monthDate)
    }

    for (const monthDate of monthsArray) {
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      
      let monthRevenue = 0
      let monthCosts = 0
      let invoiceCount = 0
      const projectsInMonth = new Set()

      // Calculate revenue from client invoices
      for (const project of projectsData || []) {
        for (const invoice of project.client_invoices || []) {
          const invoiceDate = new Date(invoice.issue_date)
          if (invoiceDate >= monthStart && invoiceDate <= monthEnd && invoice.status === 'paid') {
            monthRevenue += invoice.amount_total
            invoiceCount++
            projectsInMonth.add(project.id)
          }
        }

        // Calculate costs from manual expenses
        for (const expense of project.manual_expenses || []) {
          const expenseDate = new Date(expense.expense_date)
          if (expenseDate >= monthStart && expenseDate <= monthEnd) {
            monthCosts += expense.amount
          }
        }
      }

      // Calculate costs from supplier invoices
      for (const assignment of supplierAssignments || []) {
        const invoice = assignment.supplier_invoices
        if (invoice) {
          const invoiceDate = new Date(invoice.invoice_date)
          if (invoiceDate >= monthStart && invoiceDate <= monthEnd && invoice.status === 'paid') {
            monthCosts += assignment.amount_assigned
          }
        }
      }

      const monthMargin = monthRevenue - monthCosts
      const monthMarginPercent = monthRevenue > 0 ? (monthMargin / monthRevenue) * 100 : 0

      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        revenue: monthRevenue,
        costs: monthCosts,
        margin: monthMargin,
        marginPercent: monthMarginPercent,
        invoiceCount,
        projectCount: projectsInMonth.size
      })
    }

    // Process project performance
    const projectPerformance: ProjectPerformance[] = []
    
    for (const project of projectsData || []) {
      // Calculate project revenue
      const projectRevenue = (project.client_invoices || [])
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.amount_total, 0)

      // Calculate project costs from manual expenses
      const manualCosts = (project.manual_expenses || [])
        .reduce((sum: number, expense: any) => sum + expense.amount, 0)

      // Calculate costs from supplier assignments
      const supplierCosts = (supplierAssignments || [])
        .filter((assignment: any) => assignment.project_id === project.id)
        .reduce((sum: number, assignment: any) => {
          return assignment.supplier_invoices?.status === 'paid' 
            ? sum + assignment.amount_assigned 
            : sum
        }, 0)

      const totalCosts = manualCosts + supplierCosts
      const projectMargin = projectRevenue - totalCosts
      const projectMarginPercent = projectRevenue > 0 ? (projectMargin / projectRevenue) * 100 : 0

      // Determine project status based on margin and activity
      let performanceStatus = 'on-track'
      if (project.status === 'completed') {
        performanceStatus = 'completed'
      } else if (projectMarginPercent < 15) {
        performanceStatus = 'at-risk'
      }

      if (projectRevenue > 0 || totalCosts > 0) { // Only include projects with financial activity
        projectPerformance.push({
          projectId: project.id,
          projectName: project.name,
          margin: projectMargin,
          marginPercent: projectMarginPercent,
          status: performanceStatus,
          revenue: projectRevenue,
          costs: totalCosts,
          clientName: project.client_name
        })
      }
    }

    // Sort projects by margin percentage (descending)
    projectPerformance.sort((a, b) => b.marginPercent - a.marginPercent)

    // Calculate insights and KPIs
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0)
    const totalCosts = monthlyData.reduce((sum, month) => sum + month.costs, 0)
    const totalMargin = totalRevenue - totalCosts
    const averageMargin = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0

    const activeProjects = (projectsData || []).filter((p: any) => p.status === 'active').length
    const completedProjects = (projectsData || []).filter((p: any) => p.status === 'completed').length

    // Calculate invoice statistics
    let pendingInvoices = 0
    let overdueInvoices = 0
    let totalInvoices = 0
    let paidInvoices = 0

    for (const project of projectsData || []) {
      for (const invoice of project.client_invoices || []) {
        totalInvoices++
        if (invoice.status === 'paid') {
          paidInvoices++
        } else if (invoice.status === 'pending') {
          pendingInvoices++
        } else if (invoice.status === 'overdue') {
          overdueInvoices++
        }
      }
    }

    const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 100

    // Generate alerts
    const alerts: FinancialInsights['alerts'] = []
    
    const lowMarginProjects = projectPerformance.filter(p => p.marginPercent < 15 && p.status !== 'completed')
    if (lowMarginProjects.length > 0) {
      alerts.push({
        type: 'low-margin',
        title: 'Low Margin Alert',
        message: `${lowMarginProjects.length} projects below 15% margin threshold`,
        severity: 'error',
        count: lowMarginProjects.length
      })
    }

    if (overdueInvoices > 0) {
      const overdueAmount = totalRevenue * 0.1 // Estimate
      alerts.push({
        type: 'payment-delay',
        title: 'Payment Delays',
        message: `€${overdueAmount.toLocaleString()} in overdue invoices`,
        severity: 'warning',
        count: overdueInvoices,
        amount: overdueAmount
      })
    }

    const latestMonth = monthlyData[monthlyData.length - 1]
    if (latestMonth && latestMonth.revenue > 0) {
      const targetRevenue = 100000 // Monthly target
      if (latestMonth.revenue > targetRevenue) {
        const excess = ((latestMonth.revenue - targetRevenue) / targetRevenue) * 100
        alerts.push({
          type: 'target-achievement',
          title: 'Target Achievement',
          message: `Monthly revenue target exceeded by ${excess.toFixed(1)}%`,
          severity: 'info'
        })
      }
    }

    // Cost breakdown (simplified estimation)
    const costBreakdown = {
      personnel: totalCosts * 0.75,
      infrastructure: totalCosts * 0.15,
      externalServices: totalCosts * 0.08,
      other: totalCosts * 0.02
    }

    const insights: FinancialInsights = {
      totalRevenue,
      totalCosts,
      totalMargin,
      averageMargin,
      activeProjects,
      completedProjects,
      overdueInvoices,
      pendingInvoices,
      collectionRate,
      costBreakdown,
      alerts
    }

    const response: ReportsResponse = {
      monthlyData,
      projectPerformance: projectPerformance.slice(0, 10), // Top 10 projects
      insights,
      dateRange: {
        start: startDateObj.toISOString(),
        end: endDateObj.toISOString(),
        months
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Reports API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate reports'
      },
      { status: 500 }
    )
  }
}