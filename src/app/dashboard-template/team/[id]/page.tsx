import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft,
  Plus, 
  MoreHorizontal, 
  Calendar,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Circle,
  Flag,
  Edit3,
  Settings,
  User,
  Briefcase,
  Trophy,
  TrendingUp,
  MessageSquare
} from "lucide-react"

export default async function TeamMemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Mock team member data - in real app this would be fetched based on params.id
  const member = {
    id: "TM-001",
    name: "Alice Johnson",
    email: "alice.johnson@flowtask.com",
    role: "Senior Frontend Developer",
    department: "Engineering",
    avatar: "/avatars/alice.jpg",
    initials: "AJ",
    status: "Active",
    joinDate: "Jan 15, 2023",
    location: "San Francisco, CA",
    timezone: "PST (UTC-8)",
    bio: "Passionate frontend developer with 6+ years of experience building user-centric web applications. Specializes in React, TypeScript, and modern CSS frameworks. Strong advocate for accessibility and inclusive design practices.",
    skills: ["React", "TypeScript", "CSS", "JavaScript", "Figma", "Node.js", "GraphQL", "Testing"],
    currentProjects: [
      { id: "FLOW-001", name: "Mobile App Redesign", role: "Lead Developer", progress: 75 },
      { id: "FLOW-004", name: "Documentation Update", role: "Contributor", progress: 90 }
    ],
    recentActivity: [
      {
        type: "task_completed",
        task: "Update user profile design",
        taskId: "LIN-001",
        project: "FLOW-001",
        timestamp: "2 hours ago"
      },
      {
        type: "comment",
        task: "Implement dark mode toggle",
        taskId: "LIN-002", 
        project: "FLOW-001",
        timestamp: "4 hours ago"
      },
      {
        type: "task_created",
        task: "Fix responsive layout issues",
        taskId: "LIN-009",
        project: "FLOW-001",
        timestamp: "1 day ago"
      }
    ]
  }

  const stats = {
    tasksCompleted: 24,
    tasksInProgress: 8,
    tasksOverdue: 1,
    projectsActive: 2,
    commitsThisWeek: 12,
    avgTaskTime: "2.5 days"
  }

  const workload = {
    thisWeek: 85,
    nextWeek: 60,
    capacity: 40
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_completed": return <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      case "task_created": return <Plus className="h-3 w-3 text-indigo-500" />
      case "comment": return <MessageSquare className="h-3 w-3 text-muted-foreground" />
      default: return <Circle className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-emerald-600"
      case "Away": return "bg-amber-600"
      case "Offline": return "bg-muted"
      default: return "bg-muted"
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Team
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-sm font-medium text-foreground">{member.name}</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Mail className="h-3 w-3 mr-1" />
              Message
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-6">
              {/* Member Overview */}
              <div className="border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-medium text-foreground">{member.name}</h2>
                      <Badge className={`text-xs px-2 py-0.5 text-white ${getStatusColor(member.status)}`}>
                        {member.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Briefcase className="h-4 w-4 text-subtle" />
                      <span className="text-sm text-foreground">{member.role}</span>
                      <span className="text-sm text-subtle">•</span>
                      <span className="text-sm text-muted-foreground">{member.department}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{member.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {member.joinDate}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              </div>

              {/* Current Projects */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-4">Current Projects</h3>
                <div className="space-y-3">
                  {member.currentProjects.map((project, index) => (
                    <div key={project.id} className="border border-border bg-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Circle className="h-2 w-2 text-indigo-500 fill-current" />
                          <span className="text-sm font-medium text-foreground">{project.name}</span>
                          <span className="text-xs text-subtle font-mono">{project.id}</span>
                        </div>
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {project.role}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <Progress 
                            value={project.progress} 
                            className="h-1.5 bg-muted [&>div]:bg-indigo-500"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {member.recentActivity.map((activity, index) => (
                    <div key={index} className="border border-border bg-card p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">
                            {activity.type === "task_completed" && "Completed task "}
                            {activity.type === "task_created" && "Created task "}
                            {activity.type === "comment" && "Commented on "}
                            <span className="font-medium text-foreground">{activity.task}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {activity.taskId}
                            </Badge>
                            <span className="text-xs text-subtle">•</span>
                            <span className="text-xs text-muted-foreground">{activity.project}</span>
                            <span className="text-xs text-subtle">•</span>
                            <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Performance Stats */}
              <div className="border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tasks Completed</span>
                    <span className="text-xs text-emerald-400 font-medium">{stats.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">In Progress</span>
                    <span className="text-xs text-indigo-400 font-medium">{stats.tasksInProgress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Overdue</span>
                    <span className="text-xs text-red-400 font-medium">{stats.tasksOverdue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Active Projects</span>
                    <span className="text-xs text-foreground font-medium">{stats.projectsActive}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg Task Time</span>
                    <span className="text-xs text-foreground font-medium">{stats.avgTaskTime}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, index) => (
                    <Badge key={skill} variant="outline" className="text-xs px-2 py-0.5">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Workload */}
              <div className="border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Workload</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">This Week</span>
                      <span className="text-foreground font-medium">{workload.thisWeek}%</span>
                    </div>
                    <Progress 
                      value={workload.thisWeek} 
                      className="h-1.5 bg-muted [&>div]:bg-red-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Next Week</span>
                      <span className="text-foreground font-medium">{workload.nextWeek}%</span>
                    </div>
                    <Progress 
                      value={workload.nextWeek} 
                      className="h-1.5 bg-muted [&>div]:bg-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="text-foreground font-medium">{workload.capacity}h/week</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Actions</h3>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Plus className="h-3 w-3 mr-2" />
                    Assign Task
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Mail className="h-3 w-3 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Calendar className="h-3 w-3 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Settings className="h-3 w-3 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}