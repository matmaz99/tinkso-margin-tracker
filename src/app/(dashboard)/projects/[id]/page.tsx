'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectInfoEditor } from "@/components/project-info-editor"
import { ClientInvoicesTable } from "@/components/client-invoices-table"
import { useState, useEffect, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft,
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Euro, 
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2
} from "lucide-react"

// Real-time project data interface
interface ProjectData {
  id: string
  name: string
  description?: string
  client_name?: string
  start_date?: string
  end_date?: string
  status: string
  currency: string
  client_invoices: any[]
  manual_expenses: any[]
  processedSupplierInvoices: any[]
  financials: {
    revenue: { total: number; paid: number; pending: number; overdue: number; draft: number }
    costs: { total: number; manual: number; supplier: number }
    margin: { total: number; percentage: number }
  }
  invoiceStats: {
    client: { total: number; paid: number; pending: number; overdue: number; draft: number }
    supplier: { total: number; fullyAssigned: number; partiallyAssigned: number; unassigned: number }
  }
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [activeTab, setActiveTab] = useState('overview')
  const [includeVAT, setIncludeVAT] = useState(true)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const vatRate = 0.14 // 14% VAT
  const adjustForVAT = (amount: number) => includeVAT ? amount : amount / (1 + vatRate)

  // Fetch project data
  const fetchProjectData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${resolvedParams.id}`, {
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
        if (response.status === 404) {
          throw new Error('Project not found')
        }
        throw new Error('Failed to fetch project data')
      }

      const data = await response.json()
      setProjectData(data)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load project')
      console.error('Project fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle project updates
  const handleProjectUpdated = (updatedFields: any) => {
    // Update local state with the new field values
    if (projectData) {
      setProjectData(prev => prev ? { ...prev, ...updatedFields } : null)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchProjectData()
  }, [resolvedParams.id])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchProjectData()
  }

  // Use fallback data if API data not available
  const project = projectData || {
    id: resolvedParams.id,
    name: 'Loading...',
    description: '',
    client_name: '',
    start_date: '',
    end_date: '',
    status: 'active',
    currency: 'EUR',
    client_invoices: [],
    manual_expenses: [],
    processedSupplierInvoices: [],
    financials: { 
      revenue: { total: 0, paid: 0, pending: 0, overdue: 0, draft: 0 },
      costs: { total: 0, manual: 0, supplier: 0 },
      margin: { total: 0, percentage: 0 }
    },
    invoiceStats: {
      client: { total: 0, paid: 0, pending: 0, overdue: 0, draft: 0 },
      supplier: { total: 0, fullyAssigned: 0, partiallyAssigned: 0, unassigned: 0 }
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'client-invoices', label: `Client Invoices (${project.invoiceStats.client.total})`, icon: FileText },
    { id: 'supplier-invoices', label: `Supplier Invoices (${project.invoiceStats.supplier.total})`, icon: Upload },
    { id: 'additional-costs', label: `Additional Costs (${project.manual_expenses.length})`, icon: Plus }
  ]

  const statusConfig = {
    active: { variant: "default" as const, icon: CheckCircle, color: "text-chart-2" },
    completed: { variant: "secondary" as const, icon: CheckCircle, color: "text-muted-foreground" },
    "on-hold": { variant: "outline" as const, icon: AlertTriangle, color: "text-chart-3" }
  }

  const invoiceStatusConfig = {
    paid: { variant: "default" as const, icon: CheckCircle, color: "text-chart-2" },
    pending: { variant: "secondary" as const, icon: Clock, color: "text-chart-3" },
    overdue: { variant: "destructive" as const, icon: AlertTriangle, color: "text-destructive" },
    draft: { variant: "outline" as const, icon: Edit, color: "text-muted-foreground" }
  }

  // Loading state
  if (isLoading && !projectData) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-background">
          <div className="flex h-12 items-center px-4">
            <div className="flex items-center gap-4 flex-1">
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-sm font-medium text-foreground">Loading Project...</h1>
            </div>
          </div>
        </header>
        <main className="p-4">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading project details...</span>
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
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-sm font-medium text-foreground">Project Error</h1>
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
                <p className="text-foreground font-medium">Failed to load project</p>
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
    <>
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-sm font-medium text-foreground">{project?.name || 'Project Details'}</h1>
            <p className="text-xs text-muted-foreground">
              Detailed project overview with financial tracking
            </p>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              size="sm" 
              className="gap-1.5 h-7 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Sync Data'}
            </Button>
          </div>
        </div>
      </header>

     
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">

      {/* Project Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
              <span className="text-xs font-medium text-muted-foreground">TOTAL REVENUE</span>
            </div>
            <DollarSign className="h-3 w-3 text-chart-2" />
          </div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            {project.currency === 'EUR' ? '€' : '$'}{adjustForVAT(project.financials.revenue.paid).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {includeVAT ? 'Including VAT' : 'Excluding VAT'}
          </div>
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
            {project.currency === 'EUR' ? '€' : '$'}{adjustForVAT(project.financials.costs.total).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">All expenses included</div>
        </div>

        <div className="bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${project.financials.margin.total >= 0 ? 'bg-chart-2' : 'bg-destructive'} rounded-full`}></div>
              <span className="text-xs font-medium text-muted-foreground">NET MARGIN</span>
            </div>
            <Euro className={`h-3 w-3 ${project.financials.margin.total >= 0 ? 'text-chart-2' : 'text-destructive'}`} />
          </div>
          <div className={`text-2xl font-semibold mb-1 ${project.financials.margin.total >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
            {project.currency === 'EUR' ? '€' : '$'}{adjustForVAT(project.financials.margin.total).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {project.financials.margin.total >= 0 ? (
              <><TrendingUp className="inline h-3 w-3 mr-1" />Positive margin</>
            ) : (
              <><TrendingDown className="inline h-3 w-3 mr-1" />Negative margin</>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${project.financials.margin.percentage >= 25 ? 'bg-chart-2' : project.financials.margin.percentage >= 0 ? 'bg-chart-3' : 'bg-destructive'} rounded-full`}></div>
              <span className="text-xs font-medium text-muted-foreground">MARGIN %</span>
            </div>
            <TrendingUp className={`h-3 w-3 ${project.financials.margin.percentage >= 25 ? 'text-chart-2' : project.financials.margin.percentage >= 0 ? 'text-chart-3' : 'text-destructive'}`} />
          </div>
          <div className={`text-2xl font-semibold mb-1 ${project.financials.margin.percentage >= 25 ? 'text-chart-2' : project.financials.margin.percentage >= 0 ? 'text-chart-3' : 'text-destructive'}`}>
            {project.financials.margin.percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {project.financials.margin.percentage >= 25 ? 'Above target (25%)' : 
             project.financials.margin.percentage >= 0 ? 'Below target (25%)' : 'Loss project'}
          </div>
        </div>
      </div>

      {/* VAT Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant={includeVAT ? "default" : "outline"}
            size="sm"
            onClick={() => setIncludeVAT(true)}
          >
            Including VAT
          </Button>
          <Button
            variant={!includeVAT ? "default" : "outline"}
            size="sm"
            onClick={() => setIncludeVAT(false)}
          >
            Excluding VAT
          </Button>
        </div>
        <Badge variant={statusConfig[project.status as keyof typeof statusConfig].variant}>
          {project.status}
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Info */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Project Information</h3>
              <ProjectInfoEditor
                project={project}
                onProjectUpdated={handleProjectUpdated}
              />
            </Card>

            {/* Margin Trend Chart Placeholder */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Margin Evolution</h3>
              <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Chart will be implemented in Phase 3</p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'client-invoices' && (
          <ClientInvoicesTable
            projectId={resolvedParams.id}
            currency={project.currency}
            vatRate={vatRate}
            includeVAT={includeVAT}
          />
        )}

        {activeTab === 'supplier-invoices' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Supplier Invoices</h3>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Process New
              </Button>
            </div>
            <div className="space-y-4">
              {project.processedSupplierInvoices.length > 0 ? (
                project.processedSupplierInvoices.map((invoice) => (
                  <Link 
                    key={invoice.id} 
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invoice.supplier_name || 'Unknown Supplier'}</p>
                        <p className="text-sm text-muted-foreground">{invoice.description || 'No description'}</p>
                        <p className="text-xs text-muted-foreground">
                          Confidence: {invoice.confidenceScore || 0}% • {new Date(invoice.processedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {invoice.currency === 'EUR' ? '€' : '$'}{invoice.amount_total.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Assigned: {invoice.currency === 'EUR' ? '€' : '$'}{invoice.assignedAmount.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={
                        invoice.assignmentStatus === 'fully-assigned' ? 'default' :
                        invoice.assignmentStatus === 'partially-assigned' ? 'secondary' : 'outline'
                      }>
                        {invoice.assignmentStatus.replace('-', ' ')}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No supplier invoices assigned yet</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'additional-costs' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Additional Costs</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Cost
              </Button>
            </div>
            <div className="space-y-4">
              {project.manual_expenses.length > 0 ? (
                project.manual_expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{expense.description || 'Manual Expense'}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.category || 'Uncategorized'} • Added manually
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {project.currency === 'EUR' ? '€' : '$'}{expense.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No manual expenses added yet</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
        </div>
      </main>
    </>
  )
}