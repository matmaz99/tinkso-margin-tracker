'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft,
  FileText, 
  Upload, 
  Download, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Settings,
  Zap,
  Brain,
  Target,
  SplitSquareVertical,
  Plus,
  RefreshCw,
  File,
  Bot
} from "lucide-react"
import { InvoicePdfViewer } from '@/components/invoice-pdf-viewer'
import Link from "next/link"

// Real-time supplier invoice data interfaces
interface SupplierInvoiceWithDetails {
  id: string
  qontoId?: string
  supplierName: string
  amountTotal: number
  amountNet?: number
  amountVat?: number
  currency: string
  invoiceDate: string
  processingDate: string
  description?: string
  pdfUrl?: string
  attachmentId?: string
  qontoTransactionId?: string
  status: string
  isProcessed: boolean
  created_at: string
  updated_at: string
  aiExtraction?: {
    confidence: number
    projectMatches: {
      projectName: string
      confidence: number
      keywords: string[]
    }[]
    extractedText?: string
    processingStatus?: string
  }
  assignments?: {
    projectId: string
    projectName: string
    amountAssigned: number
    percentage?: number
    assignmentType: string
    assignedBy?: string
    assignedAt: string
  }[]
}

interface SupplierInvoiceStatistics {
  total: number
  totalAmount: number
  byStatus: {
    status: string
    count: number
    amount: number
  }[]
  averageAmount: number
  pendingAssignmentCount: number
  highConfidenceCount: number
  processingStats: {
    totalProcessed: number
    avgConfidence: number
    recentProcessingCount: number
  }
}

interface ProjectOption {
  id: string
  name: string
  status: string
}

export default function SupplierInvoiceQueuePage() {
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoiceWithDetails[]>([])
  const [statistics, setStatistics] = useState<SupplierInvoiceStatistics | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [splitAmounts, setSplitAmounts] = useState<{[key: string]: number}>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("") 
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState<{[key: string]: boolean}>({})
  
  // Fetch supplier invoices data
  const fetchSupplierInvoices = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        includeStatistics: 'true',
        unassignedOnly: 'true',
        includeAI: 'true',
        includeAssignments: 'true'
      })
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/supplier-invoices?${params}`, {
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
        throw new Error('Failed to fetch supplier invoices')
      }

      const data = await response.json()
      console.log('Supplier Invoices API Response:', data) // Debug log
      console.log('Current selectedInvoice:', selectedInvoice) // Debug selected invoice
      
      const invoices = data.supplierInvoices || []
      setSupplierInvoices(invoices)
      setStatistics(data.statistics || null)
      setLastRefresh(new Date())
      
      // Check if selected invoice still exists after refresh
      if (selectedInvoice && !invoices.find((inv: any) => inv.id === selectedInvoice)) {
        console.log('Selected invoice no longer exists, clearing selection')
        setSelectedInvoice(null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load supplier invoices')
      console.error('Supplier invoices fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch projects for assignment dropdown
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchSupplierInvoices()
    fetchProjects()
  }, [statusFilter])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchSupplierInvoices()
  }

  // Handle OCR processing for specific invoice
  const handleOCRProcessing = async (invoiceId: string) => {
    try {
      setOcrProcessing(prev => ({ ...prev, [invoiceId]: true }))
      
      const response = await fetch(`/api/supplier-invoices/${invoiceId}/process-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'OCR processing failed')
      }

      const result = await response.json()
      console.log('OCR processing result:', result)
      
      // Refresh the invoice data to show updated OCR results
      await fetchSupplierInvoices()
      
    } catch (err: any) {
      setError(err.message || 'Failed to process OCR')
      console.error('Error processing OCR:', err)
    } finally {
      setOcrProcessing(prev => ({ ...prev, [invoiceId]: false }))
    }
  }
  
  // Handle invoice assignment
  const handleAssignInvoice = async (invoiceId: string, projectAssignments: any[]) => {
    try {
      setIsProcessing(true)
      
      const response = await fetch('/api/supplier-invoices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: invoiceId,
          status: 'assigned',
          projectAssignments
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign invoice')
      }

      // Refresh data after successful assignment
      await fetchSupplierInvoices()
      setSelectedInvoice(null)
      setSelectedProjects([])
      setSplitAmounts({})
    } catch (err: any) {
      setError(err.message || 'Failed to assign invoice')
      console.error('Error assigning invoice:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const statusConfig = {
    "pending-assignment": { 
      variant: "secondary" as const, 
      icon: Clock, 
      color: "text-chart-3",
      label: "Pending Assignment"
    },
    "low-confidence": { 
      variant: "outline" as const, 
      icon: AlertTriangle, 
      color: "text-chart-3",
      label: "Low Confidence"
    },
    "no-match": { 
      variant: "destructive" as const, 
      icon: AlertTriangle, 
      color: "text-destructive",
      label: "No Match"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-chart-2"
    if (confidence >= 60) return "text-chart-3"
    return "text-destructive"
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return "default"
    if (confidence >= 60) return "secondary"
    return "destructive"
  }
  
  // Filter invoices based on search term
  const filteredInvoices = supplierInvoices.filter(invoice => {
    // Add null check for supplierName
    if (!invoice || !invoice.supplierName) {
      console.warn('Invalid invoice data:', invoice)
      return false
    }
    
    const matchesSearch = invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  // Debug log when selected invoice changes
  if (selectedInvoice) {
    const foundInvoice = filteredInvoices.find(i => i.id === selectedInvoice)
    if (!foundInvoice) {
      console.warn('Selected invoice not found in filtered list:', selectedInvoice)
      console.log('Available filtered invoices:', filteredInvoices.map(i => ({ id: i.id, name: i.supplierName })))
    }
  }

  return (
    <>
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-10 items-center px-3">
          <div className="flex items-center gap-3 flex-1">
            <Link href="/invoices">
              <Button variant="outline" size="sm" className="h-5 text-[10px] px-2">
                <ArrowLeft className="h-2.5 w-2.5 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-xs font-medium text-foreground">Supplier Invoice Queue</h1>
            <span className="text-[9px] px-1 py-0 h-3.5 bg-muted text-muted-foreground rounded border border-border">
              {supplierInvoices.length} unassigned
            </span>
            {lastRefresh && (
              <span className="text-[10px] text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            {isLoading && (
              <span className="text-[10px] text-muted-foreground">Loading...</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent">
              <Search className="h-2.5 w-2.5 mr-1" />
              Search
            </Button>
            <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent">
              <Filter className="h-2.5 w-2.5 mr-1" />
              Filter
            </Button>
            <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent">
              <Settings className="h-2.5 w-2.5 mr-1" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent">
              <Bot className="h-2.5 w-2.5 mr-1" />
              High Conf
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              size="sm" 
              className="gap-1 h-6 px-2 text-[10px] font-medium"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3">
        <div className="max-w-[1200px] mx-auto space-y-4">

          {/* Queue Progress */}
          <Card className="bg-card border border-border p-3">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[10px] font-medium">Queue Progress</h3>
              <span className="text-[9px] text-muted-foreground">
                {statistics?.pendingAssignmentCount || 0} / {statistics?.total || 0} remaining
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${statistics?.total ? ((statistics.total - statistics.pendingAssignmentCount) / statistics.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </Card>

          {/* Summary Stats */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border border-border p-3">
              <div className="flex items-center">
                <Upload className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="ml-1.5 text-[10px] font-medium">Pending Assignment</span>
              </div>
              <div className="mt-1.5">
                <div className="text-sm font-bold">{statistics?.pendingAssignmentCount || 0}</div>
                <p className="text-[9px] text-muted-foreground">
                  Ready for processing
                </p>
              </div>
            </Card>

            <Card className="bg-card border border-border p-3">
              <div className="flex items-center">
                <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="ml-1.5 text-[10px] font-medium">High Confidence</span>
              </div>
              <div className="mt-1.5">
                <div className="text-sm font-bold">
                  {statistics?.highConfidenceCount || 0}
                </div>
                <p className="text-[9px] text-muted-foreground">
                  AI matches ≥80%
                </p>
              </div>
            </Card>

            <Card className="bg-card border border-border p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="ml-1.5 text-[10px] font-medium">Low Confidence</span>
              </div>
              <div className="mt-1.5">
                <div className="text-sm font-bold">
                  {statistics?.byStatus.find(s => s.status === 'low-confidence')?.count || 0}
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Needs manual review
                </p>
              </div>
            </Card>

            <Card className="bg-card border border-border p-3">
              <div className="flex items-center">
                <Target className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="ml-1.5 text-[10px] font-medium">Total Value</span>
              </div>
              <div className="mt-1.5">
                <div className="text-sm font-bold">
                  €{(statistics?.totalAmount || 0).toLocaleString()}
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Unassigned amount
                </p>
              </div>
            </Card>
          </div>

      {/* Main Content - Enhanced 3-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4 h-[calc(100vh-280px)]">
        {/* Panel 1 - Invoice List (30% on desktop) */}
        <div className="lg:col-span-1 xl:col-span-4">
          <Card className="p-3 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Unassigned Invoices</h3>
            <div className="flex items-center space-x-1.5">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">{filteredInvoices.length} invoices</Badge>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Process Selected
              </Button>
            </div>
          </div>
          
          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {/* Loading state */}
            {isLoading && supplierInvoices.length === 0 && (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading supplier invoices...</span>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">Error: {error}</span>
                </div>
              </div>
            )}

            {filteredInvoices.map((invoice) => {
              const statusConf = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig['pending-assignment']
              const StatusIcon = statusConf.icon
              const isSelected = selectedInvoice === invoice.id
              
              return (
                <div 
                  key={invoice.id} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedInvoice(invoice.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{invoice.supplierName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{invoice.description || 'No description'}</p>
                      </div>
                    </div>
                    <Badge variant={statusConf.variant} className="flex items-center text-[10px] px-1.5 py-0.5 h-5 ml-2 flex-shrink-0">
                      <StatusIcon className="h-2.5 w-2.5 mr-1" />
                      {statusConf.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Amount</p>
                      <p className="font-semibold text-xs">€{invoice.amountTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Date</p>
                      <p className="font-semibold text-xs">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* AI Confidence & Matches */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Brain className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {invoice.aiExtraction?.confidence ? 'AI Confidence' : 'No AI Analysis'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant={getConfidenceBadge(invoice.aiExtraction?.confidence || 0)} className="text-[10px] px-1.5 py-0.5 h-4">
                          {invoice.aiExtraction?.confidence || 0}%
                        </Badge>
                        {invoice.attachmentId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOCRProcessing(invoice.id)
                            }}
                            disabled={ocrProcessing[invoice.id]}
                            title={invoice.aiExtraction?.confidence ? "Re-analyze with AI Vision" : "Analyze with AI Vision"}
                          >
                            {ocrProcessing[invoice.id] ? (
                              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <Brain className="h-2.5 w-2.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {invoice.aiExtraction?.projectMatches && invoice.aiExtraction.projectMatches.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">AI Project Matches:</p>
                        {invoice.aiExtraction.projectMatches.slice(0, 2).map((match, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[10px]">
                            <span className="truncate">{match.projectName}</span>
                            <span className={getConfidenceColor(match.confidence)}>
                              {match.confidence}%
                            </span>
                          </div>
                        ))}
                        {invoice.aiExtraction.projectMatches.length > 2 && (
                          <p className="text-[9px] text-muted-foreground">
                            +{invoice.aiExtraction.projectMatches.length - 2} more matches
                          </p>
                        )}
                      </div>
                    )}

                    {!invoice.aiExtraction?.projectMatches?.length && invoice.attachmentId && (
                      <div className="text-center py-1">
                        <p className="text-[9px] text-muted-foreground">
                          {invoice.aiExtraction?.confidence ? 'No project matches found' : 'Click to analyze PDF with AI Vision'}
                        </p>
                      </div>
                    )}

                    {!invoice.attachmentId && (
                      <div className="text-center py-1">
                        <p className="text-[9px] text-muted-foreground">
                          No PDF available for AI analysis
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground">
                      Processed: {new Date(invoice.processingDate).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" className="h-5 w-5 p-0">
                        <Eye className="h-2.5 w-2.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-5 w-5 p-0">
                        <Download className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Empty state */}
            {!isLoading && filteredInvoices.length === 0 && (
              <div className="text-center py-6">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-xs text-muted-foreground mb-1">No unassigned supplier invoices found</p>
                <p className="text-[10px] text-muted-foreground">New invoices will appear here when they're imported from Qonto</p>
              </div>
            )}
          </div>
          </Card>
        </div>

        {/* Panel 2 - PDF Viewer (40% on desktop, hidden on smaller screens) */}
        <div className="hidden xl:block xl:col-span-5">
          <InvoicePdfViewer 
            selectedInvoice={filteredInvoices.find(i => i.id === selectedInvoice)} 
            className="h-full"
          />
        </div>

        {/* Panel 3 - Assignment Interface (30% on desktop) */}
        <div className="lg:col-span-1 xl:col-span-3">
          <Card className="p-3 h-full flex flex-col">
          {selectedInvoice ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Project Assignment</h3>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                  <File className="h-3 w-3 mr-1" />
                  View PDF
                </Button>
              </div>
              
              {(() => {
                const invoice = filteredInvoices.find(i => i.id === selectedInvoice)
                if (!invoice) {
                  return (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Invoice not found</p>
                    </div>
                  )
                }
                return (
                  <div className="space-y-3">
                    {/* Invoice Details */}
                    <div className="p-3 bg-muted rounded-md">
                      <h4 className="font-medium text-xs mb-1.5">{invoice.supplierName}</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Total Amount</p>
                          <p className="font-semibold">€{invoice.amountTotal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Net Amount</p>
                          <p className="font-semibold">€{(invoice.amountNet || invoice.amountTotal).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Vision Project Suggestions */}
                    {invoice.aiExtraction?.projectMatches && invoice.aiExtraction.projectMatches.length > 0 && (
                      <div>
                        <h4 className="font-medium text-xs mb-2 flex items-center">
                          <Brain className="h-3 w-3 mr-1.5" />
                          AI Vision Matches
                        </h4>
                        <div className="space-y-1.5">
                          {invoice.aiExtraction.projectMatches.map((match, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-[10px] truncate">{match.projectName}</p>
                                <p className="text-[9px] text-muted-foreground truncate">
                                  Keywords: {match.keywords?.join(", ") || 'No keywords'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                                <Badge variant={getConfidenceBadge(match.confidence)} className="text-[9px] px-1 py-0.5 h-4">
                                  {match.confidence}%
                                </Badge>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-5 px-1.5 text-[9px]"
                                  onClick={() => {
                                    const project = projects.find(p => p.name === match.projectName)
                                    if (project && !selectedProjects.includes(project.id)) {
                                      setSelectedProjects([...selectedProjects, project.id])
                                    }
                                  }}
                                >
                                  <Plus className="h-2.5 w-2.5 mr-0.5" />
                                  Assign
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Vision Processing */}
                    {invoice.attachmentId && (!invoice.aiExtraction?.projectMatches || invoice.aiExtraction.projectMatches.length === 0) && (
                      <div>
                        <h4 className="font-medium text-xs mb-2 flex items-center">
                          <Brain className="h-3 w-3 mr-1.5" />
                          AI Vision Analysis
                        </h4>
                        <div className="text-center p-3 border rounded-md bg-muted/30">
                          <p className="text-[10px] text-muted-foreground mb-2">
                            {invoice.aiExtraction?.confidence 
                              ? 'No project matches found in document' 
                              : 'Use AI Vision to analyze PDF and find project matches'
                            }
                          </p>
                          <Button
                            size="sm"
                            className="h-6 px-3 text-[10px]"
                            onClick={() => handleOCRProcessing(invoice.id)}
                            disabled={ocrProcessing[invoice.id]}
                          >
                            {ocrProcessing[invoice.id] ? (
                              <>
                                <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Brain className="h-2.5 w-2.5 mr-1" />
                                {invoice.aiExtraction?.confidence ? 'Re-analyze with AI' : 'Analyze with AI Vision'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Manual Project Selection */}
                    <div>
                      <h4 className="font-medium text-xs mb-2">Manual Assignment</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-medium mb-1">Select Project(s)</label>
                          <select 
                            className="w-full p-1.5 border rounded-md text-xs"
                            value=""
                            onChange={(e) => {
                              const projectId = e.target.value
                              if (projectId && !selectedProjects.includes(projectId)) {
                                setSelectedProjects([...selectedProjects, projectId])
                              }
                            }}
                          >
                            <option value="">Choose a project...</option>
                            {projects.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.name} ({project.status})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Show selected projects */}
                        {selectedProjects.length > 0 && (
                          <div>
                            <label className="block text-[10px] font-medium mb-1">Selected Projects:</label>
                            <div className="space-y-1">
                              {selectedProjects.map(projectId => {
                                const project = projects.find(p => p.id === projectId)
                                return (
                                  <div key={projectId} className="flex items-center justify-between p-1.5 bg-muted rounded">
                                    <span className="text-xs truncate">{project?.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => {
                                        setSelectedProjects(selectedProjects.filter(id => id !== projectId))
                                        const newSplitAmounts = { ...splitAmounts }
                                        delete newSplitAmounts[projectId]
                                        setSplitAmounts(newSplitAmounts)
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        
                        {selectedProjects.length > 1 && (
                          <div>
                            <div className="flex items-center mb-1.5">
                              <SplitSquareVertical className="h-3 w-3 mr-1.5" />
                              <span className="text-xs font-medium">Split Amount</span>
                            </div>
                            {selectedProjects.map(projectId => {
                              const project = projects.find(p => p.id === projectId)
                              return (
                                <div key={projectId} className="flex items-center space-x-1.5 mb-1.5">
                                  <span className="text-xs w-20 truncate">{project?.name}</span>
                                  <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={splitAmounts[projectId] || ''}
                                    onChange={(e) => setSplitAmounts({
                                      ...splitAmounts,
                                      [projectId]: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-16 h-6 text-xs px-1"
                                  />
                                  <span className="text-[10px] text-muted-foreground">€</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-1.5 pt-3 border-t">
                      <Button 
                        className="w-full h-7 text-xs"
                        disabled={selectedProjects.length === 0 || isProcessing}
                        onClick={() => {
                          console.log('Assign button clicked. Selected projects:', selectedProjects)
                          if (selectedProjects.length === 0) {
                            console.log('No projects selected')
                            return
                          }
                          
                          const assignments = selectedProjects.map(projectId => ({
                            projectId,
                            amountAssigned: splitAmounts[projectId] || (invoice.amountTotal / selectedProjects.length),
                            assignmentType: 'manual'
                          }))
                          
                          console.log('Creating assignments:', assignments)
                          handleAssignInvoice(invoice.id, assignments)
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {isProcessing ? 'Assigning...' : `Assign (${selectedProjects.length})`}
                      </Button>
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline"
                          className="flex-1 h-6 text-[10px] px-1"
                          disabled={isProcessing}
                          onClick={() => handleAssignInvoice(invoice.id, [])}
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          Non-Project
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 h-6 text-[10px] px-1"
                          disabled={isProcessing}
                          onClick={() => {
                            setSelectedInvoice(null)
                            setSelectedProjects([])
                            setSplitAmounts({})
                          }}
                        >
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          Defer
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Select an Invoice</h3>
              <p className="text-xs text-muted-foreground">
                Choose an invoice from the left panel to start the assignment process
              </p>
            </div>
          )}
          </Card>
        </div>
      </div>
        </div>
      </main>
    </>
  )
}