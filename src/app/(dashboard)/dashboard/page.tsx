'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Euro, 
  RefreshCw,
  Calendar,
  Filter,
  AlertTriangle,
  Clock,
  FileText,
  Eye 
} from "lucide-react"
import Link from "next/link"

// Dashboard with real-time data from Supabase
interface DashboardData {
  projects: any[]
  summary: {
    projects: { total: number; active: number }
    invoices: { pending: number; overdue: number }
    financials: {
      totalRevenue: number
      totalCosts: number
      totalMargin: number
      marginPercentage: number
    }
  }
  timestamp: string
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if not authenticated
          window.location.href = '/login'
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setDashboardData(data)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData()
  }

  // Loading state
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-background">
          <div className="flex h-12 items-center px-4">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-sm font-medium text-foreground">Dashboard</h1>
            </div>
          </div>
        </header>
        <main className="p-4">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading dashboard...</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-background">
          <div className="flex h-12 items-center px-4">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-sm font-medium text-foreground">Dashboard</h1>
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
                <p className="text-foreground font-medium">Failed to load dashboard</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button onClick={handleRefresh} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Use fallback data if API data not available
  const summary = dashboardData?.summary || {
    projects: { total: 0, active: 0 },
    invoices: { pending: 0, overdue: 0 },
    financials: { totalRevenue: 0, totalCosts: 0, totalMargin: 0, marginPercentage: 0 }
  }

  const projects = dashboardData?.projects || []

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Dashboard</h1>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Calendar className="h-3 w-3 mr-1" />
              This Month
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Filter className="h-3 w-3 mr-1" />
              EUR
            </Button>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                <Eye className="h-3 w-3 mr-1" />
                View All
              </Button>
            </Link>
            <Link href="/invoices/queue">
              <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
                <Clock className="h-3 w-3" />
                Process ({summary.invoices.pending})
              </Button>
            </Link>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              size="sm" 
              className="gap-1.5 h-7 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Sync Now'}
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
              <h2 className="text-lg font-medium text-foreground mb-1">Margin Tracker Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Real-time project margin tracking and financial overview
              </p>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL REVENUE</span>
                </div>
                <DollarSign className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">
                €{summary.financials.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">From paid invoices</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL COSTS</span>
                </div>
                <BarChart3 className="h-3 w-3 text-chart-3" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">
                €{summary.financials.totalCosts.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">All expenses</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL MARGIN</span>
                </div>
                <Euro className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">
                €{summary.financials.totalMargin.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Net profit</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">MARGIN %</span>
                </div>
                <TrendingUp className="h-3 w-3 text-chart-4" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">
                {summary.financials.marginPercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Overall margin</div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">Active Projects</h3>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  View all
                </Button>
              </Link>
            </div>

            <div className="grid gap-4">
              {projects.slice(0, 3).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="bg-card border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-foreground">{project.name}</h4>
                            <span className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground rounded border border-border">
                              {project.currency || 'EUR'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {project.description || 'Financial tracking'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Margin: {project.currency === 'EUR' ? '€' : '$'}
                            {project.financials?.margin?.total?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {project.financials?.margin?.percentage?.toFixed(1) || '0'}% margin
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          Revenue: {project.currency === 'EUR' ? '€' : '$'}
                          {project.financials?.revenue?.total?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              {projects.length === 0 && (
                <div className="bg-card border border-border p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-foreground mb-1">No projects yet</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first project to start tracking margins
                  </p>
                  <Link href="/projects/new">
                    <Button size="sm">Create Project</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">Quick Actions</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Unassigned Invoices Alert */}
              <Link href="/invoices/queue">
                <div className="bg-card border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-chart-3 mr-3" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Unassigned Invoices</h4>
                        <p className="text-xs text-muted-foreground">
                          {summary.invoices.pending} invoices need assignment
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-chart-3">
                      {summary.invoices.pending}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Click to process queue →
                  </div>
                </div>
              </Link>

              {/* Process Invoices Quick Action */}
              <Link href="/invoices/queue">
                <div className="bg-card border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-chart-4 mr-3" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Process Queue</h4>
                        <p className="text-xs text-muted-foreground">Assign invoices to projects</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    Go to processing queue →
                  </div>
                </div>
              </Link>

              {/* New Invoice Quick Action */}
              <Link href="/invoices/new">
                <div className="bg-card border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-chart-2 mr-3" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Create Invoice</h4>
                        <p className="text-xs text-muted-foreground">Generate new client invoice</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    Create new invoice →
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}