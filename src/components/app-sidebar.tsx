"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { usePathname } from "next/navigation"
import { 
  Home,
  BarChart3,
  FileText,
  Settings,
  TrendingUp,
  Plus,
  Search,
  Bell,
  Circle,
  DollarSign,
  Euro,
  AlertTriangle,
  Users,
  RefreshCw,
  LucideIcon
} from "lucide-react"

interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: number | null;
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Projects",
    url: "/projects", 
    icon: BarChart3,
  },
  {
    title: "Clients",
    url: "/clients", 
    icon: Users,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
    badge: 10,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Plus,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: TrendingUp,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "🧪 Integration Test",
    url: "/integrations-test",
    icon: RefreshCw,
  },
]

const recentProjects = [
  {
    name: "Website Redesign",
    id: "TINKSO-001",
    color: "text-chart-2",
    margin: { amount: 13000, percentage: 28.9, currency: "EUR" },
    status: "active"
  },
  {
    name: "Mobile App Development", 
    id: "TINKSO-002",
    color: "text-chart-4",
    margin: { amount: 13000, percentage: 16.7, currency: "USD" },
    status: "active"
  },
  {
    name: "E-commerce Platform",
    id: "TINKSO-003", 
    color: "text-primary",
    margin: { amount: 25000, percentage: 20.8, currency: "EUR" },
    status: "active"
  },
  {
    name: "Security Audit",
    id: "TINKSO-006",
    color: "text-chart-5", 
    margin: { amount: 6000, percentage: 33.3, currency: "EUR" },
    status: "active"
  }
]

const pendingInvoicesCount = 3

export function AppSidebar() {
  const pathname = usePathname()
  
  const isActiveRoute = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(url)
  }

  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      {/* Tinkso Header */}
      <SidebarHeader className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-sidebar-primary rounded flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-semibold text-xs">T</span>
          </div>
          <div>
            <h1 className="font-medium text-sm text-sidebar-foreground">Tinkso Margin Tracker</h1>
            <p className="text-xs text-muted-foreground">Financial Analytics</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-sidebar">
        {/* Quick Actions - Financial Focus */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
                  <Search className="h-3.5 w-3.5" />
                  <span className="text-xs">Search...</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">⌘K</Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">New Project</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">⌘N</Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/invoices/queue" className={`gap-2 px-3 py-2 rounded-none transition-colors ${
                    pendingInvoicesCount > 0 
                      ? 'bg-chart-3/10 text-chart-3 hover:bg-chart-3/20 border-l-2 border-chart-3' 
                      : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}>
                    <AlertTriangle className={`h-3.5 w-3.5 ${pendingInvoicesCount > 0 ? 'text-chart-3' : ''}`} />
                    <span className="text-xs font-medium">Process Queue</span>
                    <Badge className={`ml-auto text-[10px] ${
                      pendingInvoicesCount > 0 
                        ? 'bg-chart-3 text-white animate-pulse' 
                        : 'bg-chart-3 text-white'
                    }`}>
                      {pendingInvoicesCount}
                    </Badge>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="border-t border-sidebar-border pt-2">
          <SidebarGroupLabel className="px-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {navigationItems.map((item) => {
                const isActive = isActiveRoute(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a 
                        href={item.url} 
                        className={`gap-2 px-3 py-2 rounded-none transition-colors ${
                          isActive 
                            ? 'bg-sidebar-accent text-sidebar-foreground border-r-2 border-sidebar-primary' 
                            : 'text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        } data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground`}
                      >
                        <item.icon className={`h-3.5 w-3.5 ${isActive ? 'text-sidebar-primary' : ''}`} />
                        <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>{item.title}</span>
                        {item.badge && (
                          <Badge className={`ml-auto text-[10px] ${
                            isActive 
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                              : 'bg-sidebar-primary text-sidebar-primary-foreground'
                          }`}>
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Projects */}
        <SidebarGroup className="border-t border-sidebar-border pt-2">
          <SidebarGroupLabel className="px-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center justify-between">
            <span>Recent Projects</span>
            <Plus className="h-3 w-3 cursor-pointer hover:text-sidebar-foreground text-subtle" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {recentProjects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
                    <Circle className={`h-2 w-2 ${project.color} fill-current flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium truncate text-sidebar-foreground">{project.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-subtle font-mono">{project.id}</span>
                        <span className="text-[10px] text-subtle">
                          {project.margin.percentage}% • {project.margin.currency === 'EUR' ? '€' : '$'}{project.margin.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border bg-sidebar">
        <SidebarMenu className="space-y-0">
          <SidebarMenuItem>
            <ThemeSwitcher />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/settings" className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
                <Settings className="h-3.5 w-3.5" />
                <span className="text-xs">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2 px-3 py-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-none">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/avatars/user.jpg" />
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">TU</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-xs font-medium text-sidebar-foreground">Tinkso User</p>
                <p className="text-[10px] text-subtle">user@tinkso.com</p>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}