import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Filter,
  Mail,
  Calendar,
  Users,
  Trophy,
  Clock,
  CheckCircle2,
  User,
  Briefcase
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function TeamPage() {
  // Team member data
  const teamMembers = [
    {
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
      tasksAssigned: 8,
      tasksCompleted: 24,
      currentProjects: ["FLOW-001", "FLOW-004"],
      skills: ["React", "TypeScript", "UI/UX", "Figma"],
      lastActive: "2 minutes ago"
    },
    {
      id: "TM-002", 
      name: "Bob Smith",
      email: "bob.smith@flowtask.com",
      role: "Frontend Developer",
      department: "Engineering",
      avatar: "/avatars/bob.jpg",
      initials: "BS",
      status: "Active",
      joinDate: "Mar 8, 2023",
      location: "New York, NY",
      tasksAssigned: 6,
      tasksCompleted: 18,
      currentProjects: ["FLOW-001"],
      skills: ["React", "JavaScript", "CSS", "Jest"],
      lastActive: "15 minutes ago"
    },
    {
      id: "TM-003",
      name: "David Wilson", 
      email: "david.wilson@flowtask.com",
      role: "Backend Developer",
      department: "Engineering",
      avatar: "/avatars/david.jpg",
      initials: "DW",
      status: "Active",
      joinDate: "Feb 20, 2023",
      location: "Austin, TX",
      tasksAssigned: 5,
      tasksCompleted: 22,
      currentProjects: ["FLOW-002", "FLOW-005"],
      skills: ["Node.js", "PostgreSQL", "Docker", "AWS"],
      lastActive: "1 hour ago"
    },
    {
      id: "TM-004",
      name: "Eve Martinez",
      email: "eve.martinez@flowtask.com", 
      role: "Backend Developer",
      department: "Engineering",
      avatar: "/avatars/eve.jpg",
      initials: "EM",
      status: "Active",
      joinDate: "Apr 12, 2023",
      location: "Remote",
      tasksAssigned: 4,
      tasksCompleted: 16,
      currentProjects: ["FLOW-002"],
      skills: ["Python", "FastAPI", "MongoDB", "Redis"],
      lastActive: "30 minutes ago"
    },
    {
      id: "TM-005",
      name: "Frank Chen",
      email: "frank.chen@flowtask.com",
      role: "DevOps Engineer", 
      department: "Engineering",
      avatar: "/avatars/frank.jpg",
      initials: "FC",
      status: "Active",
      joinDate: "Jan 30, 2023",
      location: "Seattle, WA",
      tasksAssigned: 3,
      tasksCompleted: 14,
      currentProjects: ["FLOW-003"],
      skills: ["Kubernetes", "Terraform", "Monitoring", "CI/CD"],
      lastActive: "3 hours ago"
    },
    {
      id: "TM-006",
      name: "Grace Liu",
      email: "grace.liu@flowtask.com",
      role: "Technical Writer",
      department: "Product",
      avatar: "/avatars/grace.jpg", 
      initials: "GL",
      status: "Active",
      joinDate: "May 5, 2023",
      location: "Los Angeles, CA",
      tasksAssigned: 2,
      tasksCompleted: 12,
      currentProjects: ["FLOW-004"],
      skills: ["Documentation", "API Design", "Markdown", "Git"],
      lastActive: "45 minutes ago"
    },
    {
      id: "TM-007",
      name: "Ian Torres",
      email: "ian.torres@flowtask.com",
      role: "Security Engineer",
      department: "Security",
      avatar: "/avatars/ian.jpg",
      initials: "IT", 
      status: "Active",
      joinDate: "Jun 18, 2023",
      location: "Denver, CO",
      tasksAssigned: 4,
      tasksCompleted: 9,
      currentProjects: ["FLOW-005"],
      skills: ["Security", "Penetration Testing", "OWASP", "Compliance"],
      lastActive: "2 hours ago"
    },
    {
      id: "TM-008",
      name: "Luna Rodriguez",
      email: "luna.rodriguez@flowtask.com",
      role: "Data Engineer",
      department: "Data",
      avatar: "/avatars/luna.jpg",
      initials: "LR",
      status: "Away",
      joinDate: "Jul 22, 2023", 
      location: "Miami, FL",
      tasksAssigned: 3,
      tasksCompleted: 8,
      currentProjects: ["FLOW-006"],
      skills: ["Python", "Apache Spark", "Kafka", "Analytics"],
      lastActive: "1 day ago"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-emerald-600"
      case "Away": return "bg-amber-600"
      case "Offline": return "bg-muted"
      default: return "bg-muted"
    }
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Engineering": return "text-indigo-500"
      case "Product": return "text-violet-500"
      case "Security": return "text-red-500"
      case "Data": return "text-emerald-500"
      default: return "text-subtle"
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Team</h1>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search team members..." 
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
              Add Member
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1600px] mx-auto">
          {/* Team Table */}
          <div className="border border-border bg-card">
            {/* Table Header */}
            <div className="border-b border-border bg-muted">
              <div className="grid grid-cols-12 gap-4 p-3 text-xs text-muted-foreground font-medium">
                <div className="col-span-3">Member</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Department</div>
                <div className="col-span-2">Tasks</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Table Rows */}
            {teamMembers.map((member, index) => (
              <div 
                key={member.id} 
                className="grid grid-cols-12 gap-4 p-3 border-b border-border last:border-b-0 hover:bg-accent/50 cursor-pointer group"
              >
                {/* Member Info */}
                <div className="col-span-3 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-subtle" />
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="col-span-2 flex items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.role}</p>
                    <p className="text-xs text-subtle">{member.location}</p>
                  </div>
                </div>

                {/* Department */}
                <div className="col-span-2 flex items-center">
                  <Badge className={`text-xs px-2 py-0.5 bg-transparent border ${getDepartmentColor(member.department)}`}>
                    {member.department}
                  </Badge>
                </div>

                {/* Tasks */}
                <div className="col-span-2 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-subtle" />
                    <span className="text-xs text-muted-foreground">{member.tasksAssigned}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">{member.tasksCompleted}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center gap-2">
                  <Badge className={`text-xs px-2 py-0.5 text-white ${getStatusColor(member.status)}`}>
                    {member.status}
                  </Badge>
                  <span className="text-xs text-subtle">{member.lastActive}</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end">
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Member Details Panel (for selected member) */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            {/* Skills Overview */}
            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">Top Skills</span>
              </div>
              <div className="space-y-2">
                {["React", "TypeScript", "Node.js", "Python", "Docker"].map((skill) => (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{skill}</span>
                    <span className="text-xs text-subtle">
                      {Math.floor(Math.random() * 5) + 3} members
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Stats */}
            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-foreground">Departments</span>
              </div>
              <div className="space-y-2">
                {["Engineering", "Product", "Security", "Data"].map((dept) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{dept}</span>
                    <span className="text-xs text-subtle">
                      {teamMembers.filter(m => m.department === dept).length} members
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">Team Stats</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Total Members</span>
                    <span className="text-foreground font-medium">{teamMembers.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Active Now</span>
                    <span className="text-foreground font-medium">
                      {teamMembers.filter(m => m.status === "Active").length}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Total Tasks</span>
                    <span className="text-foreground font-medium">
                      {teamMembers.reduce((acc, m) => acc + m.tasksCompleted, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}