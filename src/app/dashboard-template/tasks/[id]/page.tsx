import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Plus, 
  MoreHorizontal, 
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Circle,
  Flag,
  MessageSquare,
  Edit3,
  Archive,
  Share,
  Paperclip,
  Send
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default async function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Mock task data - in real app this would be fetched based on params.id
  const task = {
    id: "LIN-001",
    title: "Update user profile design",
    description: "Redesign the user profile page with new layout and improved accessibility. This includes updating the visual hierarchy, improving color contrast ratios, adding proper ARIA labels, and ensuring keyboard navigation works properly throughout the interface.",
    project: {
      id: "FLOW-001",
      name: "Mobile App Redesign",
      color: "text-indigo-500"
    },
    status: "In Progress",
    priority: "High",
    assignee: { name: "Alice Johnson", initials: "AJ", email: "alice@flowtask.com" },
    reporter: { name: "Bob Smith", initials: "BS", email: "bob@flowtask.com" },
    dueDate: "Dec 15, 2024",
    createdDate: "Dec 1, 2024",
    updatedDate: "2 hours ago",
    labels: ["ui", "design", "accessibility", "frontend"],
    estimate: "8 hours",
    timeSpent: "5.5 hours"
  }

  const comments = [
    {
      id: "c1",
      author: { name: "Alice Johnson", initials: "AJ" },
      content: "Started working on the accessibility improvements. I've identified several issues with color contrast and keyboard navigation that need to be addressed.",
      timestamp: "2 hours ago",
      type: "comment"
    },
    {
      id: "c2", 
      author: { name: "Bob Smith", initials: "BS" },
      content: "Great progress! I've reviewed the initial mockups and they look much better. The new color scheme definitely improves readability.",
      timestamp: "4 hours ago",
      type: "comment"
    },
    {
      id: "c3",
      author: { name: "System", initials: "SY" },
      content: "Status changed from Todo to In Progress",
      timestamp: "1 day ago",
      type: "status_change"
    },
    {
      id: "c4",
      author: { name: "Carol Davis", initials: "CD" },
      content: "I've attached the updated design system guidelines that should be referenced for this task. Make sure the profile page follows the new component patterns.",
      timestamp: "2 days ago",
      type: "comment",
      attachments: ["design-system-v2.pdf"]
    }
  ]

  const statusOptions = ["Todo", "In Progress", "In Review", "Completed"]
  const priorityOptions = ["Low", "Medium", "High"]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed": return <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      case "In Progress": return <Zap className="h-3 w-3 text-indigo-500" />
      case "In Review": return <AlertCircle className="h-3 w-3 text-amber-500" />
      case "Todo": return <Circle className="h-3 w-3 text-muted-foreground" />
      default: return <Circle className="h-3 w-3 text-muted-foreground" />
    }
  }

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {getStatusIcon(task.status)}
              <h1 className="text-sm font-medium text-foreground">{task.title}</h1>
              <span className="text-xs text-subtle font-mono">{task.id}</span>
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
              {/* Task Overview */}
              <div className="border border-border bg-card p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-medium text-foreground mb-2">{task.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                  </div>
                </div>

                {/* Labels */}
                <div className="flex items-center gap-2 mb-4">
                  {task.labels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs px-2 py-0.5">
                      {label}
                    </Badge>
                  ))}
                </div>

                {/* Project Link */}
                <div className="flex items-center gap-2">
                  <Circle className={`h-2 w-2 ${task.project.color} fill-current`} />
                  <span className="text-xs text-muted-foreground">Part of</span>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                    {task.project.name}
                  </button>
                  <span className="text-xs text-subtle font-mono">{task.project.id}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground">Activity</h3>
                  <span className="text-xs text-muted-foreground">{comments.length} comments</span>
                </div>

                {/* Comment Input */}
                <div className="border border-border bg-card p-3 mb-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        YU
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea 
                        placeholder="Add a comment..." 
                        className="w-full min-h-[80px] resize-none"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                          <Paperclip className="h-3 w-3 mr-1" />
                          Attach
                        </Button>
                        <Button size="sm" className="gap-1.5 h-6 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white">
                          <Send className="h-3 w-3" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border border-border bg-card p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-6 w-6 mt-0.5">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            {comment.author.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">{comment.author.name}</span>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                            {comment.type === "status_change" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                Status Change
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                          {comment.attachments && (
                            <div className="flex items-center gap-2 mt-2">
                              {comment.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                                  <Paperclip className="h-3 w-3" />
                                  <span>{attachment}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Task Properties */}
              <div className="border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Properties</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <Badge className={`text-xs px-2 py-0.5 text-white ${getStatusColor(task.status)}`}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Priority</span>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(task.priority)}
                      <span className="text-xs text-foreground">{task.priority}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Assignee</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                          {task.assignee.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground">{task.assignee.name}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Reporter</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                          {task.reporter.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground">{task.reporter.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates & Time */}
              <div className="border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Dates & Time</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground block">Due Date</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-subtle" />
                      <span className="text-xs text-foreground">{task.dueDate}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Created</span>
                    <span className="text-xs text-foreground">{task.createdDate}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Last Updated</span>
                    <span className="text-xs text-foreground">{task.updatedDate}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Estimate</span>
                    <span className="text-xs text-foreground">{task.estimate}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Time Spent</span>
                    <span className="text-xs text-foreground">{task.timeSpent}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Actions</h3>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Edit3 className="h-3 w-3 mr-2" />
                    Edit Task
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Clock className="h-3 w-3 mr-2" />
                    Log Time
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Archive className="h-3 w-3 mr-2" />
                    Archive
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