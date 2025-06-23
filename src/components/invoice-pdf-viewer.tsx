'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Loader2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

interface InvoicePdfViewerProps {
  selectedInvoice: any | null
  className?: string
}

export function InvoicePdfViewer({ selectedInvoice, className }: InvoicePdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (selectedInvoice?.attachmentId || selectedInvoice?.pdfUrl) {
      loadPdfUrl()
    } else {
      setPdfUrl(null)
      setError(null)
    }
  }, [selectedInvoice])

  const loadPdfUrl = async () => {
    if (!selectedInvoice) return
    
    try {
      setLoading(true)
      setError(null)
      
      let url: string | null = null
      
      // Use proxy endpoint for attachment IDs to ensure inline display
      if (selectedInvoice.attachmentId) {
        url = `/api/qonto/pdf-proxy/${selectedInvoice.attachmentId}`
      }
      // Fallback to stored URL
      else if (selectedInvoice.pdfUrl) {
        url = selectedInvoice.pdfUrl
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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleDownload = async () => {
    if (!selectedInvoice) return
    
    try {
      // For downloads, we want the direct URL to trigger proper download behavior
      let downloadUrl = pdfUrl
      
      if (selectedInvoice.attachmentId && pdfUrl?.includes('/pdf-proxy/')) {
        // Get direct URL for download
        const response = await fetch(`/api/qonto/attachment/${selectedInvoice.attachmentId}`)
        if (response.ok) {
          const data = await response.json()
          downloadUrl = data.url
        }
      }
      
      if (downloadUrl) {
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `${selectedInvoice.supplierName || 'invoice'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Download error:', error)
      // Fallback to opening in new tab
      if (pdfUrl) {
        window.open(pdfUrl, '_blank')
      }
    }
  }

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  return (
    <Card className={`p-3 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-foreground">Invoice Preview</h3>
        <div className="flex items-center space-x-2">
          {pdfUrl && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="h-6 w-6 p-0"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-[10px] text-muted-foreground min-w-[2.5rem] text-center">
                {zoom}%
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="h-6 w-6 p-0"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleOpenInNewTab}
                className="h-6 w-6 p-0"
                title="Open in New Tab"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownload}
                className="h-6 w-6 p-0"
                title="Download PDF"
              >
                <Download className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 border rounded bg-muted/30 flex items-center justify-center min-h-[500px]">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs text-muted-foreground">Loading PDF...</span>
          </div>
        ) : error ? (
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Failed to load PDF</p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadPdfUrl} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded border-0"
            title={`Invoice ${selectedInvoice?.supplierName || 'PDF'}`}
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              width: `${10000 / zoom}%`,
              height: `${10000 / zoom}%`
            }}
            onError={() => setError('Failed to display PDF')}
          />
        ) : selectedInvoice ? (
          <div className="text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No PDF available for this invoice</p>
          </div>
        ) : (
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-sm font-medium text-foreground mb-2">Select an Invoice</h4>
            <p className="text-xs text-muted-foreground">
              Choose an invoice from the list to view its PDF preview
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}