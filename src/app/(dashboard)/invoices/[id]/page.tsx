'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft,
  FileText, 
  Download, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Brain,
  Target,
  SplitSquareVertical,
  Plus,
  RefreshCw,
  File,
  Bot,
  ExternalLink,
  History,
  User,
  Calendar,
  DollarSign,
  Building,
  Hash,
  MoreHorizontal,
  Edit3,
  Trash2,
  Archive,
  Zap
} from "lucide-react"
import { InvoicePdfViewer } from '@/components/invoice-pdf-viewer'
import Link from "next/link"

// Real-time supplier invoice data interfaces
interface SupplierInvoiceWithDetails {
  id: string
  qontoId?: string
  supplierName: string
  supplierIban?: string
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
      reasoning?: string
    }[]
    extractedText?: string
    processingStatus?: string
  }
  assignments?: {
    id: string
    projectId: string
    projectName: string
    amountAssigned: number
    percentage?: number
    assignmentType: string
    assignedBy?: string
    assignedAt: string
  }[]
}

interface ProjectOption {
  id: string
  name: string
  status: string
  clientName?: string
}

export default function InvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<SupplierInvoiceWithDetails | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [splitAmounts, setSplitAmounts] = useState<{[key: string]: number}>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    supplierName: '',
    amountTotal: '',
    amountNet: '',
    amountVat: '',
    description: '',
    invoiceDate: ''
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Fetch invoice details
  const fetchInvoiceDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/supplier-invoices/${invoiceId}?includeAI=true&includeAssignments=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        if (response.status === 404) {
          setError('Invoice not found')
          return
        }
        throw new Error('Failed to fetch invoice details')
      }

      const data = await response.json()
      setInvoice(data.invoice)
      setLastRefresh(new Date())
      
      // Update edit form when invoice data loads
      if (data.invoice && !editMode) {
        setEditForm({
          supplierName: data.invoice.supplierName || '',
          amountTotal: data.invoice.amountTotal?.toString() || '',
          amountNet: data.invoice.amountNet?.toString() || '',
          amountVat: data.invoice.amountVat?.toString() || '',
          description: data.invoice.description || '',
          invoiceDate: data.invoice.invoiceDate || ''
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invoice details'
      setError(errorMessage)
      console.error('Invoice fetch error:', err)
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
    if (invoiceId) {
      fetchInvoiceDetails()
      fetchProjects()
    }
  }, [invoiceId])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchInvoiceDetails()
  }

  // Handle OCR processing
  const handleOCRProcessing = async () => {
    if (!invoice) return
    
    try {
      setOcrProcessing(true)
      setError(null)
      setSuccessMessage(null)
      
      const response = await fetch(`/api/supplier-invoices/${invoice.id}/process-ocr`, {
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
      setTimeout(() => {
        fetchInvoiceDetails()
      }, 1000) // Small delay to ensure AI processing is completed
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process OCR'
      setError(errorMessage)
      console.error('Error processing OCR:', err)
    } finally {
      setOcrProcessing(false)
    }
  }
  
  // Handle invoice assignment
  const handleAssignInvoice = async (projectAssignments: {
    projectId: string
    amountAssigned: number
    assignmentType: string
  }[]) => {
    if (!invoice) return
    
    try {
      setIsProcessing(true)
      setError(null)
      setSuccessMessage(null)
      
      const response = await fetch(`/api/supplier-invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: projectAssignments.length > 0 ? 'assigned' : 'non-project',
          projectAssignments
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update invoice assignment')
      }

      // Refresh data after successful assignment
      await fetchInvoiceDetails()
      setSelectedProjects([])
      setSplitAmounts({})
      setSuccessMessage('Invoice assignment updated successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice assignment'
      setError(errorMessage)
      console.error('Error updating assignment:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle edit functionality
  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset form
      if (invoice) {
        setEditForm({
          supplierName: invoice.supplierName || '',
          amountTotal: invoice.amountTotal?.toString() || '',
          amountNet: invoice.amountNet?.toString() || '',
          amountVat: invoice.amountVat?.toString() || '',
          description: invoice.description || '',
          invoiceDate: invoice.invoiceDate || ''
        })
      }
    }
    setEditMode(!editMode)
  }

  const handleEditSave = async () => {
    if (!invoice) return
    
    try {
      setIsProcessing(true)
      setError(null)
      setSuccessMessage(null)
      
      const response = await fetch(`/api/supplier-invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierName: editForm.supplierName,
          amountTotal: parseFloat(editForm.amountTotal),
          amountNet: editForm.amountNet ? parseFloat(editForm.amountNet) : null,
          amountVat: editForm.amountVat ? parseFloat(editForm.amountVat) : null,
          description: editForm.description,
          invoiceDate: editForm.invoiceDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update invoice')
      }

      // Refresh data after successful update
      await fetchInvoiceDetails()
      setEditMode(false)
      setSuccessMessage('Invoice details updated successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice'
      setError(errorMessage)
      console.error('Error updating invoice:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle invoice deletion
  const handleDelete = async () => {
    if (!invoice || !confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsProcessing(true)
      
      const response = await fetch(`/api/supplier-invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete invoice')
      }

      // Redirect back to queue after successful deletion
      router.push('/invoices/queue')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice'
      setError(errorMessage)
      console.error('Error deleting invoice:', err)
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
    "assigned": { 
      variant: "default" as const, 
      icon: CheckCircle, 
      color: "text-chart-2",
      label: "Assigned"
    },
    "non-project": { 
      variant: "outline" as const, 
      icon: AlertTriangle, 
      color: "text-muted-foreground",
      label: "Non-Project"
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading invoice details...</span>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
        <h3 className="text-lg font-medium text-foreground mb-1">
          {error || 'Invoice not found'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          The invoice you're looking for doesn't exist or couldn't be loaded.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const statusConf = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig['pending-assignment']
  const StatusIcon = statusConf.icon

  return (
    <>
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-10 items-center px-3">
          <div className="flex items-center gap-3 flex-1">
            <Link href="/invoices/queue">
              <Button variant="outline" size="sm" className="h-5 text-[10px] px-2">
                <ArrowLeft className="h-2.5 w-2.5 mr-1" />
                Back to Queue
              </Button>
            </Link>
            <h1 className="text-xs font-medium text-foreground">Invoice Details</h1>
            <span className="text-[9px] px-1 py-0 h-3.5 bg-muted text-muted-foreground rounded border border-border">
              {invoice.supplierName}
            </span>
            <Badge variant={statusConf.variant} className="flex items-center text-[10px] px-1.5 py-0.5 h-5">
              <StatusIcon className="h-2.5 w-2.5 mr-1" />
              {statusConf.label}
            </Badge>
            {lastRefresh && (
              <span className="text-[10px] text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {editMode ? (
              <>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-5 text-[10px] px-1.5"
                  onClick={handleEditSave}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                  {isProcessing ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={handleEditToggle}
                  disabled={isProcessing}
                >
                  <ArrowLeft className="h-2.5 w-2.5 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={handleEditToggle}
                >
                  <Edit3 className="h-2.5 w-2.5 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-2.5 w-2.5 mr-1" />
                  Delete
                </Button>
                <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent">
                  <MoreHorizontal className="h-2.5 w-2.5" />
                </Button>
              </>
            )}
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
        <div className="max-w-[1400px] mx-auto space-y-4">
          
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="p-3 bg-chart-2/10 border border-chart-2/20 rounded-md flex items-center">
              <CheckCircle className="h-4 w-4 text-chart-2 mr-2" />
              <span className="text-sm text-chart-2">{successMessage}</span>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center">
              <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
              <span className="text-sm text-destructive">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 w-6 p-0"
                onClick={() => setError(null)}
              >
                ×
              </Button>
            </div>
          )}
          
          {/* Main Content - Three-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4 h-[calc(100vh-120px)]">
            
            {/* Panel 1 - Invoice Details & Metadata (25% on desktop) */}
            <div className="lg:col-span-1 xl:col-span-3">
              <div className="space-y-3 h-full overflow-y-auto">
                
                {/* Basic Invoice Information */}
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Invoice Information</h3>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleEditToggle}>
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground flex items-center mb-1">
                          <Building className="h-2.5 w-2.5 mr-1" />
                          Supplier
                        </p>
                        {editMode ? (
                          <Input
                            value={editForm.supplierName}
                            onChange={(e) => setEditForm({ ...editForm, supplierName: e.target.value })}
                            className="h-6 text-xs"
                            placeholder="Supplier name"
                          />
                        ) : (
                          <p className="font-medium text-xs">{invoice.supplierName}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground flex items-center mb-1">
                          <DollarSign className="h-2.5 w-2.5 mr-1" />
                          Total Amount
                        </p>
                        {editMode ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editForm.amountTotal}
                            onChange={(e) => setEditForm({ ...editForm, amountTotal: e.target.value })}
                            className="h-6 text-xs"
                            placeholder="0.00"
                          />
                        ) : (
                          <p className="font-bold text-xs">€{invoice.amountTotal.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground flex items-center mb-1">
                          <Calendar className="h-2.5 w-2.5 mr-1" />
                          Invoice Date
                        </p>
                        {editMode ? (
                          <Input
                            type="date"
                            value={editForm.invoiceDate}
                            onChange={(e) => setEditForm({ ...editForm, invoiceDate: e.target.value })}
                            className="h-6 text-xs"
                          />
                        ) : (
                          <p className="font-medium text-xs">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground flex items-center mb-1">
                          <Hash className="h-2.5 w-2.5 mr-1" />
                          Invoice ID
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{invoice.id.slice(-8)}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Net Amount</p>
                          {editMode ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editForm.amountNet}
                              onChange={(e) => setEditForm({ ...editForm, amountNet: e.target.value })}
                              className="h-6 text-xs"
                              placeholder="0.00"
                            />
                          ) : (
                            <p className="font-medium text-xs">€{(invoice.amountNet || 0).toLocaleString()}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">VAT Amount</p>
                          {editMode ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editForm.amountVat}
                              onChange={(e) => setEditForm({ ...editForm, amountVat: e.target.value })}
                              className="h-6 text-xs"
                              placeholder="0.00"
                            />
                          ) : (
                            <p className="font-medium text-xs">€{(invoice.amountVat || 0).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-[10px] text-muted-foreground mb-1">Description</p>
                      {editMode ? (
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="h-6 text-xs"
                          placeholder="Invoice description"
                        />
                      ) : (
                        <p className="text-xs">{invoice.description || 'No description'}</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* AI Vision Analysis */}
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <Brain className="h-3.5 w-3.5 mr-1.5" />
                      AI Vision Analysis
                    </h3>
                    {invoice.attachmentId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleOCRProcessing}
                        disabled={ocrProcessing}
                        title="Re-analyze with AI Vision"
                      >
                        {ocrProcessing ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {invoice.aiExtraction?.confidence !== undefined ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Confidence Score</span>
                        <Badge variant={getConfidenceBadge(invoice.aiExtraction.confidence)} className="text-[10px] px-1.5 py-0.5 h-4">
                          {invoice.aiExtraction.confidence}%
                        </Badge>
                      </div>
                      
                      {invoice.aiExtraction.projectMatches && invoice.aiExtraction.projectMatches.length > 0 ? (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-2">Project Matches:</p>
                          <div className="space-y-2">
                            {invoice.aiExtraction.projectMatches.map((match, idx) => (
                              <div key={idx} className="p-2 border rounded-md bg-muted/30">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-[10px] truncate">{match.projectName}</span>
                                  <Badge variant={getConfidenceBadge(match.confidence)} className="text-[9px] px-1 py-0.5 h-4">
                                    {match.confidence}%
                                  </Badge>
                                </div>
                                {match.keywords && match.keywords.length > 0 && (
                                  <p className="text-[9px] text-muted-foreground mb-1">
                                    Keywords: {match.keywords.join(", ")}
                                  </p>
                                )}
                                {match.reasoning && (
                                  <p className="text-[9px] text-muted-foreground">
                                    {match.reasoning}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-[10px] text-muted-foreground">No project matches found</p>
                        </div>
                      )}
                    </div>
                  ) : invoice.attachmentId ? (
                    <div className="text-center py-3">
                      <p className="text-[10px] text-muted-foreground mb-2">
                        Click to analyze PDF with AI Vision
                      </p>
                      <Button
                        size="sm"
                        onClick={handleOCRProcessing}
                        disabled={ocrProcessing}
                        className="h-6 px-3 text-[10px]"
                      >
                        {ocrProcessing ? (
                          <>
                            <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Brain className="h-2.5 w-2.5 mr-1" />
                            Analyze with AI
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-[10px] text-muted-foreground">No PDF available for analysis</p>
                    </div>
                  )}
                </Card>

                {/* Assignment History */}
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <History className="h-3.5 w-3.5 mr-1.5" />
                      Assignment History
                    </h3>
                  </div>
                  
                  {invoice.assignments && invoice.assignments.length > 0 ? (
                    <div className="space-y-2">
                      {invoice.assignments.map((assignment) => (
                        <div key={assignment.id} className="p-2 border rounded-md">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs">{assignment.projectName}</span>
                            <span className="font-bold text-xs">€{assignment.amountAssigned.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{assignment.assignmentType}</span>
                            <span>{new Date(assignment.assignedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-[10px] text-muted-foreground">No assignments yet</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Panel 2 - PDF Viewer (50% on desktop) */}
            <div className="hidden xl:block xl:col-span-6">
              <InvoicePdfViewer 
                selectedInvoice={invoice} 
                className="h-full"
              />
            </div>

            {/* Panel 3 - Assignment Interface (25% on desktop) */}
            <div className="lg:col-span-1 xl:col-span-3">
              <Card className="p-3 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Project Assignment</h3>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 xl:hidden">
                      <File className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  {/* Current Status */}
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground">Current Status</span>
                      <Badge variant={statusConf.variant} className="text-[10px] px-1.5 py-0.5 h-4">
                        <StatusIcon className="h-2.5 w-2.5 mr-1" />
                        {statusConf.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground text-[10px]">Total Amount</p>
                        <p className="font-semibold">€{invoice.amountTotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px]">Assigned</p>
                        <p className="font-semibold">
                          €{(invoice.assignments?.reduce((sum, a) => sum + a.amountAssigned, 0) || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Suggestions Quick Actions */}
                  {invoice.aiExtraction?.projectMatches && invoice.aiExtraction.projectMatches.length > 0 && (
                    <div>
                      <h4 className="font-medium text-xs mb-2 flex items-center">
                        <Bot className="h-3 w-3 mr-1.5" />
                        Quick Assign from AI
                      </h4>
                      <div className="space-y-1.5">
                        {invoice.aiExtraction.projectMatches.slice(0, 3).map((match, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="w-full justify-between h-8 px-2 text-[10px]"
                            onClick={() => {
                              const project = projects.find(p => p.name === match.projectName)
                              if (project && !selectedProjects.includes(project.id)) {
                                setSelectedProjects([project.id]) // Single project assignment from AI
                                setSplitAmounts({
                                  [project.id]: invoice.amountTotal
                                })
                              }
                            }}
                          >
                            <span className="truncate">{match.projectName}</span>
                            <Badge variant={getConfidenceBadge(match.confidence)} className="text-[9px] px-1 py-0.5 h-3.5 ml-1">
                              {match.confidence}%
                            </Badge>
                          </Button>
                        ))}
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
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center">
                              <SplitSquareVertical className="h-3 w-3 mr-1.5" />
                              <span className="text-xs font-medium">Split Amount</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-[9px] px-1"
                              onClick={() => {
                                const equalAmount = invoice.amountTotal / selectedProjects.length
                                const newSplitAmounts = { ...splitAmounts }
                                selectedProjects.forEach(projectId => {
                                  newSplitAmounts[projectId] = equalAmount
                                })
                                setSplitAmounts(newSplitAmounts)
                              }}
                            >
                              Equal Split
                            </Button>
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
                      
                      {/* Assignment Summary */}
                      {selectedProjects.length > 0 && (
                        <div className="p-2 bg-muted rounded-md">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Assignment Total:</span>
                            <span className={`font-semibold ${
                              Math.abs(selectedProjects.reduce((sum, projectId) => 
                                sum + (splitAmounts[projectId] || (invoice.amountTotal / selectedProjects.length)), 0
                              ) - invoice.amountTotal) <= 0.01 
                                ? 'text-chart-2' 
                                : 'text-destructive'
                            }`}>
                              €{selectedProjects.reduce((sum, projectId) => 
                                sum + (splitAmounts[projectId] || (invoice.amountTotal / selectedProjects.length)), 0
                              ).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Invoice Total:</span>
                            <span className="font-semibold">€{invoice.amountTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col space-y-1.5 pt-3 border-t mt-auto">
                  <Button 
                    className="w-full h-7 text-xs"
                    disabled={selectedProjects.length === 0 || isProcessing}
                    onClick={() => {
                      if (selectedProjects.length === 0) return
                      
                      // Validate amounts
                      const totalAssigned = selectedProjects.reduce((sum, projectId) => {
                        return sum + (splitAmounts[projectId] || (invoice.amountTotal / selectedProjects.length))
                      }, 0)
                      
                      if (Math.abs(totalAssigned - invoice.amountTotal) > 0.01) {
                        setError(`Total assigned amount (€${totalAssigned.toFixed(2)}) must equal invoice total (€${invoice.amountTotal.toFixed(2)})`)
                        return
                      }
                      
                      const assignments = selectedProjects.map(projectId => ({
                        projectId,
                        amountAssigned: splitAmounts[projectId] || (invoice.amountTotal / selectedProjects.length),
                        assignmentType: 'manual',
                      }))
                      
                      handleAssignInvoice(assignments)
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
                      onClick={() => handleAssignInvoice([])}
                    >
                      <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                      Non-Project
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 h-6 text-[10px] px-1"
                      disabled={isProcessing}
                      onClick={() => {
                        setSelectedProjects([])
                        setSplitAmounts({})
                      }}
                    >
                      <RefreshCw className="h-2.5 w-2.5 mr-1" />
                      Reset
                    </Button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex space-x-1 pt-1 border-t">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-6 text-[10px] px-1"
                      onClick={() => window.open(`/invoices/${invoice.id}/pdf`, '_blank')}
                    >
                      <ExternalLink className="h-2.5 w-2.5 mr-1" />
                      Open PDF
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-6 text-[10px] px-1"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-2.5 w-2.5 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}