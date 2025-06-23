'use client'

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  RefreshCw, 
  Download, 
  Users, 
  FolderOpen,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react"

interface SyncResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export default function IntegrationsTestPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [results, setResults] = useState<{[key: string]: SyncResult}>({})

  const handleSync = async (type: string, endpoint: string, payload: any = {}) => {
    setIsLoading(type)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(prev => ({
          ...prev,
          [type]: { success: true, message: data.message || 'Sync completed', data }
        }))
      } else {
        setResults(prev => ({
          ...prev,
          [type]: { success: false, message: data.message || 'Sync failed', error: data.error }
        }))
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [type]: { success: false, message: 'Network error', error: error.message }
      }))
    } finally {
      setIsLoading(null)
    }
  }

  const handleCheckStatus = async () => {
    setIsLoading('status')
    try {
      const response = await fetch('/api/integrations/status')
      const data = await response.json()
      
      if (response.ok) {
        setResults(prev => ({
          ...prev,
          status: { success: true, message: 'Status retrieved', data }
        }))
      } else {
        setResults(prev => ({
          ...prev,
          status: { success: false, message: 'Failed to get status', error: data.error }
        }))
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        status: { success: false, message: 'Network error', error: error.message }
      }))
    } finally {
      setIsLoading(null)
    }
  }

  const getResultBadge = (result: SyncResult) => {
    if (result.success) {
      return <Badge variant="default" className="flex items-center"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>
    } else {
      return <Badge variant="destructive" className="flex items-center"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>
    }
  }

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Integration Testing</h1>
            <p className="text-xs text-muted-foreground">
              Test ClickUp and Qonto data synchronization
            </p>
          </div>
        </div>
      </header>

      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Integration Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Integration Status</h3>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isLoading === 'status'}
                onClick={handleCheckStatus}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading === 'status' ? 'animate-spin' : ''}`} />
                Check Status
              </Button>
            </div>
            
            {results.status && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Status Check</span>
                  {getResultBadge(results.status)}
                </div>
                <p className="text-sm text-muted-foreground">{results.status.message}</p>
                {results.status.data && (
                  <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(results.status.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </Card>

          {/* Qonto Integrations */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Qonto Sync Operations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Sync Clients */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="font-medium">Sync Clients</span>
                  </div>
                  {results.qonto_clients && getResultBadge(results.qonto_clients)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Fetch all clients from Qonto and create them in Supabase
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  disabled={isLoading === 'qonto_clients'}
                  onClick={() => handleSync('qonto_clients', '/api/integrations/qonto/sync', { sync_type: 'clients' })}
                >
                  {isLoading === 'qonto_clients' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Sync Qonto Clients
                    </>
                  )}
                </Button>
                {results.qonto_clients && (
                  <div className="mt-2 text-xs">
                    <p className={results.qonto_clients.success ? 'text-chart-2' : 'text-destructive'}>
                      {results.qonto_clients.message}
                    </p>
                    {results.qonto_clients.data && (
                      <p className="text-muted-foreground">
                        Processed: {results.qonto_clients.data.records_processed || 0} records
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sync Client Invoices */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="font-medium">Sync Client Invoices</span>
                  </div>
                  {results.qonto_client_invoices && getResultBadge(results.qonto_client_invoices)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Fetch client invoices from Qonto
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  disabled={isLoading === 'qonto_client_invoices'}
                  onClick={() => handleSync('qonto_client_invoices', '/api/integrations/qonto/sync', { sync_type: 'client_invoices' })}
                >
                  {isLoading === 'qonto_client_invoices' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Sync Client Invoices
                    </>
                  )}
                </Button>
                {results.qonto_client_invoices && (
                  <div className="mt-2 text-xs">
                    <p className={results.qonto_client_invoices.success ? 'text-chart-2' : 'text-destructive'}>
                      {results.qonto_client_invoices.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Sync Supplier Invoices */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    <span className="font-medium">Sync Supplier Invoices</span>
                  </div>
                  {results.qonto_supplier_invoices && getResultBadge(results.qonto_supplier_invoices)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Fetch supplier invoices from Qonto for the queue
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  disabled={isLoading === 'qonto_supplier_invoices'}
                  onClick={() => handleSync('qonto_supplier_invoices', '/api/integrations/qonto/sync', { sync_type: 'supplier_invoices' })}
                >
                  {isLoading === 'qonto_supplier_invoices' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Sync Supplier Invoices
                    </>
                  )}
                </Button>
                {results.qonto_supplier_invoices && (
                  <div className="mt-2 text-xs">
                    <p className={results.qonto_supplier_invoices.success ? 'text-chart-2' : 'text-destructive'}>
                      {results.qonto_supplier_invoices.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Sync All Qonto */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span className="font-medium">Sync All Qonto Data</span>
                  </div>
                  {results.qonto_all && getResultBadge(results.qonto_all)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Comprehensive sync of all Qonto data
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  disabled={isLoading === 'qonto_all'}
                  onClick={() => handleSync('qonto_all', '/api/integrations/qonto/sync', { sync_type: 'all' })}
                >
                  {isLoading === 'qonto_all' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync All Qonto
                    </>
                  )}
                </Button>
                {results.qonto_all && (
                  <div className="mt-2 text-xs">
                    <p className={results.qonto_all.success ? 'text-chart-2' : 'text-destructive'}>
                      {results.qonto_all.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ClickUp Integrations */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              ClickUp Sync Operations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Sync Projects/Tasks */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    <span className="font-medium">Sync Projects</span>
                  </div>
                  {results.clickup_sync && getResultBadge(results.clickup_sync)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Extract projects from ClickUp tasks and create them in Supabase
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  disabled={isLoading === 'clickup_sync'}
                  onClick={() => handleSync('clickup_sync', '/api/integrations/clickup/sync', { force_full_sync: true })}
                >
                  {isLoading === 'clickup_sync' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Sync ClickUp Projects
                    </>
                  )}
                </Button>
                {results.clickup_sync && (
                  <div className="mt-2 text-xs">
                    <p className={results.clickup_sync.success ? 'text-chart-2' : 'text-destructive'}>
                      {results.clickup_sync.message}
                    </p>
                    {results.clickup_sync.data && (
                      <p className="text-muted-foreground">
                        Processed: {results.clickup_sync.data.records_processed || 0} tasks
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Incremental Sync */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span className="font-medium">Incremental Sync</span>
                  </div>
                  {results.clickup_incremental && getResultBadge(results.clickup_incremental)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Sync only new/updated ClickUp tasks
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  disabled={isLoading === 'clickup_incremental'}
                  onClick={() => handleSync('clickup_incremental', '/api/integrations/clickup/sync', { force_full_sync: false })}
                >
                  {isLoading === 'clickup_incremental' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Incremental Sync
                    </>
                  )}
                </Button>
                {results.clickup_incremental && (
                  <div className="mt-2 text-xs">
                    <p className={results.clickup_incremental.success ? 'text-chart-2' : 'text-destructive'}>
                      {results.clickup_incremental.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">💡 Instructions</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><strong>1. Start with Qonto Clients:</strong> This will populate your clients table with real client data from Qonto.</p>
              <p><strong>2. Sync ClickUp Projects:</strong> This will extract project information from your ClickUp tasks.</p>
              <p><strong>3. Sync Qonto Invoices:</strong> This will populate client and supplier invoices with real financial data.</p>
              <p><strong>4. Check the Results:</strong> Visit your dashboard, projects, clients, and invoice queue to see the imported data.</p>
              <p><strong>Note:</strong> Make sure your credentials are properly configured in the environment variables.</p>
            </div>
          </Card>

        </div>
      </main>
    </>
  )
}