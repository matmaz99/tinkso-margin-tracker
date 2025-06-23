'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Upload, 
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Edit,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

// Real-time invoice data interface
interface InvoiceWithDetails {
  id: string
  invoiceNumber: string
  type: 'client' | 'supplier'
  projectName?: string
  clientSupplierName: string
  amount: number
  currency: string
  status: string
  issueDate: string
  dueDate?: string
  paidDate?: string
  description?: string
  documentUrl?: string
  isAutoDetected?: boolean
  vatAmount?: number
  netAmount: number
  projectId?: string
  clientId?: string
  qontoId?: string
}

interface InvoiceStatistics {
  client: {
    total: number
    paid: number
    pending: number
    overdue: number
    draft: number
    totalRevenue: number
    pendingRevenue: number
  }
  supplier: {
    total: number
    assigned: number
    unassigned: number
    totalCosts: number
    pendingCosts: number
  }
  combined: {
    total: number
    totalAmount: number
    netMargin: number
  }
}

const invoiceStatusConfig = {
  paid: { 
    label: "Paid", 
    variant: "default" as const, 
    icon: CheckCircle,
    color: "text-chart-2" 
  },
  pending: { 
    label: "Pending", 
    variant: "secondary" as const, 
    icon: Clock,
    color: "text-chart-3" 
  },
  overdue: { 
    label: "Overdue", 
    variant: "destructive" as const, 
    icon: AlertTriangle,
    color: "text-destructive" 
  },
  draft: { 
    label: "Draft", 
    variant: "outline" as const, 
    icon: Edit,
    color: "text-muted-foreground" 
  },
  sent: { 
    label: "Sent", 
    variant: "secondary" as const, 
    icon: Clock,
    color: "text-chart-4" 
  },
  cancelled: { 
    label: "Cancelled", 
    variant: "outline" as const, 
    icon: AlertTriangle,
    color: "text-muted-foreground" 
  },
  "pending-assignment": { 
    label: "Pending Assignment", 
    variant: "outline" as const, 
    icon: Clock,
    color: "text-chart-3" 
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [statistics, setStatistics] = useState<InvoiceStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch invoices data
  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/invoices?includeStatistics=true', {
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
        throw new Error('Failed to fetch invoices')
      }

      const data = await response.json()
      console.log('Invoices API Response:', data) // Debug log
      setInvoices(data.invoices || [])
      setStatistics(data.statistics || null)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices')
      console.error('Invoices fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchInvoices()
  }, [])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchInvoices()
  }

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientSupplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Calculate filtered stats
  const clientInvoices = filteredInvoices.filter(inv => inv.type === 'client')
  const supplierInvoices = filteredInvoices.filter(inv => inv.type === 'supplier')
  const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue')
  const totalRevenue = statistics?.client?.totalRevenue || 0
  const totalCosts = statistics?.supplier?.totalCosts || 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Invoices & Documents</h1>
            <span className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground rounded border border-border">
              {invoices.length} invoices
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
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-6 text-xs px-2 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-6 text-xs px-2 border border-border rounded bg-background text-foreground"
            >
              <option value="all">All Types</option>
              <option value="client">Client</option>
              <option value="supplier">Supplier</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-6 text-xs px-2 border border-border rounded bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
            </select>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Refresh'}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
            <Link href="/invoices/queue">
              <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
                <Clock className="h-3 w-3" />
                Process Queue ({statistics?.supplier?.unassigned || 0})
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
                <Plus className="h-3 w-3" />
                New Invoice
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
              <h2 className="text-lg font-medium text-foreground mb-1">Invoice Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage client and supplier invoices with automatic processing and project assignment
              </p>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL INVOICES</span>
                </div>
                <FileText className="h-3 w-3 text-primary" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{statistics?.combined?.total || 0}</div>
              <div className="text-xs text-muted-foreground">{statistics?.client?.total || 0} client, {statistics?.supplier?.total || 0} supplier</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">CLIENT REVENUE</span>
                </div>
                <DollarSign className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Paid invoices only</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">SUPPLIER COSTS</span>
                </div>
                <BarChart3 className="h-3 w-3 text-chart-4" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{totalCosts.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Paid expenses</div>
            </div>

            <Link href="/invoices/queue">
              <div className="bg-card border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                    <span className="text-xs font-medium text-muted-foreground">PENDING ACTION</span>
                  </div>
                  <AlertTriangle className="h-3 w-3 text-chart-3" />
                </div>
                <div className="text-2xl font-semibold text-foreground mb-1">{statistics?.supplier?.unassigned || 0}</div>
                <div className="text-xs text-muted-foreground">Click to process queue →</div>
              </div>
            </Link>
          </div>

          {/* Invoice Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'Filtered Invoices' : 'All Invoices'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {filteredInvoices.length} of {invoices.length} invoices
                </span>
                <Button 
                  variant={typeFilter === 'all' ? 'default' : 'ghost'}
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setTypeFilter('all')}
                >
                  All ({invoices.length})
                </Button>
                <Button 
                  variant={typeFilter === 'client' ? 'default' : 'ghost'}
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setTypeFilter('client')}
                >
                  Client ({statistics?.client?.total || 0})
                </Button>
                <Button 
                  variant={typeFilter === 'supplier' ? 'default' : 'ghost'}
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setTypeFilter('supplier')}
                >
                  Supplier ({statistics?.supplier?.total || 0})
                </Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'default' : 'ghost'}
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending ({statistics?.client?.pending || 0})
                </Button>
              </div>
            </div>

            {/* Loading state */}
            {isLoading && invoices.length === 0 && (
              <div className="bg-card border border-border p-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading invoices...</span>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-card border border-border p-8 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-foreground font-medium">Failed to load invoices</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button onClick={handleRefresh} className="mt-4">
                  Try Again
                </Button>
              </div>
            )}

            {/* Invoices List */}
            {!isLoading && !error && (
              <div className="bg-card border border-border">
                <div className="space-y-0">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice, index) => {
                      const statusConfig = invoiceStatusConfig[invoice.status as keyof typeof invoiceStatusConfig] || invoiceStatusConfig.pending
                      const StatusIcon = statusConfig.icon
                      const isClient = invoice.type === 'client'
                      
                      return (
                        <Link 
                          key={invoice.id} 
                          href={invoice.type === 'supplier' ? `/invoices/${invoice.id}` : '#'}
                          className={`flex items-center justify-between p-3 hover:bg-accent/50 transition-colors ${
                            invoice.type === 'supplier' ? 'cursor-pointer' : 'cursor-default'
                          } ${index < filteredInvoices.length - 1 ? 'border-b border-border' : ''}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-2 h-2 rounded-full ${
                              invoice.status === 'paid' ? 'bg-chart-2' :
                              invoice.status === 'pending' ? 'bg-chart-3' :
                              invoice.status === 'overdue' ? 'bg-destructive' :
                              'bg-muted'
                            }`}></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground">{invoice.invoiceNumber}</span>
                                <span className={`text-[10px] px-1.5 py-0 h-4 rounded border ${
                                  isClient ? 'bg-chart-2/10 text-chart-2 border-chart-2' : 'bg-chart-4/10 text-chart-4 border-chart-4'
                                }`}>
                                  {isClient ? 'Revenue' : 'Cost'}
                                </span>
                                {invoice.isAutoDetected && (
                                  <span className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground rounded border border-border">
                                    Auto-detected
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {invoice.clientSupplierName} {invoice.projectName ? `• ${invoice.projectName}` : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                isClient ? 'text-chart-2' : 'text-chart-4'
                              }`}>
                                {invoice.currency === 'EUR' ? '€' : '$'}{invoice.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {invoice.dueDate ? `Due: ${new Date(invoice.dueDate).toLocaleDateString()}` : 'No due date'}
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0 h-4 rounded border flex items-center ${
                              invoice.status === 'paid' ? 'bg-chart-2/10 text-chart-2 border-chart-2' :
                              invoice.status === 'pending' ? 'bg-chart-3/10 text-chart-3 border-chart-3' :
                              invoice.status === 'overdue' ? 'bg-destructive/10 text-destructive border-destructive' :
                              'bg-muted text-muted-foreground border-border'
                            }`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </span>
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'No matching invoices' : 'No invoices yet'}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                          ? 'Try adjusting your search criteria'
                          : 'Create your first invoice to start tracking finances'
                        }
                      </p>
                      {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                        <Link href="/invoices/new">
                          <Button size="sm">Create Invoice</Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}