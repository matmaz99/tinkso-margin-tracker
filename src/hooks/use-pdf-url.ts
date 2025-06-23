import { useState, useCallback } from 'react'

interface PdfUrlResult {
  url: string | null
  loading: boolean
  error: string | null
  expiresAt: string | null
}

interface AttachmentResponse {
  success: boolean
  attachment_id: string
  url: string
  expires_at: string
  expires_in_minutes: number
}

export function usePdfUrl() {
  const [results, setResults] = useState<Record<string, PdfUrlResult>>({})

  const fetchPdfUrl = useCallback(async (attachmentId: string): Promise<string | null> => {
    // Return cached URL if it's still valid (expires in less than 5 minutes)
    const existing = results[attachmentId]
    if (existing?.url && existing.expiresAt) {
      const expiresAt = new Date(existing.expiresAt).getTime()
      const now = Date.now()
      const fiveMinutesFromNow = now + (5 * 60 * 1000)
      
      if (expiresAt > fiveMinutesFromNow) {
        return existing.url
      }
    }

    // Set loading state
    setResults(prev => ({
      ...prev,
      [attachmentId]: {
        url: null,
        loading: true,
        error: null,
        expiresAt: null
      }
    }))

    try {
      const response = await fetch(`/api/qonto/attachment/${attachmentId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch PDF URL')
      }

      const data: AttachmentResponse = await response.json()
      
      setResults(prev => ({
        ...prev,
        [attachmentId]: {
          url: data.url,
          loading: false,
          error: null,
          expiresAt: data.expires_at
        }
      }))

      return data.url
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch PDF URL'
      
      setResults(prev => ({
        ...prev,
        [attachmentId]: {
          url: null,
          loading: false,
          error: errorMessage,
          expiresAt: null
        }
      }))

      console.error('Error fetching PDF URL:', error)
      return null
    }
  }, [results])

  const getPdfUrlState = useCallback((attachmentId: string): PdfUrlResult => {
    return results[attachmentId] || {
      url: null,
      loading: false,
      error: null,
      expiresAt: null
    }
  }, [results])

  const clearCache = useCallback((attachmentId?: string) => {
    if (attachmentId) {
      setResults(prev => {
        const newResults = { ...prev }
        delete newResults[attachmentId]
        return newResults
      })
    } else {
      setResults({})
    }
  }, [])

  return {
    fetchPdfUrl,
    getPdfUrlState,
    clearCache
  }
}