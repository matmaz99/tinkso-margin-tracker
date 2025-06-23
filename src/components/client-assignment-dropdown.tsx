'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Building2, 
  ChevronDown, 
  X, 
  Loader2,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Client {
  id: string
  name: string
  email?: string
  is_active: boolean
}

interface ClientAssignmentDropdownProps {
  currentClientName?: string | null
  projectId: string
  onClientAssigned: (client: Client | null) => void
  className?: string
}

export function ClientAssignmentDropdown({
  currentClientName,
  projectId,
  onClientAssigned,
  className
}: ClientAssignmentDropdownProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Find current assigned client
  const currentClient = clients.find(c => c.name === currentClientName)

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true)
      setError(null)
      
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      
      const data = await response.json()
      setClients(data.clients || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load clients')
      console.error('Error fetching clients:', err)
    } finally {
      setIsLoadingClients(false)
    }
  }

  const handleClientSelection = (clientId: string) => {
    if (clientId === 'remove') {
      handleRemoveClient()
      return
    }

    const client = clients.find(c => c.id === clientId)
    if (!client) return

    // If there's already a client assigned, show confirmation dialog
    if (currentClient && currentClient.id !== clientId) {
      setSelectedClient(client)
      setShowConfirmDialog(true)
    } else {
      assignClient(client)
    }
  }

  const assignClient = async (client: Client) => {
    try {
      setIsAssigning(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/assign-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: client.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign client')
      }

      const data = await response.json()
      
      // Show feedback about automatic invoice linking
      if (data.linked_invoices && data.linked_invoices > 0) {
        console.log(`✅ Client assigned and ${data.linked_invoices} invoice(s) automatically linked to project`)
      }
      
      onClientAssigned(client)
      
    } catch (err: any) {
      setError(err.message || 'Failed to assign client')
      console.error('Error assigning client:', err)
    } finally {
      setIsAssigning(false)
      setShowConfirmDialog(false)
      setSelectedClient(null)
    }
  }

  const handleRemoveClient = async () => {
    try {
      setIsAssigning(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/assign-client`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove client assignment')
      }

      const data = await response.json()
      
      // Show feedback about automatic invoice unlinking
      if (data.unlinked_invoices && data.unlinked_invoices > 0) {
        console.log(`✅ Client unassigned and ${data.unlinked_invoices} invoice(s) automatically unlinked from project`)
      }

      onClientAssigned(null)
      
    } catch (err: any) {
      setError(err.message || 'Failed to remove client assignment')
      console.error('Error removing client assignment:', err)
    } finally {
      setIsAssigning(false)
    }
  }

  const confirmClientChange = () => {
    if (selectedClient) {
      assignClient(selectedClient)
    }
  }

  // Show loading state while fetching clients
  if (isLoadingClients) {
    return (
      <Button variant="outline" size="sm" className="h-8 gap-2" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading clients...</span>
      </Button>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive">{error}</span>
        <Button variant="outline" size="sm" onClick={fetchClients}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={currentClient?.id || ''}
          onValueChange={handleClientSelection}
          disabled={isAssigning}
        >
          <SelectTrigger className={cn("h-8 gap-2 justify-between min-w-64 max-w-80", className)}>
            {currentClient ? (
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium truncate">{currentClient.name}</span>
                <Badge 
                  variant={currentClient.is_active ? "default" : "secondary"} 
                  className="h-4 text-xs flex-shrink-0"
                >
                  {currentClient.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Assign Client</span>
              </div>
            )}
          </SelectTrigger>
          <SelectContent>
            {/* Active clients first */}
            {clients.filter(c => c.is_active).map((client) => (
              <SelectItem key={client.id} value={client.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{client.name}</span>
                  <Badge variant="default" className="h-4 text-xs">Active</Badge>
                </div>
              </SelectItem>
            ))}
            
            {/* Inactive clients */}
            {clients.filter(c => !c.is_active).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Inactive Clients
                </div>
                {clients.filter(c => !c.is_active).map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 opacity-50" />
                      <span className="opacity-75">{client.name}</span>
                      <Badge variant="secondary" className="h-4 text-xs">Inactive</Badge>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}

            {/* Remove assignment option */}
            {currentClient && (
              <>
                <div className="px-2 py-1.5">
                  <div className="h-px bg-border" />
                </div>
                <SelectItem value="remove" className="text-destructive">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span>Remove Client Assignment</span>
                  </div>
                </SelectItem>
              </>
            )}

            {/* No clients message */}
            {clients.length === 0 && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-8 w-8 opacity-25" />
                  <p>No clients available</p>
                  <p className="text-xs">Import clients from Qonto first</p>
                </div>
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Client Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This project is currently assigned to <strong>{currentClient?.name}</strong>.
              {selectedClient && (
                <>
                  {' '}Do you want to reassign it to <strong>{selectedClient.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClientChange} disabled={isAssigning}>
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reassigning...
                </>
              ) : (
                'Yes, Reassign Client'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}