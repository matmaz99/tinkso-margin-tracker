import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Circle,
  Calendar,
  Users,
  Clock,
  CheckCircle2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { getProjects, getCurrentUser } from "@/lib/supabase/queries"
import Link from "next/link"

export default async function ProjectsPage() {
  // Get user data first
  const userResult = await getCurrentUser()
  
  if (!userResult) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view projects.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch projects
  const projects = await getProjects().catch(() => [])

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
      case 'high': return 'bg-red-900/30 text-red-400 border-red-800'
      case 'medium': return 'bg-amber-900/30 text-amber-400 border-amber-800'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-amber-900/30 text-amber-400 border-amber-800'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Projects</h1>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {projects.length} projects
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input 
                placeholder="Search projects..." 
                className="w-64 h-6 pl-7 text-xs"
              />
            </div>
            <Link href="/projects/new">
              <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
                <Plus className="h-3 w-3" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto">
          {projects.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <Circle className="h-12 w-12 text-muted mx-auto mb-4" />
                <h2 className="text-lg font-medium text-foreground mb-2">No projects yet</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first project to start organizing your work and collaborating with your team.
                </p>
                <Link href="/projects/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create your first project
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => {
                const projectTasks = project.tasks || []
                const completedTasks = projectTasks.filter(task => task.status === 'completed').length
                const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
                const teamMembers = project.project_members || []
                
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="bg-card border border-border p-6 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-4 h-4 rounded-full ${getColorClass(project.color)} mt-0.5`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-base font-medium text-foreground">{project.name}</h3>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {project.key}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] px-1.5 py-0 h-4 ${getStatusColor(project.status)}`}
                              >
                                {project.status || 'Active'}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] px-1.5 py-0 h-4 ${getPriorityColor(project.priority)}`}
                              >
                                {project.priority || 'Medium'} Priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {project.description}
                            </p>
                            
                            {/* Progress and Stats */}
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-subtle" />
                                <span className="text-xs text-muted-foreground">
                                  {completedTasks} / {projectTasks.length} tasks
                                </span>
                                <Progress value={progress} className="w-16 h-1.5" />
                                <span className="text-xs text-subtle">{progress}%</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3 text-subtle" />
                                <span className="text-xs text-muted-foreground">
                                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              {project.due_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-subtle" />
                                  <span className="text-xs text-muted-foreground">
                                    Due {new Date(project.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-subtle" />
                                <span className="text-xs text-muted-foreground">
                                  Updated {new Date(project.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}