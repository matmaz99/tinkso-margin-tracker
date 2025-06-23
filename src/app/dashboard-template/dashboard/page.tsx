import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  ArrowRight,
  Bell,
  ChevronRight,
  Circle
} from "lucide-react"
import { Input } from "@/components/ui/input"

import Link from "next/link"

export default async function DashboardPage() {
  // Get user data first
  


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Bell className="h-3 w-3 mr-1" />
              Notifications
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Search className="h-3 w-3 mr-1" />
              Search
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground mb-1">
                Welcome back, matt
              </h2>
              <p className="text-sm text-muted-foreground">
                Here's what's happening with your projects today.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/projects/new">
                <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-3 w-3" />
                  New Project
                </Button>
              </Link>
              <Link href="/tasks/new">
                <Button variant="outline" size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
                  <Plus className="h-3 w-3" />
                  New Task
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL PROJECTS</span>
                </div>
                <TrendingUp className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{totalProjects}</div>
              <div className="text-xs text-muted-foreground">Active workstreams</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">TOTAL TASKS</span>
                </div>
                <CheckCircle className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{totalTasks}</div>
              <div className="text-xs text-muted-foreground">Items to track</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">IN PROGRESS</span>
                </div>
                <Clock className="h-3 w-3 text-chart-3" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{inProgressTasks}</div>
              <div className="text-xs text-muted-foreground">Active work</div>
            </div>

            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">COMPLETION</span>
                </div>
                <TrendingUp className="h-3 w-3 text-chart-2" />
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{completionRate}%</div>
              <div className="text-xs text-muted-foreground">Success rate</div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">Recent Projects</h3>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  View all
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="bg-card border border-border p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <Circle className="h-8 w-8 text-muted mx-auto mb-3" />
                  <h4 className="text-sm font-medium text-foreground mb-2">No projects yet</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first project to start organizing your work.
                  </p>
                  <Link href="/projects/new">
                    <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-3 w-3" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.slice(0, 3).map((project) => {
                  const projectTasks = project.tasks || []
                  const completedProjectTasks = projectTasks.filter(task => task.status === 'completed').length
                  const progress = projectTasks.length > 0 ? Math.round((completedProjectTasks / projectTasks.length) * 100) : 0
                  
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="bg-card border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${project.color === 'indigo' ? 'bg-indigo-500' : 
                              project.color === 'emerald' ? 'bg-emerald-500' : 
                              project.color === 'amber' ? 'bg-amber-500' : 
                              project.color === 'red' ? 'bg-red-500' :
                              project.color === 'blue' ? 'bg-blue-500' :
                              'bg-violet-500'}`}></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-foreground">{project.name}</h4>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                  {project.key}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {project.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                {completedProjectTasks} of {projectTasks.length} tasks
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {progress}% complete
                              </div>
                            </div>
                            <Progress value={progress} className="w-16 h-1.5" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {project.project_members?.length || 0} members
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 h-4 ${
                              project.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-800' :
                              project.status === 'planning' ? 'bg-amber-100 text-amber-700 border-amber-800' :
                              'text-muted-foreground'
                            }`}
                          >
                            {project.status || 'Active'}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">Recent Tasks</h3>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  View all
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-card border border-border p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <CheckCircle className="h-8 w-8 text-muted mx-auto mb-3" />
                  <h4 className="text-sm font-medium text-foreground mb-2">No tasks yet</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first task to start tracking your work.
                  </p>
                  <Link href="/tasks/new">
                    <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-3 w-3" />
                      Create Task
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border">
                <div className="space-y-0">
                  {tasks.slice(0, 5).map((task, index) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className={`flex items-center justify-between p-3 hover:bg-accent/50 transition-colors cursor-pointer ${
                        index < tasks.slice(0, 5).length - 1 ? 'border-b border-border' : ''
                      }`}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-chart-2' :
                            task.status === 'in_progress' ? 'bg-primary' :
                            task.status === 'in_review' ? 'bg-chart-3' :
                            'bg-muted'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">{task.title}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {task.key}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {task.projects?.name}
                              </span>
                              {task.assignee && (
                                <>
                                  <span className="text-xs text-muted">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {task.assignee.full_name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 h-4 ${
                              task.priority === 'high' ? 'bg-red-100 text-red-400 border-red-800' :
                              task.priority === 'medium' ? 'bg-amber-900/30 text-amber-400 border-amber-800' :
                              'text-muted-foreground'
                            }`}
                          >
                            {task.priority || 'Medium'}
                          </Badge>
                          <ChevronRight className="h-3 w-3 text-muted" />
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