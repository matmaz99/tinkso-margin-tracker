'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Settings,
  Link as LinkIcon,
  Key,
  Shield,
  Bell,
  Globe,
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  TestTube,
  Zap,
  Eye,
  EyeOff
} from "lucide-react"
import { useState } from "react"

// Mock integration status data - will be replaced with real API calls in Phase 3
const integrationStatus = {
  clickup: {
    connected: true,
    lastSync: "2 minutes ago",
    status: "active",
    apiKey: "pk_2457496_8HDO7D8HEX91LD2UCQJQU8VK7K9FQJTU"
  },
  qonto: {
    connected: true,
    lastSync: "5 minutes ago", 
    status: "active",
    apiKey: "tinkso-5576:91ec5b4cfc34b6d2c6f52be50fc56743"
  },
  supabase: {
    connected: false,
    lastSync: "Never",
    status: "disconnected",
    apiKey: ""
  }
}

const notificationSettings = {
  emailAlerts: true,
  slackNotifications: false,
  overdueInvoices: true,
  marginThresholds: true,
  weeklyReports: true
}

export default function SettingsPage() {
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [isTesting, setIsTesting] = useState({
    clickup: false,
    qonto: false,
    supabase: false
  })

  const handleTestConnection = async (integration: string) => {
    setIsTesting(prev => ({ ...prev, [integration]: true }))
    // Simulate API test
    setTimeout(() => {
      setIsTesting(prev => ({ ...prev, [integration]: false }))
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Linear-style Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-12 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-medium text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">
              Configure integrations, notifications, and application preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh All
            </Button>
            <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
              <Save className="h-3 w-3" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Integration Settings */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-foreground">API Integrations</h2>
            
            {/* ClickUp Integration */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-chart-4 rounded-lg flex items-center justify-center">
                    <LinkIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">ClickUp</h3>
                    <p className="text-xs text-muted-foreground">Task management and project tracking</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                    Connected
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => handleTestConnection('clickup')}
                    disabled={isTesting.clickup}
                  >
                    {isTesting.clickup ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <TestTube className="h-3 w-3 mr-1" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">API Key</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 text-xs"
                    onClick={() => setShowApiKeys(!showApiKeys)}
                  >
                    {showApiKeys ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                <Input 
                  type={showApiKeys ? "text" : "password"}
                  value={integrationStatus.clickup.apiKey}
                  className="text-xs font-mono"
                  readOnly
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last sync: {integrationStatus.clickup.lastSync}</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-chart-2" />
                    <span className="text-chart-2">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Qonto Integration */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-chart-2 rounded-lg flex items-center justify-center">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Qonto</h3>
                    <p className="text-xs text-muted-foreground">Business banking and expense management</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                    Connected
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => handleTestConnection('qonto')}
                    disabled={isTesting.qonto}
                  >
                    {isTesting.qonto ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <TestTube className="h-3 w-3 mr-1" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">API Key</span>
                </div>
                <Input 
                  type={showApiKeys ? "text" : "password"}
                  value={integrationStatus.qonto.apiKey}
                  className="text-xs font-mono"
                  readOnly
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last sync: {integrationStatus.qonto.lastSync}</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-chart-2" />
                    <span className="text-chart-2">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supabase Integration */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-chart-3 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Supabase</h3>
                    <p className="text-xs text-muted-foreground">Database and authentication backend</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                    Disconnected
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => handleTestConnection('supabase')}
                    disabled={isTesting.supabase}
                  >
                    {isTesting.supabase ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <TestTube className="h-3 w-3 mr-1" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">API Key</span>
                </div>
                <Input 
                  type="text"
                  placeholder="Enter Supabase API key..."
                  className="text-xs font-mono"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last sync: {integrationStatus.supabase.lastSync}</span>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">Disconnected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-foreground">Notification Preferences</h2>
            
            <div className="bg-card border border-border p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Email Alerts</h3>
                    <p className="text-xs text-muted-foreground">Receive email notifications for important events</p>
                  </div>
                  <Button variant={notificationSettings.emailAlerts ? "default" : "outline"} size="sm" className="h-6 text-xs">
                    {notificationSettings.emailAlerts ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Overdue Invoice Alerts</h3>
                    <p className="text-xs text-muted-foreground">Get notified when invoices become overdue</p>
                  </div>
                  <Button variant={notificationSettings.overdueInvoices ? "default" : "outline"} size="sm" className="h-6 text-xs">
                    {notificationSettings.overdueInvoices ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Margin Threshold Alerts</h3>
                    <p className="text-xs text-muted-foreground">Alert when project margins fall below threshold</p>
                  </div>
                  <Button variant={notificationSettings.marginThresholds ? "default" : "outline"} size="sm" className="h-6 text-xs">
                    {notificationSettings.marginThresholds ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Weekly Reports</h3>
                    <p className="text-xs text-muted-foreground">Receive weekly financial performance summaries</p>
                  </div>
                  <Button variant={notificationSettings.weeklyReports ? "default" : "outline"} size="sm" className="h-6 text-xs">
                    {notificationSettings.weeklyReports ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-foreground">System Information</h2>
            
            <div className="bg-card border border-border p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Application Version</h3>
                  <p className="text-xs text-muted-foreground">Tinkso Margin Tracker v1.0.0</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Last Backup</h3>
                  <p className="text-xs text-muted-foreground">Today at 3:00 AM</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Data Retention</h3>
                  <p className="text-xs text-muted-foreground">12 months (configurable)</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Storage Used</h3>
                  <p className="text-xs text-muted-foreground">2.4 GB of 10 GB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}