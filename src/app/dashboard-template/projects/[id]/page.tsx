import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft,
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Circle,
  Flag,
  MessageSquare,
  Edit3,
  Archive,
  Share
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { getProject, getTasksByProject, getCurrentUser } from "@/lib/supabase/queries"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Check authentication
  const userResult = await getCurrentUser()
  if (!userResult) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view project details.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch project data
  const project = await getProject(id)
  
  if (!project) {
    notFound() // This will show the 404 page
  }

  // Fetch tasks for this project
  const tasks = await getTasksByProject(id)
  
  // Calculate stats
  const tasksTotal = tasks.length
  const tasksCompleted = tasks.filter(task => task.status === 'completed').length
  const tasksInProgress = tasks.filter(task => task.status === 'in_progress').length
  const progress = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0
  
  const teamMembers = project.project_members || []

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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
      case 'planning': return 'bg-amber-900/30 text-amber-400 border-amber-800'
      case 'on_hold': return 'bg-red-900/30 text-red-400 border-red-800'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-amber-500'
      case 'low': return 'text-subtle'
      default: return 'text-amber-500'
    }
  }

  const getTaskStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      case 'in_progress': return <Zap className="h-3 w-3 text-indigo-500" />
      case 'in_review': return <AlertCircle className="h-3 w-3 text-amber-500" />
      default: return <Circle className="h-3 w-3 text-muted-foreground" />
    }
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
                Projects
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getColorClass(project.color)}`}></div>
              <h1 className="text-sm font-medium text-foreground">{project.name}</h1>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {project.key}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Share className="h-3 w-3 mr-1" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Project Overview */}
          <div className="bg-card border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Flag className={`h-3 w-3 ${getPriorityColor(project.priority)}`} />
                    <span className="text-muted-foreground">{project.priority || 'Medium'} Priority</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 h-4 border ${getStatusColor(project.status)}`}
                  >
                    {project.status || 'Active'}
                  </Badge>
                  {project.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-subtle" />
                      <span className="text-muted-foreground">Due {new Date(project.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-subtle" />
                    <span className="text-muted-foreground">Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Section */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Progress</div>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="flex-1 h-2" />
                  <span className="text-sm font-medium text-foreground">{progress}%</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Tasks</div>
                <div className="text-sm font-medium text-foreground">{tasksTotal}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Completed</div>
                <div className="text-sm font-medium text-emerald-400">{tasksCompleted}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">In Progress</div>
                <div className="text-sm font-medium text-indigo-400">{tasksInProgress}</div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">Team Members</h2>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                <Plus className="h-3 w-3 mr-1" />
                Add Member
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="flex items-center gap-2 px-2 py-1 bg-muted rounded">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                      {member.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground">{member.profiles?.full_name || 'Unknown'}</span>
                  <span className="text-xs text-subtle">• {member.role || 'Member'}</span>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <span className="text-xs text-muted-foreground">No team members assigned yet</span>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Tasks</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search tasks..." 
                    className="w-64 h-6 pl-7 text-xs"
                  />
                </div>
                <Link href={`/tasks/new?project=${id}`}>
                  <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="h-3 w-3" />
                    New Task
                  </Button>
                </Link>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-card border border-border p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-muted mx-auto mb-3" />
                  <h4 className="text-sm font-medium text-foreground mb-2">No tasks yet</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first task to start tracking work for this project.
                  </p>
                  <Link href={`/tasks/new?project=${id}`}>
                    <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Plus className="h-3 w-3" />
                      Create Task
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border">
                <div className="space-y-0">
                  {tasks.map((task, index) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className={`flex items-center justify-between p-3 hover:bg-accent/50 transition-colors cursor-pointer ${
                        index < tasks.length - 1 ? 'border-b border-border' : ''
                      }`}>
                        <div className="flex items-center gap-3 flex-1">
                          {getTaskStatusIcon(task.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">{task.title}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {task.key}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Flag className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
                              <span className="text-xs text-muted-foreground">{task.priority || 'Medium'}</span>
                              {task.assignee && (
                                <>
                                  <span className="text-xs text-subtle">•</span>
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                                      {task.assignee.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">{task.assignee.full_name}</span>
                                </>
                              )}
                              {task.due_date && (
                                <>
                                  <span className="text-xs text-subtle">•</span>
                                  <Calendar className="h-3 w-3 text-subtle" />
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.comments && task.comments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{task.comments.length}</span>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}