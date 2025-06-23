import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Filter,
  Circle,
  Calendar,
  Flag,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function TasksPage() {
  // Extended task data for the Tasks page
  const tasks = [
    {
      id: "LIN-001",
      title: "Update user profile design",
      description: "Redesign the user profile page with new layout and improved accessibility",
      project: "FLOW-001",
      projectName: "Mobile App Redesign",
      projectColor: "text-indigo-500",
      status: "Completed",
      priority: "High",
      assignee: { name: "Alice Johnson", initials: "AJ" },
      dueDate: "Dec 10, 2024",
      labels: ["ui", "design", "accessibility"],
      createdAt: "3 days ago",
      updatedAt: "2 hours ago"
    },
    {
      id: "LIN-002",
      title: "Implement dark mode toggle",
      description: "Add system-wide dark mode support with persistent user preference",
      project: "FLOW-001", 
      projectName: "Mobile App Redesign",
      projectColor: "text-indigo-500",
      status: "In Progress",
      priority: "Medium",
      assignee: { name: "Bob Smith", initials: "BS" },
      dueDate: "Dec 15, 2024",
      labels: ["frontend", "theming"],
      createdAt: "2 days ago",
      updatedAt: "4 hours ago"
    },
    {
      id: "LIN-003",
      title: "OAuth integration endpoint",
      description: "Set up OAuth 2.0 authentication with Google and GitHub providers",
      project: "FLOW-002",
      projectName: "API Integration", 
      projectColor: "text-emerald-500",
      status: "In Review",
      priority: "High",
      assignee: { name: "David Wilson", initials: "DW" },
      dueDate: "Dec 12, 2024",
      labels: ["backend", "auth", "security"],
      createdAt: "1 week ago",
      updatedAt: "5 hours ago"
    },
    {
      id: "LIN-004",
      title: "Database query optimization",
      description: "Optimize slow database queries and add proper indexing",
      project: "FLOW-003",
      projectName: "Performance Optimization",
      projectColor: "text-amber-500", 
      status: "Todo",
      priority: "Medium",
      assignee: { name: "Frank Chen", initials: "FC" },
      dueDate: "Jan 5, 2025",
      labels: ["backend", "performance", "database"],
      createdAt: "3 days ago",
      updatedAt: "1 day ago"
    },
    {
      id: "LIN-005",
      title: "API documentation update",
      description: "Update OpenAPI specs and create comprehensive API documentation",
      project: "FLOW-004",
      projectName: "Documentation Update",
      projectColor: "text-violet-500",
      status: "Completed",
      priority: "Low",
      assignee: { name: "Grace Liu", initials: "GL" },
      dueDate: "Nov 30, 2024",
      labels: ["documentation", "api"],
      createdAt: "2 weeks ago",
      updatedAt: "1 day ago"
    },
    {
      id: "LIN-006",
      title: "Security headers implementation",
      description: "Implement security headers and CSRF protection",
      project: "FLOW-005",
      projectName: "Security Audit",
      projectColor: "text-red-500",
      status: "In Progress",
      priority: "High",
      assignee: { name: "Ian Torres", initials: "IT" },
      dueDate: "Dec 20, 2024",
      labels: ["security", "backend"],
      createdAt: "5 days ago",
      updatedAt: "3 hours ago"
    },
    {
      id: "LIN-007",
      title: "Real-time metrics dashboard",
      description: "Build real-time dashboard with WebSocket connections",
      project: "FLOW-006",
      projectName: "Analytics Dashboard",
      projectColor: "text-blue-500",
      status: "In Progress", 
      priority: "Medium",
      assignee: { name: "Luna Rodriguez", initials: "LR" },
      dueDate: "Dec 18, 2024",
      labels: ["frontend", "websockets", "charts"],
      createdAt: "1 week ago",
      updatedAt: "6 hours ago"
    },
    {
      id: "LIN-008",
      title: "User onboarding flow",
      description: "Create guided onboarding experience for new users",
      project: "FLOW-001",
      projectName: "Mobile App Redesign", 
      projectColor: "text-indigo-500",
      status: "Todo",
      priority: "Medium",
      assignee: { name: "Carol Davis", initials: "CD" },
      dueDate: "Jan 15, 2025",
      labels: ["ui", "onboarding", "frontend"],
      createdAt: "2 days ago",
      updatedAt: "2 days ago"
    }
  ]

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High": return <Flag className="h-3 w-3 text-red-500" />
      case "Medium": return <Flag className="h-3 w-3 text-amber-500" />
      case "Low": return <Flag className="h-3 w-3 text-subtle" />
      default: return <Flag className="h-3 w-3 text-subtle" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-emerald-600"
      case "In Progress": return "bg-indigo-600"
      case "In Review": return "bg-amber-600"
      case "Todo": return "bg-muted"
      default: return "bg-muted"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed": return <CheckCircle2 className="h-3 w-3" />
      case "In Progress": return <Zap className="h-3 w-3" />
      case "In Review": return <AlertCircle className="h-3 w-3" />
      case "Todo": return <Circle className="h-3 w-3" />
      default: return <Circle className="h-3 w-3" />
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Tasks</h1>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                className="w-full pl-8 pr-3 h-7 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              New Task
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1600px] mx-auto">
          {/* Tasks Table */}
          <div className="border border-border bg-card">
            {/* Table Header */}
            <div className="border-b border-border bg-muted">
              <div className="grid grid-cols-12 gap-4 p-3 text-xs text-muted-foreground font-medium">
                <div className="col-span-4">Task</div>
                <div className="col-span-2">Project</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-1">Due Date</div>
              </div>
            </div>

            {/* Table Rows */}
            {tasks.map((task, index) => (
              <div 
                key={task.id} 
                className="grid grid-cols-12 gap-4 p-3 border-b border-border last:border-b-0 hover:bg-accent/50 cursor-pointer group"
              >
                {/* Task Info */}
                <div className="col-span-4 flex items-start gap-3">
                  <div className="flex items-center justify-center w-4 h-4 mt-0.5">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {task.title}
                      </p>
                      <span className="text-xs text-subtle font-mono">{task.id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {task.labels.map((label) => (
                        <Badge key={label} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Project */}
                <div className="col-span-2 flex items-center gap-2">
                  <Circle className={`h-2 w-2 ${task.projectColor} fill-current flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{task.projectName}</p>
                    <p className="text-[10px] text-subtle font-mono">{task.project}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <Badge className={`text-xs px-2 py-0.5 text-white ${getStatusColor(task.status)}`}>
                    {task.status}
                  </Badge>
                </div>

                {/* Priority */}
                <div className="col-span-1 flex items-center">
                  {getPriorityIcon(task.priority)}
                </div>

                {/* Assignee */}
                <div className="col-span-2 flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                      {task.assignee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground truncate">{task.assignee.name}</span>
                </div>

                {/* Due Date */}
                <div className="col-span-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground font-medium">Total Tasks</span>
              </div>
              <p className="text-xl font-light text-foreground">{tasks.length}</p>
            </div>
            
            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-indigo-500" />
                <span className="text-xs text-muted-foreground font-medium">In Progress</span>
              </div>
              <p className="text-xl font-light text-foreground">
                {tasks.filter(t => t.status === "In Progress").length}
              </p>
            </div>

            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground font-medium">In Review</span>
              </div>
              <p className="text-xl font-light text-foreground">
                {tasks.filter(t => t.status === "In Review").length}
              </p>
            </div>

            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground font-medium">High Priority</span>
              </div>
              <p className="text-xl font-light text-foreground">
                {tasks.filter(t => t.priority === "High").length}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}