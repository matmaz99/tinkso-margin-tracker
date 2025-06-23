'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  DollarSign, 
  Euro, 
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText
} from "lucide-react"
import Link from "next/link"

// Real-time projects data interface
interface ProjectWithFinancials {
  id: string
  name: string
  description?: string
  client_name?: string
  currency: string
  status: string
  start_date?: string
  end_date?: string
  updated_at: string
  financials?: {
    revenue: { total: number; paid: number; pending: number; overdue: number }
    costs: { total: number; manual: number; supplier: number }
    margin: { total: number; percentage: number }
  }
  invoiceStats?: {
    client: { total: number; paid: number; pending: number; overdue: number }
    supplier: { total: number; fullyAssigned: number; partiallyAssigned: number; unassigned: number }
  }
}

const projectStatusConfig = {
  "active": { 
    label: "Active", 
    variant: "default" as const, 
    icon: CheckCircle,
    color: "text-chart-2" 
  },
  "completed": { 
    label: "Completed", 
    variant: "secondary" as const, 
    icon: CheckCircle,
    color: "text-muted-foreground" 
  },
  "on-hold": { 
    label: "On Hold", 
    variant: "outline" as const, 
    icon: AlertTriangle,
    color: "text-chart-3" 
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithFinancials[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch projects data
  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/projects?includeFinancials=true', {
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
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects || [])
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load projects')
      console.error('Projects fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchProjects()
  }

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate summary stats from real data
  const summaryStats = projects.reduce((acc, project) => {
    acc.total += 1
    if (project.status === 'active') acc.active += 1
    if (project.status === 'completed') acc.completed += 1
    if (project.financials) {
      acc.totalRevenue += project.financials.revenue.paid
      acc.totalCosts += project.financials.costs.total
      acc.totalMargin += project.financials.margin.total
    }
    return acc
  }, {
    total: 0,
    active: 0,
    completed: 0,
    totalRevenue: 0,
    totalCosts: 0,
    totalMargin: 0
  })

  const averageMarginPercentage = summaryStats.totalRevenue > 0 
    ? (summaryStats.totalMargin / summaryStats.totalRevenue) * 100 
    : 0

  // Loading state
  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-background">
          <div className="flex h-12 items-center px-4">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-sm font-medium text-foreground">Projects</h1>
            </div>
          </div>
        </header>
        <main className="p-4">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading projects...</span>
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
              <h1 className="text-sm font-medium text-foreground">Projects</h1>
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
                <p className="text-foreground font-medium">Failed to load projects</p>
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Projects</h1>
            <span className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground rounded border border-border">
              {projects.length} projects
            </span>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-6 text-xs px-2 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-6 text-xs px-2 border border-border rounded bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              size="sm" 
              variant="ghost"
              className="gap-1.5 h-7 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Refresh'}
            </Button>
            <Link href="/projects/new">
              <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
                <Plus className="h-3 w-3" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground mb-1">Project Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage project margins and track financial performance across all client work
              </p>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL PROJECTS</span>
                </div>
                <BarChart3 className="h-3 w-3 text-primary" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{summaryStats.total}</div>
              <div className="text-xs text-muted-foreground">{summaryStats.active} active</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL REVENUE</span>
                </div>
                <DollarSign className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{summaryStats.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Across all projects</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL MARGIN</span>
                </div>
                <Euro className="h-3 w-3 text-chart-4" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{summaryStats.totalMargin.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{averageMarginPercentage.toFixed(1)}% overall</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL COSTS</span>
                </div>
                <BarChart3 className="h-3 w-3 text-chart-3" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{summaryStats.totalCosts.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">All expenses</div>
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">
                {searchTerm || statusFilter !== 'all' ? 'Filtered Projects' : 'All Projects'}
              </h3>
              <span className="text-xs text-muted-foreground">
                {filteredProjects.length} of {projects.length} projects
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const statusConfig = projectStatusConfig[project.status as keyof typeof projectStatusConfig]
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <Card key={project.id} className="bg-card border border-border p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <Link href={`/projects/${project.id}`}>
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                project.status === 'active' ? 'bg-chart-2/10' :
                                project.status === 'completed' ? 'bg-muted/50' :
                                'bg-chart-3/10'
                              }`}>
                                <div className={`w-4 h-4 rounded-full ${
                                  project.status === 'active' ? 'bg-chart-2' :
                                  project.status === 'completed' ? 'bg-muted-foreground' :
                                  'bg-chart-3'
                                }`}></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs truncate">{project.name}</h4>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {project.client_name || 'No client assigned'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Financial Metrics */}
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Revenue</p>
                              <p className="font-semibold text-xs">
                                {project.financials ? 
                                  `${project.currency === 'EUR' ? '€' : '$'}${(project.financials.revenue.paid / 1000).toFixed(0)}k` 
                                  : '€0'
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Margin</p>
                              <p className={`font-semibold text-xs ${
                                project.financials && project.financials.margin.total >= 0 ? 'text-chart-2' : 'text-destructive'
                              }`}>
                                {project.financials ? `${project.financials.margin.percentage.toFixed(1)}%` : '0%'}
                              </p>
                            </div>
                          </div>

                          {/* Project Details */}
                          <div className="space-y-2">
                            <div className="flex items-center text-[10px] text-muted-foreground">
                              <DollarSign className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span>Costs: {project.financials ? 
                                `${project.currency === 'EUR' ? '€' : '$'}${(project.financials.costs.total / 1000).toFixed(0)}k` 
                                : '€0'
                              }</span>
                            </div>
                            <div className="flex items-center text-[10px] text-muted-foreground">
                              <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span>{project.invoiceStats?.client.total || 0} invoice{(project.invoiceStats?.client.total || 0) !== 1 ? 's' : ''}</span>
                            </div>
                            {project.end_date && (
                              <div className="flex items-center text-[10px] text-muted-foreground">
                                <Calendar className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span>Due {new Date(project.end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Currency & Updated Info */}
                          <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
                              <span>Currency: {project.currency}</span>
                            </div>
                            <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  )
                })
              ) : (
                <div className="bg-card border border-border p-8 text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    {searchTerm || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search criteria'
                      : 'Create your first project to start tracking margins'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Link href="/projects/new">
                      <Button size="sm">Create Project</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}