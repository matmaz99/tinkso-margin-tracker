'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Plus, 
  X,
  Calendar,
  User,
  Flag,
  Circle,
  ChevronDown,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { 
  createTask, 
  generateTaskKey, 
  getCurrentUser, 
  getProjects,
  getTeamMembers 
} from "@/lib/supabase/client-queries"
import { TaskInsert, Project, Profile } from "@/lib/supabase/types"

export default function NewTaskPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assignee_id: '',
    status: 'todo',
    priority: 'medium',
    task_type: 'feature',
    due_date: '',
    estimate_hours: '',
    labels: [] as string[],
    acceptance_criteria: ''
  })

  const [newLabel, setNewLabel] = useState('')

  // Load projects and team members on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, membersData] = await Promise.all([
          getProjects(),
          getTeamMembers()
        ])
        setProjects(projectsData)
        setTeamMembers(membersData)
        
        // Check if project is pre-selected from URL params
        const urlParams = new URLSearchParams(window.location.search)
        const projectIdFromUrl = urlParams.get('project')
        
        if (projectIdFromUrl && projectsData.find(p => p.id === projectIdFromUrl)) {
          setFormData(prev => ({ ...prev, project_id: projectIdFromUrl }))
        } else if (projectsData.length > 0) {
          // Auto-select first project if available and no URL param
          setFormData(prev => ({ ...prev, project_id: projectsData[0].id }))
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoadingData(false)
      }
    }
    
    loadData()
  }, [])

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-subtle", icon: <Flag className="h-3 w-3 text-subtle" /> },
    { value: "medium", label: "Medium", color: "text-amber-500", icon: <Flag className="h-3 w-3 text-amber-500" /> },
    { value: "high", label: "High", color: "text-red-500", icon: <Flag className="h-3 w-3 text-red-500" /> }
  ]

  const statusOptions = [
    { value: "todo", label: "Todo", color: "bg-muted", icon: <Circle className="h-3 w-3 text-muted-foreground" /> },
    { value: "in_progress", label: "In Progress", color: "bg-indigo-600", icon: <Zap className="h-3 w-3 text-indigo-500" /> },
    { value: "in_review", label: "In Review", color: "bg-amber-600", icon: <AlertCircle className="h-3 w-3 text-amber-500" /> },
    { value: "completed", label: "Completed", color: "bg-emerald-600", icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" /> }
  ]

  const taskTypes = [
    { value: "feature", label: "Feature" },
    { value: "bug", label: "Bug Fix" },
    { value: "improvement", label: "Improvement" },
    { value: "documentation", label: "Documentation" },
    { value: "research", label: "Research" }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error when user types
  }

  const handleAddLabel = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newLabel.trim()) {
      e.preventDefault()
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()]
      }))
      setNewLabel('')
    }
  }

  const handleRemoveLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Get current user
      const userResult = await getCurrentUser()
      if (!userResult) {
        setError('You must be logged in to create a task')
        setIsLoading(false)
        return
      }

      // Validate required fields
      if (!formData.title.trim()) {
        setError('Task title is required')
        setIsLoading(false)
        return
      }

      if (!formData.description.trim()) {
        setError('Task description is required')
        setIsLoading(false)
        return
      }

      if (!formData.project_id) {
        setError('Please select a project')
        setIsLoading(false)
        return
      }

      // Get the selected project to generate task key
      const selectedProject = projects.find(p => p.id === formData.project_id)
      if (!selectedProject) {
        setError('Invalid project selected')
        setIsLoading(false)
        return
      }

      // Generate unique task key
      const taskKey = await generateTaskKey(selectedProject.key)

      // Create task data
      const taskData: TaskInsert = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        key: taskKey,
        project_id: formData.project_id,
        reporter_id: userResult.user.id,
        assignee_id: formData.assignee_id || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        estimate_hours: formData.estimate_hours ? parseInt(formData.estimate_hours) : null
      }

      // Create the task
      const newTask = await createTask(taskData)

      // TODO: Add labels to the task_labels table

      // Redirect to the new task
      router.push(`/tasks/${newTask.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      setIsLoading(false)
    }
  }

  const getColorClass = (color: string | null) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-500'
      case 'emerald': return 'bg-emerald-500'
      case 'amber': return 'bg-amber-500'
      case 'violet': return 'bg-violet-500'
      case 'red': return 'bg-red-500'
      case 'blue': return 'bg-blue-500'
      default: return 'bg-indigo-500'
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Tasks
              </Button>
            </Link>
            <h1 className="text-sm font-medium text-foreground">New Task</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                Cancel
              </Button>
            </Link>
            <Button 
              onClick={handleSubmit}
              size="sm" 
              className="gap-1.5 h-7 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading || projects.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
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

            {projects.length === 0 && (
              <div className="mb-6 p-4 bg-amber-900/30 border border-amber-800 rounded">
                <p className="text-amber-400 text-sm">
                  No projects found. Please create a project first before adding tasks.
                </p>
                <Link href="/projects/new">
                  <Button size="sm" className="mt-2 gap-1.5 h-7 px-3 text-xs">
                    <Plus className="h-3 w-3" />
                    Create Project
                  </Button>
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-base font-medium text-foreground">Basic Information</h2>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Task Title *
                  </label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter a clear, descriptive task title" 
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
                    placeholder="Describe what needs to be done, acceptance criteria, and any relevant context..."
                    className="w-full min-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Project *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.project_id}
                      onChange={(e) => handleInputChange('project_id', e.target.value)}
                      className="w-full h-8 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-ring focus:border-input appearance-none px-3 pl-8"
                      disabled={isLoading || projects.length === 0}
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.key})
                        </option>
                      ))}
                    </select>
                    {formData.project_id && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <div className={`w-2 h-2 rounded-full ${
                          getColorClass(projects.find(p => p.id === formData.project_id)?.color || null)
                        }`}></div>
                      </div>
                    )}
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Task Properties */}
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="text-base font-medium text-foreground">Task Properties</h2>
                
                <div className="grid grid-cols-3 gap-4">
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
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        value={formData.task_type}
                        onChange={(e) => handleInputChange('task_type', e.target.value)}
                        className="w-full h-8 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-ring focus:border-input appearance-none px-3"
                        disabled={isLoading}
                      >
                        {taskTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Assignee
                    </label>
                    <div className="relative">
                      <select
                        value={formData.assignee_id}
                        onChange={(e) => handleInputChange('assignee_id', e.target.value)}
                        className="w-full h-8 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-ring focus:border-input appearance-none px-3"
                        disabled={isLoading}
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.full_name || member.id}
                          </option>
                        ))}
                      </select>
                      <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Reporter
                    </label>
                    <div className="flex items-center gap-2 h-8 px-3 bg-muted border border-border rounded">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                          YU
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">You (Current User)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline & Estimation */}
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="text-base font-medium text-foreground">Timeline & Estimation</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Due Date
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

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Estimated Hours
                    </label>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={formData.estimate_hours}
                        onChange={(e) => handleInputChange('estimate_hours', e.target.value)}
                        placeholder="e.g., 8"
                        className="w-full h-8"
                        disabled={isLoading}
                      />
                      <Clock className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="text-base font-medium text-foreground">Labels</h2>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Add labels to categorize this task
                  </label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded bg-background min-h-[32px] flex-wrap">
                    {formData.labels.map((label) => (
                      <Badge key={label} variant="outline" className="text-xs px-2 py-0.5">
                        {label}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer hover:text-muted-foreground" 
                          onClick={() => handleRemoveLabel(label)}
                        />
                      </Badge>
                    ))}
                    <Input 
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={handleAddLabel}
                      placeholder="Add label..." 
                      className="flex-1 border-0 bg-transparent ring-0 focus-visible:ring-0 text-xs h-6 p-0 min-w-[100px]"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit"
                  size="sm" 
                  className="gap-1.5 h-7 px-4 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isLoading || projects.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    'Create Task'
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