'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  BarChart3,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

// Real-time client data interface
interface ClientWithDetails {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  country?: string
  currency?: string
  vat_number?: string
  qonto_id?: string
  is_active?: boolean
  totalRevenue: number
  totalProjects: number
  activeProjects: number
  lastInvoiceDate?: string
  paymentTerms?: string
  projectNames: string[]
  recentActivity: string
  qontoStatus: 'connected' | 'pending' | 'error'
  status: string
  created_at: string
  updated_at: string
}

interface ClientStatistics {
  total: number
  active: number
  inactive: number
  onHold: number
  totalRevenue: number
  totalProjects: number
  averageRevenuePerClient: number
  recentActivityCount: number
}

const clientStatusConfig = {
  active: { 
    label: "Active", 
    variant: "default" as const, 
    icon: CheckCircle,
    color: "text-chart-2" 
  },
  inactive: { 
    label: "Inactive", 
    variant: "secondary" as const, 
    icon: Clock,
    color: "text-muted-foreground" 
  },
  "on-hold": { 
    label: "On Hold", 
    variant: "outline" as const, 
    icon: AlertTriangle,
    color: "text-chart-3" 
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithDetails[]>([])
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch clients data
  const fetchClients = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/clients?includeStatistics=true&includeProjects=true', {
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
        throw new Error('Failed to fetch clients')
      }

      const data = await response.json()
      setClients(data.clients || [])
      setStatistics(data.statistics || null)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load clients')
      console.error('Clients fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchClients()
  }

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.projectNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate summary stats from statistics
  const activeClients = statistics?.active || 0
  const totalRevenue = statistics?.totalRevenue || 0
  const totalProjects = statistics?.totalProjects || 0
  const averageRevenue = statistics?.averageRevenuePerClient || 0

  // Loading state
  if (isLoading && clients.length === 0) {
    return (
      <>
        <header className="border-b border-border bg-background">
          <div className="flex h-12 items-center px-4">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-sm font-medium text-foreground">Clients</h1>
            </div>
          </div>
        </header>
        <main className="p-4">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading clients...</span>
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
              <h1 className="text-sm font-medium text-foreground">Clients</h1>
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
                <p className="text-foreground font-medium">Failed to load clients</p>
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

  return (
    <>
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Clients</h1>
            <span className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground rounded border border-border">
              {clients.length} clients
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
              placeholder="Search clients..."
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
              <option value="inactive">Inactive</option>
              <option value="on-hold">On Hold</option>
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
            <Link href="/clients/new">
              <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
                <Plus className="h-3 w-3" />
                Add Client
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
              <h2 className="text-lg font-medium text-foreground mb-1">Client Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage client relationships and project assignments from Qonto integration
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL CLIENTS</span>
                </div>
                <Building2 className="h-3 w-3 text-primary" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{statistics?.total || 0}</div>
              <div className="text-xs text-muted-foreground">{activeClients} active</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL REVENUE</span>
                </div>
                <DollarSign className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Across all clients</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL PROJECTS</span>
                </div>
                <BarChart3 className="h-3 w-3 text-chart-4" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{totalProjects}</div>
              <div className="text-xs text-muted-foreground">All projects combined</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">AVERAGE REVENUE</span>
                </div>
                <CheckCircle className="h-3 w-3 text-chart-3" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">€{Math.round(averageRevenue).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Per client</div>
            </div>
          </div>

          {/* Client Status Filter */}
          <div className="flex items-center gap-2">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              className="h-7 px-3 text-xs"
              onClick={() => setStatusFilter('all')}
            >
              All Clients ({clients.length})
            </Button>
            <Button 
              variant={statusFilter === 'active' ? 'default' : 'outline'} 
              size="sm" 
              className="h-7 px-3 text-xs"
              onClick={() => setStatusFilter('active')}
            >
              Active ({statistics?.active || 0})
            </Button>
            <Button 
              variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
              size="sm" 
              className="h-7 px-3 text-xs"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive ({statistics?.inactive || 0})
            </Button>
            <Button 
              variant={statusFilter === 'on-hold' ? 'default' : 'outline'} 
              size="sm" 
              className="h-7 px-3 text-xs"
              onClick={() => setStatusFilter('on-hold')}
            >
              On Hold ({statistics?.onHold || 0})
            </Button>
          </div>

          {/* Clients Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">
                {searchTerm || statusFilter !== 'all' ? 'Filtered Clients' : 'All Clients'}
              </h3>
              <span className="text-xs text-muted-foreground">
                {filteredClients.length} of {clients.length} clients
              </span>
            </div>

            {filteredClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => {
                  const statusConfig = clientStatusConfig[client.status as keyof typeof clientStatusConfig] || clientStatusConfig.inactive
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <Card key={client.id} className="bg-card border border-border p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <Link href={`/clients/${client.id}`}>
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-chart-4/10 rounded-lg flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-chart-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs truncate">{client.name}</h4>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {client.projectNames.length > 0 ? client.projectNames.join(', ') : 'No projects'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Contact Information */}
                          <div className="space-y-2">
                            {client.email && (
                              <div className="flex items-center text-[10px] text-muted-foreground">
                                <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center text-[10px] text-muted-foreground">
                                <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                            {client.address && (
                              <div className="flex items-center text-[10px] text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span className="truncate">{client.address}</span>
                              </div>
                            )}
                          </div>

                          {/* Financial & Project Metrics */}
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Total Revenue</p>
                              <p className="font-semibold text-xs">
                                {client.currency === 'EUR' ? '€' : '$'}{client.totalRevenue.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Projects</p>
                              <p className="font-semibold text-xs">
                                {client.totalProjects} total, {client.activeProjects} active
                              </p>
                            </div>
                          </div>

                          {/* Payment Information */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Payment Terms</p>
                              <p className="font-medium text-xs">{client.paymentTerms || 'Net 30'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground">Last Invoice</p>
                              <p className="font-medium text-xs">
                                {client.lastInvoiceDate ? new Date(client.lastInvoiceDate).toLocaleDateString() : 'None'}
                              </p>
                            </div>
                          </div>

                          {/* Qonto Integration Status */}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                client.qontoStatus === 'connected' ? 'bg-chart-2' : 
                                client.qontoStatus === 'pending' ? 'bg-chart-3' : 'bg-destructive'
                              }`}></div>
                              <span>Qonto: {client.qonto_id || 'Not connected'}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="bg-card border border-border p-8 text-center">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {searchTerm || statusFilter !== 'all' ? 'No matching clients' : 'No clients yet'}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search criteria'
                    : 'Add your first client to start managing relationships'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Link href="/clients/new">
                    <Button size="sm">Add Client</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}