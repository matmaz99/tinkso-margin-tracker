'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { 
  Users,
  UserPlus,
  Settings,
  Shield,
  Clock,
  Mail,
  Phone,
  Calendar,
  Activity,
  LogOut,
  Edit,
  Trash2,
  Key,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter
} from "lucide-react"

// Mock data for the 5 admin users - will be replaced with real Supabase queries in Phase 3
const mockUsers = [
  {
    id: 1,
    email: "admin@tinkso.com",
    name: "Admin User",
    role: "Super Admin",
    status: "active",
    lastActive: "2024-02-15T10:30:00Z",
    joinDate: "2024-01-01",
    avatar: "/avatars/admin.jpg",
    sessionCount: 45,
    lastLoginIp: "192.168.1.100",
    mfaEnabled: true,
    permissions: ["all"]
  },
  {
    id: 2,
    email: "finance@tinkso.com",
    name: "Finance Manager",
    role: "Admin",
    status: "active",
    lastActive: "2024-02-15T09:15:00Z",
    joinDate: "2024-01-05",
    avatar: "/avatars/finance.jpg",
    sessionCount: 32,
    lastLoginIp: "192.168.1.101",
    mfaEnabled: true,
    permissions: ["all"]
  },
  {
    id: 3,
    email: "project@tinkso.com",
    name: "Project Manager",
    role: "Admin",
    status: "active",
    lastActive: "2024-02-15T08:45:00Z",
    joinDate: "2024-01-10",
    avatar: "/avatars/project.jpg",
    sessionCount: 28,
    lastLoginIp: "192.168.1.102",
    mfaEnabled: false,
    permissions: ["all"]
  },
  {
    id: 4,
    email: "operations@tinkso.com",
    name: "Operations Lead",
    role: "Admin",
    status: "active",
    lastActive: "2024-02-14T16:20:00Z",
    joinDate: "2024-01-15",
    avatar: "/avatars/operations.jpg",
    sessionCount: 19,
    lastLoginIp: "192.168.1.103",
    mfaEnabled: true,
    permissions: ["all"]
  },
  {
    id: 5,
    email: "analyst@tinkso.com",
    name: "Data Analyst",
    role: "Admin",
    status: "inactive",
    lastActive: "2024-02-10T14:30:00Z",
    joinDate: "2024-01-20",
    avatar: "/avatars/analyst.jpg",
    sessionCount: 12,
    lastLoginIp: "192.168.1.104",
    mfaEnabled: false,
    permissions: ["all"]
  }
]

const mockActivityLog = [
  { user: "Admin User", action: "Logged in", timestamp: "2024-02-15T10:30:00Z", ip: "192.168.1.100" },
  { user: "Finance Manager", action: "Updated invoice INV-2024-001", timestamp: "2024-02-15T09:15:00Z", ip: "192.168.1.101" },
  { user: "Project Manager", action: "Created new project", timestamp: "2024-02-15T08:45:00Z", ip: "192.168.1.102" },
  { user: "Admin User", action: "Exported financial report", timestamp: "2024-02-15T08:00:00Z", ip: "192.168.1.100" },
  { user: "Operations Lead", action: "Processed supplier invoice", timestamp: "2024-02-14T16:20:00Z", ip: "192.168.1.103" }
]

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || user.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const activeUsers = mockUsers.filter(u => u.status === 'active').length
  const totalSessions = mockUsers.reduce((sum, u) => sum + u.sessionCount, 0)
  const mfaEnabledCount = mockUsers.filter(u => u.mfaEnabled).length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      case 'inactive':
        return <Badge variant="secondary" className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatLastActive = (timestamp: string) => {
    const now = new Date()
    const lastActive = new Date(timestamp)
    const diffMs = now.getTime() - lastActive.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <>
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">User Management</h1>
            <p className="text-xs text-muted-foreground">
              Manage team members, roles, and access permissions
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage admin users, sessions, and access permissions for Tinkso Margin Tracker
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Activity Log
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="ml-2 text-sm font-medium">Total Users</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} active
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="ml-2 text-sm font-medium">Total Sessions</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              All time logins
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="ml-2 text-sm font-medium">MFA Enabled</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{mfaEnabledCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((mfaEnabledCount / mockUsers.length) * 100)}% coverage
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span className="ml-2 text-sm font-medium">System Health</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-chart-2">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </Card>

      {/* Users List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Admin Users</h3>
          <Badge variant="outline">{filteredUsers.length} users</Badge>
        </div>
        
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">{user.role}</p>
                  <p className="text-xs text-muted-foreground">All Permissions</p>
                </div>
                
                <div>
                  {getStatusBadge(user.status)}
                  <p className="text-xs text-muted-foreground mt-1">
                    Last active: {formatLastActive(user.lastActive)}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    {user.mfaEnabled ? (
                      <Badge variant="default" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        MFA
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No MFA
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.sessionCount} sessions
                  </p>
                </div>
                
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Key className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                  {user.id !== 1 && (
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Session Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
          <div className="space-y-3">
            {filteredUsers.filter(u => u.status === 'active').map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.lastLoginIp}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {formatLastActive(user.lastActive)}
                  </span>
                  <Button variant="outline" size="sm">
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {mockActivityLog.map((activity, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.user}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()} • {activity.ip}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View Full Activity Log
          </Button>
        </Card>
      </div>

      {/* Security Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Security Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium">Password Policy</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-chart-2 mr-2" />
                Minimum 8 characters
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-chart-2 mr-2" />
                Special characters required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-chart-2 mr-2" />
                Password history: 5
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Session Management</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-chart-4 mr-2" />
                Session timeout: 8 hours
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-chart-4 mr-2" />
                Concurrent sessions: 3 max
              </div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-chart-4 mr-2" />
                Idle timeout: 30 minutes
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Access Control</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-chart-5 mr-2" />
                Role: Admin (All access)
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-chart-5 mr-2" />
                IP Whitelist: Office network
              </div>
              <div className="flex items-center">
                <Key className="h-4 w-4 text-chart-5 mr-2" />
                MFA recommended
              </div>
            </div>
          </div>
        </div>
      </Card>
        </div>
      </main>
    </>
  )
}