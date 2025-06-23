'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  DollarSign,
  Euro,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  FileText
} from "lucide-react"

// Real-time reports data interfaces
interface MonthlyReportData {
  month: string
  revenue: number
  costs: number
  margin: number
  marginPercent: number
  invoiceCount: number
  projectCount: number
}

interface ProjectPerformance {
  projectId: string
  projectName: string
  margin: number
  marginPercent: number
  status: string
  revenue: number
  costs: number
  clientName?: string
}

interface FinancialInsights {
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

interface ReportsData {
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

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [timeRange, setTimeRange] = useState(6) // months

  // Fetch reports data
  const fetchReportsData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/reports?months=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error('Failed to fetch reports data')
      }

      const data = await response.json()
      console.log('Reports API Response:', data) // Debug log
      setReportsData(data)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load reports')
      console.error('Reports fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchReportsData()
  }, [timeRange])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchReportsData()
  }

  // Calculate growth metrics
  const getGrowthMetrics = () => {
    if (!reportsData?.monthlyData || reportsData.monthlyData.length < 2) {
      return { revenueGrowth: 0, marginGrowth: 0 }
    }
    
    const current = reportsData.monthlyData[reportsData.monthlyData.length - 1]
    const previous = reportsData.monthlyData[reportsData.monthlyData.length - 2]
    
    const revenueGrowth = previous.revenue > 0 
      ? ((current.revenue - previous.revenue) / previous.revenue * 100) 
      : 0
    const marginGrowth = current.marginPercent - previous.marginPercent
    
    return { revenueGrowth, marginGrowth }
  }

  const { revenueGrowth, marginGrowth } = getGrowthMetrics()

  // Loading state
  if (isLoading && !reportsData) {
    return (
      <>
        <header className="border-b border-border bg-background">
          <div className="flex h-12 items-center px-4">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-sm font-medium text-foreground">Financial Reports</h1>
            </div>
          </div>
        </header>
        <main className="p-4">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading reports...</span>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  // Error state
  if (error) {
    return (
      <>
        <header className="border-b border-border bg-background">
          <div className="flex h-12 items-center px-4">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-sm font-medium text-foreground">Financial Reports</h1>
            </div>
            <Button onClick={handleRefresh} size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        </header>
        <main className="p-4">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-foreground font-medium">Failed to load reports</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button onClick={handleRefresh} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  const insights = reportsData?.insights || {
    totalRevenue: 0,
    totalCosts: 0,
    totalMargin: 0,
    averageMargin: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueInvoices: 0,
    pendingInvoices: 0,
    collectionRate: 0,
    costBreakdown: { personnel: 0, infrastructure: 0, externalServices: 0, other: 0 },
    alerts: []
  }

  return (
    <>
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Financial Reports</h1>
            <span className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground rounded border border-border">
              {reportsData?.dateRange.months || 6} months
            </span>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="h-6 text-xs px-2 border border-border rounded bg-background text-foreground"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
            </select>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground mb-1">Financial Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Comprehensive margin analysis and performance insights across all projects
              </p>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL REVENUE</span>
                </div>
                <DollarSign className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{insights.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {revenueGrowth !== 0 && (
                  <>
                    {revenueGrowth > 0 ? (
                      <TrendingUp className="inline h-3 w-3 mr-1 text-chart-2" />
                    ) : (
                      <TrendingDown className="inline h-3 w-3 mr-1 text-destructive" />
                    )}
                    {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% from last month
                  </>
                )}
                {revenueGrowth === 0 && 'No previous data'}
              </div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL MARGIN</span>
                </div>
                <Euro className="h-3 w-3 text-chart-1" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{insights.totalMargin.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {marginGrowth !== 0 && (
                  <>
                    {marginGrowth > 0 ? (
                      <TrendingUp className="inline h-3 w-3 mr-1 text-chart-2" />
                    ) : (
                      <TrendingDown className="inline h-3 w-3 mr-1 text-destructive" />
                    )}
                    {marginGrowth > 0 ? '+' : ''}{marginGrowth.toFixed(1)}% margin change
                  </>
                )}
                {marginGrowth === 0 && 'Stable margin rate'}
              </div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">AVERAGE MARGIN</span>
                </div>
                <Target className="h-3 w-3 text-chart-4" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{insights.averageMargin.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Target: 25% margin rate</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-5 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">ACTIVE PROJECTS</span>
                </div>
                <BarChart3 className="h-3 w-3 text-chart-5" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{insights.activeProjects}</div>
              <div className="text-xs text-muted-foreground">{insights.completedProjects} completed this period</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Trend Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Monthly Performance Trend</h3>
                <Badge variant="outline">Last {reportsData?.dateRange.months || 6} Months</Badge>
              </div>
              
              {/* Simple chart representation */}
              <div className="space-y-4">
                {reportsData?.monthlyData && reportsData.monthlyData.length > 0 ? (
                  reportsData.monthlyData.map((month, index) => (
                    <div key={month.month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.month}</span>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Revenue: €{month.revenue.toLocaleString()}</span>
                          <span>Margin: {month.marginPercent.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 h-6">
                        <div 
                          className="bg-chart-4 rounded-sm"
                          style={{ width: `${Math.min((month.revenue / 160000) * 100, 100)}%` }}
                        />
                        <div 
                          className="bg-chart-2 rounded-sm"
                          style={{ width: `${Math.min((month.margin / 40000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>No data available for the selected period</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-chart-4 rounded-sm mr-1" />
                  Revenue
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-chart-2 rounded-sm mr-1" />
                  Margin
                </div>
              </div>
            </Card>

            {/* Project Performance */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Project Margin Analysis</h3>
                <Badge variant="outline">Current Period</Badge>
              </div>
              
              <div className="space-y-4">
                {reportsData?.projectPerformance && reportsData.projectPerformance.length > 0 ? (
                  reportsData.projectPerformance.map((project) => (
                    <div key={project.projectId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium truncate">{project.projectName}</span>
                          <Badge 
                            variant={
                              project.status === 'on-track' ? 'default' : 
                              project.status === 'completed' ? 'secondary' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {project.status === 'on-track' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {project.status === 'at-risk' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {project.status === 'completed' && <Clock className="h-3 w-3 mr-1" />}
                            {project.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className={`font-bold text-sm ${
                          project.marginPercent > 25 ? 'text-chart-2' :
                          project.marginPercent > 15 ? 'text-chart-3' : 'text-destructive'
                        }`}>
                          {project.marginPercent.toFixed(1)}%
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            project.marginPercent > 25 ? 'bg-chart-2' :
                            project.marginPercent > 15 ? 'bg-chart-3' : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(Math.max(project.marginPercent * 2.5, 5), 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-8 w-8 mx-auto mb-2" />
                    <p>No project data available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Detailed Insights */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Invoice Status */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                <h3 className="text-lg font-medium">Invoice Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Invoices</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-chart-3 mr-1" />
                    <span className="font-medium">{insights.pendingInvoices}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overdue Invoices</span>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-destructive mr-1" />
                    <span className="font-medium text-destructive">{insights.overdueInvoices}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Collection Rate</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-chart-2 mr-1" />
                    <span className="font-medium">{insights.collectionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Cost Analysis */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <TrendingDown className="h-5 w-5 text-muted-foreground mr-2" />
                <h3 className="text-lg font-medium">Cost Breakdown</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Personnel</span>
                  <span className="font-medium">€{insights.costBreakdown.personnel.toLocaleString()} (75%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Infrastructure</span>
                  <span className="font-medium">€{insights.costBreakdown.infrastructure.toLocaleString()} (15%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">External Services</span>
                  <span className="font-medium">€{insights.costBreakdown.externalServices.toLocaleString()} (8%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Other</span>
                  <span className="font-medium">€{insights.costBreakdown.other.toLocaleString()} (2%)</span>
                </div>
              </div>
            </Card>

            {/* Performance Alerts */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mr-2" />
                <h3 className="text-lg font-medium">Performance Alerts</h3>
              </div>
              <div className="space-y-3">
                {insights.alerts.length > 0 ? (
                  insights.alerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className={`h-4 w-4 mt-0.5 ${
                        alert.severity === 'error' ? 'text-destructive' :
                        alert.severity === 'warning' ? 'text-chart-3' : 'text-chart-2'
                      }`}>
                        {alert.severity === 'error' && <AlertTriangle className="h-4 w-4" />}
                        {alert.severity === 'warning' && <Clock className="h-4 w-4" />}
                        {alert.severity === 'info' && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-chart-2" />
                    <p className="text-sm">All systems operating normally</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}