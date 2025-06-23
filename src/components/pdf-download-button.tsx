'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react'
import { usePdfUrl } from '@/hooks/use-pdf-url'
import { cn } from '@/lib/utils'

interface PdfDownloadButtonProps {
  attachmentId?: string | null
  fallbackUrl?: string | null
  invoiceNumber?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showText?: boolean
}

export function PdfDownloadButton({
  attachmentId,
  fallbackUrl,
  invoiceNumber = 'invoice',
  variant = 'outline',
  size = 'sm',
  className,
  showText = true
}: PdfDownloadButtonProps) {
  const { fetchPdfUrl, getPdfUrlState } = usePdfUrl()
  const [isDownloading, setIsDownloading] = useState(false)

  // If no attachment ID or fallback URL, show disabled state
  if (!attachmentId && !fallbackUrl) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn('gap-2', className)}
      >
        <AlertCircle className="h-4 w-4" />
        {showText && 'No PDF'}
      </Button>
    )
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      let pdfUrl: string | null = null

      // Try attachment ID first (fresh URL from Qonto)
      if (attachmentId) {
        pdfUrl = await fetchPdfUrl(attachmentId)
      }

      // Fallback to stored URL if attachment fetch fails
      if (!pdfUrl && fallbackUrl) {
        pdfUrl = fallbackUrl
      }

      if (pdfUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = `${invoiceNumber}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        throw new Error('PDF URL not available')
      }
    } catch (error: any) {
      console.error('Download failed:', error)
      // You could add toast notification here
    } finally {
      setIsDownloading(false)
    }
  }

  const state = attachmentId ? getPdfUrlState(attachmentId) : null
  const isLoading = isDownloading || (state?.loading ?? false)
  const hasError = state?.error && !fallbackUrl

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isLoading || hasError}
      className={cn('gap-2', className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : hasError ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {showText && (
        isLoading ? 'Loading...' : 
        hasError ? 'Error' : 
        'PDF'
      )}
    </Button>
  )
}

// Simplified version for icon-only usage
export function PdfDownloadIcon({
  attachmentId,
  fallbackUrl,
  invoiceNumber,
  className
}: Omit<PdfDownloadButtonProps, 'variant' | 'size' | 'showText'>) {
  return (
    <PdfDownloadButton
      attachmentId={attachmentId}
      fallbackUrl={fallbackUrl}
      invoiceNumber={invoiceNumber}
      variant="ghost"
      size="icon"
      showText={false}
      className={className}
    />
  )
}