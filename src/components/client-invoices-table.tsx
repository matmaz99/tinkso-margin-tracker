'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  ArrowUpDown,
  Download,
  ExternalLink,
  Loader2,
  X
} from 'lucide-react'
import { PdfDownloadButton } from '@/components/pdf-download-button'
import { usePdfUrl } from '@/hooks/use-pdf-url'
import { cn } from '@/lib/utils'

// Interfaces
interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  total_amount: number
  vat_rate?: number
  vat_amount?: number
}

interface ClientInvoice {
  id: string
  invoice_number: string
  qonto_id?: string
  attachment_id?: string
  pdf_url?: string
  client_id?: string
  project_id?: string
  amount_total: number
  amount_net: number
  amount_vat: number
  currency: string
  status: string
  issue_date: string
  due_date?: string
  paid_date?: string
  description?: string
  is_auto_detected?: boolean
  created_at: string
  line_items?: InvoiceLineItem[]
}

interface ClientInvoicesTableProps {
  projectId: string
  currency?: string
  vatRate?: number
  includeVAT?: boolean
  className?: string
}

// Status configuration
const invoiceStatusConfig = {
  paid: { 
    variant: "default" as const, 
    icon: CheckCircle, 
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20"
  },
  pending: { 
    variant: "secondary" as const, 
    icon: Clock, 
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20"
  },
  unpaid: { 
    variant: "secondary" as const, 
    icon: Clock, 
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20"
  },
  overdue: { 
    variant: "destructive" as const, 
    icon: AlertTriangle, 
    className: "bg-destructive/10 text-destructive border-destructive/20"
  },
  draft: { 
    variant: "outline" as const, 
    icon: Edit, 
    className: "bg-muted text-muted-foreground border-border"
  }
}

// Helper function to get invoice description with line items
function getInvoiceDescription(invoice: ClientInvoice): string {
  // If line items exist, concatenate their titles
  if (invoice.line_items && invoice.line_items.length > 0) {
    const lineItemTitles = invoice.line_items
      .map(item => item.description)
      .filter(title => title && title.trim())
      .join(', ')
    
    if (lineItemTitles) {
      return lineItemTitles
    }
  }
  
  // Fallback to original description or default
  return invoice.description || 'No description'
}

// PDF Viewer Modal Component
interface PdfViewerModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: ClientInvoice
}

function PdfViewerModal({ isOpen, onClose, invoice }: PdfViewerModalProps) {
  const { fetchPdfUrl } = usePdfUrl()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && (invoice.attachment_id || invoice.pdf_url)) {
      loadPdfUrl()
    }
  }, [isOpen, invoice.attachment_id, invoice.pdf_url])

  const loadPdfUrl = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let url: string | null = null
      
      // Use proxy endpoint for attachment IDs to ensure inline display
      if (invoice.attachment_id) {
        url = `/api/qonto/pdf-proxy/${invoice.attachment_id}`
      }
      // Fallback to stored URL
      else if (invoice.pdf_url) {
        url = invoice.pdf_url
      }
      
      if (url) {
        setPdfUrl(url)
      } else {
        throw new Error('PDF not available')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load PDF')
      console.error('PDF loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  const handleDownload = async () => {
    try {
      let downloadUrl = pdfUrl
      
      // For attachment IDs, get the direct download URL
      if (invoice.attachment_id && pdfUrl?.includes('/pdf-proxy/')) {
        const directUrl = await fetchPdfUrl(invoice.attachment_id)
        if (directUrl) {
          downloadUrl = directUrl
        }
      }
      
      if (downloadUrl) {
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `${invoice.invoice_number}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Download error:', error)
      // Fallback to current URL
      if (pdfUrl) {
        window.open(pdfUrl, '_blank')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Invoice {invoice.invoice_number}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {getInvoiceDescription(invoice)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {pdfUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-[800px] bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-[800px]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading PDF...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[800px]">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-foreground font-medium">Failed to load PDF</p>
                <p className="text-muted-foreground text-sm mb-4">{error}</p>
                <Button onClick={loadPdfUrl} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[800px] border-0"
              title={`Invoice ${invoice.invoice_number} PDF`}
              onError={() => setError('Failed to display PDF')}
            />
          ) : (
            <div className="flex items-center justify-center h-[800px]">
              <div className="text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No PDF available for this invoice</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Individual Invoice Row Component
interface InvoiceRowProps {
  invoice: ClientInvoice
  isExpanded: boolean
  onToggleExpand: (invoiceId: string) => void
  currency: string
  vatRate: number
  includeVAT: boolean
}

function InvoiceRow({ invoice, isExpanded, onToggleExpand, currency, vatRate, includeVAT }: InvoiceRowProps) {
  const [showPdfModal, setShowPdfModal] = useState(false)
  const adjustForVAT = (amount: number) => includeVAT ? amount : amount / (1 + vatRate)
  const statusConfig = invoiceStatusConfig[invoice.status as keyof typeof invoiceStatusConfig] || invoiceStatusConfig.draft
  const StatusIcon = statusConfig.icon
  
  return (
    <>
      {/* Main Invoice Row */}
      <div className="grid grid-cols-[48px_minmax(120px,1fr)_minmax(200px,2fr)_minmax(120px,1fr)_minmax(160px,1fr)_minmax(100px,1fr)_minmax(140px,1fr)] gap-3 py-3 px-4 border-b border-border hover:bg-accent/50 transition-colors items-center">
        {/* Expand Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onToggleExpand(invoice.id)}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        
        {/* Invoice Number with PDF indicator */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{invoice.invoice_number}</span>
          {(invoice.attachment_id || invoice.pdf_url) && (
            <FileText className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        
        {/* Description */}
        <span className="text-sm text-foreground truncate" title={getInvoiceDescription(invoice)}>
          {getInvoiceDescription(invoice)}
        </span>
        
        {/* Amount */}
        <div className="text-right">
          <span className="font-semibold text-foreground">
            {currency === 'EUR' ? '€' : '$'}{adjustForVAT(invoice.amount_total).toLocaleString()}
          </span>
          {!includeVAT && (
            <div className="text-xs text-muted-foreground">excl. VAT</div>
          )}
        </div>
        
        {/* Dates */}
        <div className="text-sm">
          <div className="text-foreground">
            Issued: {new Date(invoice.issue_date).toLocaleDateString()}
          </div>
          {invoice.due_date && (
            <div className="text-muted-foreground">
              Due: {new Date(invoice.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
        
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant={statusConfig.variant} className={cn("gap-1", statusConfig.className)}>
            <StatusIcon className="h-3 w-3" />
            {invoice.status}
          </Badge>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-center gap-1">
          <PdfDownloadButton
            attachmentId={invoice.attachment_id} 
            fallbackUrl={invoice.pdf_url}
            invoiceNumber={invoice.invoice_number}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            showText={false}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            title="View PDF"
            onClick={() => setShowPdfModal(true)}
            disabled={!invoice.attachment_id && !invoice.pdf_url}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit Invoice">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <InvoiceExpandedContent invoice={invoice} currency={currency} />
      )}
      
      {/* PDF Viewer Modal */}
      <PdfViewerModal 
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        invoice={invoice}
      />
    </>
  )
}

// Expanded Content Component
function InvoiceExpandedContent({ invoice, currency }: { invoice: ClientInvoice, currency: string }) {
  return (
    <div className="px-4 pb-4 pt-2 bg-muted/30 border-b border-border">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Line Items Table */}
        <Card className="p-4">
          <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Line Items
          </h4>
          {invoice.line_items?.length > 0 ? (
            <div className="space-y-2">
              {invoice.line_items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{item.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} × {currency === 'EUR' ? '€' : '$'}{item.unit_price.toLocaleString()}
                      {item.vat_rate && item.vat_rate > 0 && ` (VAT: ${item.vat_rate}%)`}
                    </div>
                  </div>
                  <div className="font-medium text-sm text-foreground">
                    {currency === 'EUR' ? '€' : '$'}{item.total_amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No line items available
            </div>
          )}
        </Card>
        
        {/* Invoice Metadata */}
        <Card className="p-4">
          <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net Amount:</span>
              <span className="text-foreground font-medium">
                {currency === 'EUR' ? '€' : '$'}{invoice.amount_net.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT Amount:</span>
              <span className="text-foreground font-medium">
                {currency === 'EUR' ? '€' : '$'}{invoice.amount_vat.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="text-foreground font-semibold">
                {currency === 'EUR' ? '€' : '$'}{invoice.amount_total.toLocaleString()}
              </span>
            </div>
            {invoice.paid_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Date:</span>
                <span className="text-foreground">{new Date(invoice.paid_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency:</span>
              <span className="text-foreground">{invoice.currency}</span>
            </div>
            {invoice.is_auto_detected && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                <Badge variant="outline" className="text-xs">Auto-detected</Badge>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

// Loading Skeleton Component
function InvoiceRowSkeleton() {
  return (
    <div className="grid grid-cols-[48px_minmax(120px,1fr)_minmax(200px,2fr)_minmax(120px,1fr)_minmax(160px,1fr)_minmax(100px,1fr)_minmax(140px,1fr)] gap-3 py-3 px-4 border-b border-border items-center">
      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-6 bg-muted rounded animate-pulse" />
      <div className="flex gap-1">
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

// Main Client Invoices Table Component
export function ClientInvoicesTable({ 
  projectId, 
  currency = 'EUR', 
  vatRate = 0.20, 
  includeVAT = true,
  className 
}: ClientInvoicesTableProps) {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<string>('issue_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/invoices`)
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices')
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchInvoices()
    }
  }, [projectId])

  const handleToggleExpand = (invoiceId: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(invoiceId)) {
      newExpandedRows.delete(invoiceId)
    } else {
      // Close other expanded rows (single expansion)
      newExpandedRows.clear()
      newExpandedRows.add(invoiceId)
    }
    setExpandedRows(newExpandedRows)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const sortedInvoices = [...invoices].sort((a, b) => {
    let aValue: any = a[sortBy as keyof ClientInvoice]
    let bValue: any = b[sortBy as keyof ClientInvoice]
    
    if (sortBy === 'amount_total') {
      aValue = parseFloat(aValue) || 0
      bValue = parseFloat(bValue) || 0
    } else if (sortBy === 'issue_date' || sortBy === 'due_date') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Client Invoices</h3>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Invoice
          </Button>
        </div>
        
        <Card className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-[48px_minmax(120px,1fr)_minmax(200px,2fr)_minmax(120px,1fr)_minmax(160px,1fr)_minmax(100px,1fr)_minmax(140px,1fr)] gap-3 py-3 px-4 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground">
            <span></span>
            <span>Invoice #</span>
            <span>Description</span>
            <span>Amount</span>
            <span>Dates</span>
            <span className="text-center">Status</span>
            <span className="text-center">Actions</span>
          </div>
          
          {/* Loading Skeleton */}
          {[...Array(3)].map((_, i) => (
            <InvoiceRowSkeleton key={i} />
          ))}
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Client Invoices</h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Invoice
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">Failed to Load Invoices</h4>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchInvoices} variant="outline">
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Client Invoices</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Invoice
        </Button>
      </div>
      
      {invoices.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No Invoices Found</h4>
          <p className="text-muted-foreground mb-4">
            This project doesn't have any client invoices yet.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Invoice
          </Button>
        </Card>
      ) : (
        <Card className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-[48px_minmax(120px,1fr)_minmax(200px,2fr)_minmax(120px,1fr)_minmax(160px,1fr)_minmax(100px,1fr)_minmax(140px,1fr)] gap-3 py-3 px-4 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground">
            <span></span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSort('invoice_number')}
              className="justify-start h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
            >
              Invoice #
              <ArrowUpDown className="h-3 w-3 ml-1" />
            </Button>
            <span>Description</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSort('amount_total')}
              className="justify-start h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
            >
              Amount
              <ArrowUpDown className="h-3 w-3 ml-1" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSort('issue_date')}
              className="justify-start h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
            >
              Dates
              <ArrowUpDown className="h-3 w-3 ml-1" />
            </Button>
            <span className="text-center">Status</span>
            <span className="text-center">Actions</span>
          </div>
          
          {/* Invoice Rows */}
          {sortedInvoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              isExpanded={expandedRows.has(invoice.id)}
              onToggleExpand={handleToggleExpand}
              currency={currency}
              vatRate={vatRate}
              includeVAT={includeVAT}
            />
          ))}
        </Card>
      )}
    </div>
  )
}