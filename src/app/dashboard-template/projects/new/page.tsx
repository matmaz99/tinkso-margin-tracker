'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
  Plus, 
  Calendar,
  Flag,
  Circle,
  ChevronDown,
  Loader2
} from "lucide-react"
import { createProject, generateProjectKey, getCurrentUser } from "@/lib/supabase/client-queries"
import { ProjectInsert } from "@/lib/supabase/types"

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'indigo',
    priority: 'medium',
    status: 'planning',
    due_date: ''
  })

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-subtle" },
    { value: "medium", label: "Medium", color: "text-amber-500" },
    { value: "high", label: "High", color: "text-red-500" }
  ]

  const statusOptions = [
    { value: "planning", label: "Planning", color: "bg-muted" },
    { value: "active", label: "Active", color: "bg-indigo-600" },
    { value: "on_hold", label: "On Hold", color: "bg-amber-600" }
  ]

  const projectColors = [
    { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
    { value: "emerald", label: "Emerald", class: "bg-emerald-500" },
    { value: "amber", label: "Amber", class: "bg-amber-500" },
    { value: "violet", label: "Violet", class: "bg-violet-500" },
    { value: "red", label: "Red", class: "bg-red-500" },
    { value: "blue", label: "Blue", class: "bg-blue-500" }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Get current user
      const userResult = await getCurrentUser()
      if (!userResult) {
        setError('You must be logged in to create a project')
        setIsLoading(false)
        return
      }

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Project name is required')
        setIsLoading(false)
        return
      }

      if (!formData.description.trim()) {
        setError('Project description is required')
        setIsLoading(false)
        return
      }

      // Generate unique project key
      const projectKey = await generateProjectKey(formData.name)

      // Create project data
      const projectData: ProjectInsert = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        key: projectKey,
        color: formData.color,
        priority: formData.priority,
        status: formData.status,
        owner_id: userResult.user.id,
        due_date: formData.due_date || null
      }

      // Create the project
      const newProject = await createProject(projectData)

      // Redirect to the new project
      router.push(`/projects/${newProject.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setIsLoading(false)
    }
  }

  const getColorClass = (color: string) => {
    const colorOption = projectColors.find(c => c.value === color)
    return colorOption?.class || 'bg-indigo-500'
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Projects
              </Button>
            </Link>
            <h1 className="text-sm font-medium text-foreground">New Project</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                Cancel
              </Button>
            </Link>
            <Button 
              onClick={handleSubmit}
              size="sm" 
              className="gap-1.5 h-7 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[800px] mx-auto">
          <div className="border border-border bg-card p-6">
            {error && (
              <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-base font-medium text-foreground">Basic Information</h2>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Project Name *
                  </label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter a clear, descriptive project name" 
                    className="w-full h-8"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Description *
                  </label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the project goals, scope, and key deliverables..."
                    className="w-full min-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Project Properties */}
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="text-base font-medium text-foreground">Project Properties</h2>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Color Theme
                    </label>
                    <div className="relative">
                      <select
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        className="w-full h-8 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-ring focus:border-input appearance-none px-3"
                        disabled={isLoading}
                      >
                        {projectColors.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <div className={`w-2 h-2 rounded-full ${getColorClass(formData.color)}`}></div>
                      </div>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Priority
                    </label>
                    <div className="relative">
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full h-8 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-ring focus:border-input appearance-none px-3"
                        disabled={isLoading}
                      >
                        {priorityOptions.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                      <Flag className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full h-8 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-ring focus:border-input appearance-none px-3"
                        disabled={isLoading}
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <Circle className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Due Date (Optional)
                  </label>
                  <div className="relative">
                    <Input 
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => handleInputChange('due_date', e.target.value)}
                      className="w-full h-8"
                      disabled={isLoading}
                    />
                    <Calendar className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
                <Link href="/projects">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit"
                  size="sm" 
                  className="gap-1.5 h-7 px-4 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}