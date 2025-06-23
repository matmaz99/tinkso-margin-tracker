'use client'

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ClientAssignmentDropdown } from './client-assignment-dropdown'
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface ProjectInfoEditorProps {
  project: {
    id: string
    name: string
    client_name?: string | null
    start_date?: string | null
    end_date?: string | null
    status: string
  }
  onProjectUpdated: (updatedFields: any) => void
}

export function ProjectInfoEditor({ project, onProjectUpdated }: ProjectInfoEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [fieldLoading, setFieldLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const statusConfig = {
    active: { 
      variant: "default" as const, 
      icon: CheckCircle, 
      color: "bg-chart-2",
      label: "Active"
    },
    completed: { 
      variant: "secondary" as const, 
      icon: CheckCircle, 
      color: "bg-muted",
      label: "Completed"
    },
    "on-hold": { 
      variant: "outline" as const, 
      icon: AlertTriangle, 
      color: "bg-chart-3",
      label: "On Hold"
    }
  }

  const updateProjectField = async (field: string, value: any) => {
    try {
      setFieldLoading(field)
      setErrors(prev => ({ ...prev, [field]: '' }))
      
      const response = await fetch(`/api/projects/${project.id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update ${field}`)
      }

      const data = await response.json()
      onProjectUpdated({ [field]: value })
      
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [field]: err.message }))
      console.error(`Error updating ${field}:`, err)
    } finally {
      setFieldLoading(null)
    }
  }

  const handleStartDateChange = (date: string | null) => {
    updateProjectField('start_date', date)
  }

  const handleEndDateChange = (date: string | null) => {
    updateProjectField('end_date', date)
  }

  const handleStatusChange = (status: string) => {
    updateProjectField('status', status)
  }

  const handleClientAssigned = (client: any) => {
    onProjectUpdated({ client_name: client?.name || null })
  }

  return (
    <div className="space-y-3">
      {/* Client Assignment */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Client</span>
        <ClientAssignmentDropdown
          currentClientName={project.client_name}
          projectId={project.id}
          onClientAssigned={handleClientAssigned}
          className="min-w-64 max-w-80"
        />
      </div>

      {/* Start Date */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Start Date</span>
        <div className="flex items-center gap-2">
          {fieldLoading === 'start_date' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <DatePicker
            value={project.start_date}
            onValueChange={handleStartDateChange}
            placeholder="Select start date"
            disabled={fieldLoading === 'start_date'}
            maxDate={project.end_date} // End date is the max for start date
            className="w-40"
          />
        </div>
      </div>
      {errors.start_date && (
        <p className="text-xs text-destructive ml-auto max-w-40">{errors.start_date}</p>
      )}

      {/* End Date */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">End Date</span>
        <div className="flex items-center gap-2">
          {fieldLoading === 'end_date' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <DatePicker
            value={project.end_date}
            onValueChange={handleEndDateChange}
            placeholder="Select end date"
            disabled={fieldLoading === 'end_date'}
            minDate={project.start_date} // Start date is the min for end date
            className="w-40"
          />
        </div>
      </div>
      {errors.end_date && (
        <p className="text-xs text-destructive ml-auto max-w-40">{errors.end_date}</p>
      )}

      {/* Status */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Status</span>
        <div className="flex items-center gap-2">
          {fieldLoading === 'status' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Select
            value={project.status}
            onValueChange={handleStatusChange}
            disabled={fieldLoading === 'status'}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {errors.status && (
        <p className="text-xs text-destructive ml-auto max-w-32">{errors.status}</p>
      )}
    </div>
  )
}