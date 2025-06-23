"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from "@/components/ui/card"
import { 
  Home, 
  Plus, 
  Search, 
  Settings, 
  FolderOpen, 
  CheckSquare, 
  Users, 
  Bell,
  Copy,
  Palette,
  Type,
  Square,
  Circle,
  ChevronDown,
  Filter,
  ChevronRight,
  FolderIcon,
  Clock,
  CheckCircle,
  TrendingUp,
  MoreHorizontal,
  Calendar,
  Sun,
  Moon
} from "lucide-react"

export default function StyleguidePage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const colorVars = [
    { name: "Primary", lightHex: "#6366f1", darkHex: "#a5b4fc", description: "Main brand color (Indigo)" },
    { name: "Background", lightHex: "#fafafa", darkHex: "#0a0a0a", description: "Main page background" },
    { name: "Foreground", lightHex: "#171717", darkHex: "#f5f5f5", description: "Main text color" },
    { name: "Card", lightHex: "#ffffff", darkHex: "#171717", description: "Card backgrounds" },
    { name: "Border", lightHex: "#e4e4e7", darkHex: "#27272a", description: "Border color" },
    { name: "Muted", lightHex: "#f4f4f5", darkHex: "#27272a", description: "Muted backgrounds" },
    { name: "Muted Foreground", lightHex: "#737373", darkHex: "#a3a3a3", description: "Secondary text" },
    { name: "Subtle", lightHex: "#525252", darkHex: "#71717a", description: "Very subtle text (timestamps, metadata)" },
  ]

  const chartColors = [
    { name: "Chart 1", lightHex: "#6366f1", darkHex: "#a5b4fc", description: "Primary" },
    { name: "Chart 2", lightHex: "#10b981", darkHex: "#34d399", description: "Emerald" },
    { name: "Chart 3", lightHex: "#f59e0b", darkHex: "#fbbf24", description: "Amber" },
    { name: "Chart 4", lightHex: "#3b82f6", darkHex: "#60a5fa", description: "Blue" },
    { name: "Chart 5", lightHex: "#a855f7", darkHex: "#c4b5fd", description: "Purple" },
  ]

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Linear-style Header */}
        <header className="border-b border-border bg-background">
          <div className="flex h-12 items-center px-4">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-sm font-medium text-foreground">Design System</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                <Copy className="h-3 w-3 mr-1" />
                Copy CSS
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                <Filter className="h-3 w-3 mr-1" />
                Filter
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
                <h2 className="text-lg font-medium text-foreground mb-1">FlowTask Design System</h2>
                <p className="text-sm text-muted-foreground">
                  Complete design system reference for the FlowTask application
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  <Circle className="h-2 w-2 mr-1 fill-primary text-primary" />
                  shadcn/ui
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  <Type className="h-2 w-2 mr-1" />
                  Inter
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  <Moon className="h-2 w-2 mr-1" />
                  Light & Dark
                </Badge>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-xs font-medium text-muted-foreground">COLORS</span>
                  </div>
                  <Palette className="h-3 w-3 text-primary" />
                </div>
                <div className="text-2xl font-semibold text-foreground mb-1">15</div>
                <div className="text-xs text-muted-foreground">Adaptive colors</div>
              </div>

              <div className="bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                    <span className="text-xs font-medium text-muted-foreground">COMPONENTS</span>
                  </div>
                  <Square className="h-3 w-3 text-chart-2" />
                </div>
                <div className="text-2xl font-semibold text-foreground mb-1">17+</div>
                <div className="text-xs text-muted-foreground">Reusable components</div>
              </div>

              <div className="bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                    <span className="text-xs font-medium text-muted-foreground">TYPOGRAPHY</span>
                  </div>
                  <Type className="h-3 w-3 text-chart-3" />
                </div>
                <div className="text-2xl font-semibold text-foreground mb-1">6</div>
                <div className="text-xs text-muted-foreground">Text scales</div>
              </div>

              <div className="bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-5 rounded-full"></div>
                    <span className="text-xs font-medium text-muted-foreground">THEMES</span>
                  </div>
                  <Circle className="h-3 w-3 text-chart-5" />
                </div>
                <div className="text-2xl font-semibold text-foreground mb-1">2</div>
                <div className="text-xs text-muted-foreground">Light & Dark</div>
              </div>
            </div>

            {/* Theme System Comparison */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">Theme System Comparison</h3>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  <Circle className="h-3 w-3 mr-1" />
                  Live Demo
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Semantic Theme Classes */}
                <div className="bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Circle className="h-4 w-4 text-chart-2" />
                    <h4 className="text-sm font-medium text-foreground">Dual Theme System (✅ Working!)</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Complete light and dark theme system with semantic CSS variables.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-background border border-border rounded"></div>
                      <span className="text-xs text-muted-foreground">bg-background (✅ working!)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-card border border-border rounded"></div>
                      <span className="text-xs text-muted-foreground">bg-card (✅ working!)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded"></div>
                      <span className="text-xs text-muted-foreground">bg-primary (✅ working!)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground">text-foreground</span>
                      <span className="text-xs text-muted-foreground">text-muted-foreground</span>
                      <span className="text-xs text-subtle">text-subtle</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Currently:</span>
                      <span className="text-xs text-foreground font-medium">.dark theme active</span>
                    </div>
                  </div>
                </div>

                {/* Example Comparison */}
                <div className="bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">Color Mapping Reference</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Mapping between hardcoded and semantic classes.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-background border border-border rounded"></div>
                      <span className="text-xs text-muted-foreground">zinc-950 → background</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-card rounded"></div>
                      <span className="text-xs text-muted-foreground">zinc-900 → card</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded"></div>
                      <span className="text-xs text-muted-foreground">indigo-500 → primary</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Philosophy */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">Design Philosophy</h3>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  <Palette className="h-3 w-3 mr-1" />
                  View Examples
                </Button>
              </div>

              {/* Design Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">Linear-Inspired UI</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    FlowTask uses a sophisticated theme system inspired by Linear's design, supporting both light and dark modes with semantic colors.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-background border border-border rounded"></div>
                      <span className="text-xs text-muted-foreground">Background: var(--background)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-card border border-border rounded"></div>
                      <span className="text-xs text-muted-foreground">Card background: var(--card)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted rounded"></div>
                      <span className="text-xs text-muted-foreground">Borders: var(--border)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">Accent Colors</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Strategic use of color for status, priority, and semantic meaning while maintaining visual hierarchy.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded"></div>
                      <span className="text-xs text-muted-foreground">Primary actions: var(--primary)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-chart-2 rounded"></div>
                      <span className="text-xs text-muted-foreground">Success states: var(--chart-2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-chart-3 rounded"></div>
                      <span className="text-xs text-muted-foreground">Warning states: var(--chart-3)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">Color Palette</h3>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy all
                </Button>
              </div>

              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <h4 className="text-sm font-medium text-foreground">Brand Color Palette</h4>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    Dark Theme
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {colorVars.map((color) => (
                    <div key={color.name} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div 
                            className="h-16 rounded border border-border"
                            style={{ backgroundColor: color.lightHex }}
                          ></div>
                          <div className="text-[10px] text-muted-foreground mt-1 text-center">Light</div>
                        </div>
                        <div>
                          <div 
                            className="h-16 rounded border border-border"
                            style={{ backgroundColor: color.darkHex }}
                          ></div>
                          <div className="text-[10px] text-muted-foreground mt-1 text-center">Dark</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-xs text-foreground">{color.name}</h5>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                onClick={() => copyToClipboard(color.darkHex)}
                              >
                                <Copy className="h-2.5 w-2.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy hex</TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{color.description}</p>
                        <div className="grid grid-cols-2 gap-1">
                          <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono text-muted-foreground">{color.lightHex}</code>
                          <code className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono text-muted-foreground">{color.darkHex}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Components Demo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">Component Examples</h3>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  <Square className="h-3 w-3 mr-1" />
                  View all
                </Button>
              </div>

              {/* Buttons */}
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <h4 className="text-sm font-medium text-foreground">Buttons</h4>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    All Variants
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Button Variants</h5>
                    <div className="flex flex-wrap gap-3">
                      <Button size="sm" className="h-7 px-3 text-xs">Default</Button>
                      <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">Secondary</Button>
                      <Button variant="outline" size="sm" className="h-7 px-3 text-xs">Outline</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-3 text-xs">Ghost</Button>
                      <Button variant="destructive" size="sm" className="h-7 px-3 text-xs">Destructive</Button>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <h5 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">With Icons</h5>
                    <div className="flex flex-wrap gap-3">
                      <Button size="sm" className="gap-1.5 h-7 px-3 text-xs">
                        <Plus className="h-3 w-3" />
                        New Task
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 h-7 px-3 text-xs">
                        <Search className="h-3 w-3" />
                        Search
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 h-7 px-3 text-xs">
                        <Settings className="h-3 w-3" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-chart-4 rounded-full"></div>
                  <h4 className="text-sm font-medium text-foreground">Cards</h4>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    Layout
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Project Status</CardTitle>
                      <CardDescription className="text-xs">Current progress overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Circle className="h-2 w-2 fill-primary text-primary" />
                          <span className="text-xs text-muted-foreground">In Progress</span>
                        </div>
                        <Progress value={65} className="h-1.5" />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">8 of 12 tasks</span>
                          <span className="text-foreground">65% complete</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        Team Member
                        <CardAction>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </CardAction>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Active team member profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">John Doe</p>
                          <p className="text-xs text-muted-foreground">Frontend Developer</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Typography Hierarchy */}
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-chart-5 rounded-full"></div>
                  <h4 className="text-sm font-medium text-foreground">Typography Hierarchy</h4>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    Text Classes
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">text-foreground</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Primary text (#fafafa)</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">text-muted-foreground</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Secondary text (#a1a1aa)</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-subtle">text-subtle</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Metadata, timestamps (#71717a)</code>
                  </div>
                  <div className="mt-4 p-3 bg-muted border border-border rounded">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-foreground">Task Title</h5>
                        <span className="text-subtle text-xs">2 hours ago</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Task description goes here...</p>
                      <div className="flex items-center gap-2">
                        <span className="text-subtle text-xs">Created by John Doe</span>
                        <span className="text-subtle text-xs">•</span>
                        <span className="text-subtle text-xs">Due: Dec 25</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Elements */}
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                  <h4 className="text-sm font-medium text-foreground">Form Elements</h4>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    Inputs
                  </Badge>
                </div>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-2">Input Field</label>
                    <Input placeholder="Enter your text here..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-2">Textarea</label>
                    <Textarea placeholder="Enter a longer description..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">Design Guidelines</h3>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  View docs
                </Button>
              </div>

              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                  <h4 className="text-sm font-medium text-foreground">Design System Guidelines</h4>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    Best Practices
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-3 bg-muted border border-border rounded">
                    <h5 className="text-xs font-medium text-foreground mb-2">🌙 Dark Theme</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Primary background: var(--background)</li>
                      <li>• Card backgrounds: var(--card)</li>
                      <li>• Borders: var(--border)</li>
                      <li>• Text colors: foreground, muted-foreground, subtle</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-muted border border-border rounded">
                    <h5 className="text-xs font-medium text-foreground mb-2">🎨 Color Usage</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Primary color for main actions</li>
                      <li>• Chart-2 (emerald) for success states</li>
                      <li>• Chart-3 (amber) for warnings</li>
                      <li>• Destructive for error actions</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-muted border border-border rounded">
                    <h5 className="text-xs font-medium text-foreground mb-2">✨ Components</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• All shadcn/ui components</li>
                      <li>• Linear-inspired styling</li>
                      <li>• Consistent theme system</li>
                      <li>• Minimal hover states</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-muted border border-border rounded">
                    <h5 className="text-xs font-medium text-foreground mb-2">🔧 Development</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Use semantic colors for theming</li>
                      <li>• Hover states: accent backgrounds</li>
                      <li>• Focus states: ring color</li>
                      <li>• Card overlays for sections</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}