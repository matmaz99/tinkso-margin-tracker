// ClickUp API client for project management integration
import { createClient } from '@/lib/supabase/client'

export interface ClickUpConfig {
  apiToken: string
  listId: string
  spaceId: string
  baseUrl: string
}

export interface ClickUpTask {
  id: string
  name: string
  description?: string
  status: {
    status: string
    color: string
  }
  priority?: {
    priority: string
    color: string
  }
  assignees: Array<{
    id: number
    username: string
    email: string
  }>
  due_date?: string
  start_date?: string
  time_estimate?: number
  time_spent?: number
  custom_fields: Array<{
    id: string
    name: string
    value: any
    type: string
  }>
  tags: Array<{
    name: string
    tag_fg: string
    tag_bg: string
  }>
  url: string
  date_created: string
  date_updated: string
}

export interface ClickUpProject {
  id: string
  name: string
  description?: string
  status: string
  clickup_task_id?: string
  clickup_list_id?: string
  sync_enabled: boolean
  last_sync?: string
}

export interface ClickUpFolder {
  id: string
  name: string
  orderindex: number
  override_statuses: boolean
  hidden: boolean
  space: {
    id: string
    name: string
  }
  task_count: string
  lists: Array<{
    id: string
    name: string
    task_count: number
  }>
}

export class ClickUpClient {
  private config: ClickUpConfig
  private headers: HeadersInit

  constructor(config: ClickUpConfig) {
    this.config = config
    this.headers = {
      'Authorization': config.apiToken,
      'Content-Type': 'application/json'
    }
  }

  // Get all folders from the configured space (these represent projects)
  async getFolders(options: {
    archived?: boolean
  } = {}): Promise<{ folders: ClickUpFolder[] }> {
    const params = new URLSearchParams()
    
    if (options.archived !== undefined) params.append('archived', options.archived.toString())

    const url = `${this.config.baseUrl}/space/${this.config.spaceId}/folder?${params.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Get all tasks from the configured list
  async getTasks(options: {
    archived?: boolean
    include_closed?: boolean
    page?: number
    order_by?: string
    reverse?: boolean
    subtasks?: boolean
    statuses?: string[]
    include_markdown_description?: boolean
  } = {}): Promise<{ tasks: ClickUpTask[] }> {
    const params = new URLSearchParams()
    
    if (options.archived !== undefined) params.append('archived', options.archived.toString())
    if (options.include_closed !== undefined) params.append('include_closed', options.include_closed.toString())
    if (options.page !== undefined) params.append('page', options.page.toString())
    if (options.order_by) params.append('order_by', options.order_by)
    if (options.reverse !== undefined) params.append('reverse', options.reverse.toString())
    if (options.subtasks !== undefined) params.append('subtasks', options.subtasks.toString())
    if (options.statuses) params.append('statuses[]', options.statuses.join(','))
    if (options.include_markdown_description !== undefined) {
      params.append('include_markdown_description', options.include_markdown_description.toString())
    }

    const url = `${this.config.baseUrl}/list/${this.config.listId}/task?${params.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Get a specific task by ID
  async getTask(taskId: string, options: {
    custom_task_ids?: boolean
    team_id?: string
    include_subtasks?: boolean
    include_markdown_description?: boolean
  } = {}): Promise<ClickUpTask> {
    const params = new URLSearchParams()
    
    if (options.custom_task_ids !== undefined) params.append('custom_task_ids', options.custom_task_ids.toString())
    if (options.team_id) params.append('team_id', options.team_id)
    if (options.include_subtasks !== undefined) params.append('include_subtasks', options.include_subtasks.toString())
    if (options.include_markdown_description !== undefined) {
      params.append('include_markdown_description', options.include_markdown_description.toString())
    }

    const url = `${this.config.baseUrl}/task/${taskId}?${params.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Create a new task
  async createTask(taskData: {
    name: string
    description?: string
    assignees?: number[]
    tags?: string[]
    status?: string
    priority?: number
    due_date?: number
    due_date_time?: boolean
    time_estimate?: number
    start_date?: number
    start_date_time?: boolean
    notify_all?: boolean
    parent?: string
    links_to?: string
    check_required_custom_fields?: boolean
    custom_fields?: Array<{
      id: string
      value: any
    }>
  }): Promise<ClickUpTask> {
    const url = `${this.config.baseUrl}/list/${this.config.listId}/task`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(taskData)
    })

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Update an existing task
  async updateTask(taskId: string, taskData: {
    name?: string
    description?: string
    status?: string
    priority?: number
    due_date?: number
    due_date_time?: boolean
    time_estimate?: number
    start_date?: number
    start_date_time?: boolean
    assignees?: {
      add?: number[]
      rem?: number[]
    }
    archived?: boolean
  }): Promise<ClickUpTask> {
    const url = `${this.config.baseUrl}/task/${taskId}`
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(taskData)
    })

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Add a comment to a task
  async addComment(taskId: string, commentText: string, options: {
    assignee?: number
    notify_all?: boolean
  } = {}): Promise<{ id: string }> {
    const url = `${this.config.baseUrl}/task/${taskId}/comment`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        comment_text: commentText,
        assignee: options.assignee,
        notify_all: options.notify_all
      })
    })

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Get time tracking entries for a task
  async getTimeEntries(taskId: string): Promise<{
    data: Array<{
      id: string
      task: { id: string; name: string }
      watcher: { id: string; username: string }
      user: { id: string; username: string }
      billable: boolean
      start: string
      end: string
      time: number
      source: string
      description: string
    }>
  }> {
    const url = `${this.config.baseUrl}/task/${taskId}/time`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Create time tracking entry
  async createTimeEntry(taskId: string, timeData: {
    description?: string
    start: number
    billable?: boolean
    duration: number
    assignee?: number
  }): Promise<{
    data: {
      id: string
      task: { id: string }
      watcher: { id: string; username: string }
      user: { id: string; username: string }
      billable: boolean
      start: string
      end: string
      time: number
      description: string
    }
  }> {
    const url = `${this.config.baseUrl}/task/${taskId}/time`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(timeData)
    })

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Test API connection
  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const url = `${this.config.baseUrl}/user`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      })

      if (!response.ok) {
        return {
          success: false,
          error: `API connection failed: ${response.status} ${response.statusText}`
        }
      }

      const userData = await response.json()
      return {
        success: true,
        user: userData.user
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Factory function to create ClickUp client with configuration
export async function createClickUpClient(): Promise<ClickUpClient | null> {
  try {
    // In a real implementation, these would be stored in environment variables
    // or user settings in the database
    const config: ClickUpConfig = {
      apiToken: process.env.CLICKUP_API_TOKEN || 'pk_2457496_8HDO7D8HEX91LD2UCQJQU8VK7K9FQJTU',
      listId: process.env.CLICKUP_LIST_ID || '901512074401',
      spaceId: process.env.CLICKUP_SPACE_ID || '32273070',
      baseUrl: 'https://api.clickup.com/api/v2'
    }

    if (!config.apiToken || !config.listId || !config.spaceId) {
      console.warn('ClickUp configuration missing. Integration disabled.')
      return null
    }

    return new ClickUpClient(config)
  } catch (error) {
    console.error('Failed to create ClickUp client:', error)
    return null
  }
}

// Utility functions for project synchronization

export interface ProjectSyncData {
  project_id: string
  project_name: string
  project_description?: string
  clickup_task_id?: string
  sync_enabled: boolean
  financial_data?: {
    revenue: number
    costs: number
    margin: number
    margin_percentage: number
  }
}

export class ProjectSyncService {
  private clickupClient: ClickUpClient
  private supabase: ReturnType<typeof createClient>

  constructor(clickupClient: ClickUpClient) {
    this.clickupClient = clickupClient
    this.supabase = createClient()
  }

  // Sync project to ClickUp as a task
  async syncProjectToClickUp(projectData: ProjectSyncData): Promise<{
    success: boolean
    clickup_task_id?: string
    error?: string
  }> {
    try {
      // Check if project already has a ClickUp task
      if (projectData.clickup_task_id) {
        // Update existing task
        await this.clickupClient.updateTask(projectData.clickup_task_id, {
          name: `[Project] ${projectData.project_name}`,
          description: this.buildProjectDescription(projectData)
        })

        return {
          success: true,
          clickup_task_id: projectData.clickup_task_id
        }
      } else {
        // Create new task
        const newTask = await this.clickupClient.createTask({
          name: `[Project] ${projectData.project_name}`,
          description: this.buildProjectDescription(projectData),
          tags: ['project', 'tinkso-margin-tracker'],
          custom_fields: [
            {
              id: 'c0041616-c214-48a0-95d2-1c085d4f15ed', // Framework-Type field
              value: 'Project Tracking'
            }
          ]
        })

        // Update project in Supabase with ClickUp task ID
        await this.supabase
          .from('projects')
          .update({
            clickup_task_id: newTask.id,
            sync_enabled: true,
            last_sync: new Date().toISOString()
          })
          .eq('id', projectData.project_id)

        return {
          success: true,
          clickup_task_id: newTask.id
        }
      }
    } catch (error) {
      console.error('Failed to sync project to ClickUp:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Build project description for ClickUp task
  private buildProjectDescription(projectData: ProjectSyncData): string {
    let description = `**Project:** ${projectData.project_name}\n\n`
    
    if (projectData.project_description) {
      description += `**Description:** ${projectData.project_description}\n\n`
    }

    if (projectData.financial_data) {
      description += `**Financial Summary:**\n`
      description += `- Revenue: €${projectData.financial_data.revenue.toLocaleString()}\n`
      description += `- Costs: €${projectData.financial_data.costs.toLocaleString()}\n`
      description += `- Margin: €${projectData.financial_data.margin.toLocaleString()} (${projectData.financial_data.margin_percentage.toFixed(1)}%)\n\n`
    }

    description += `**Integration:** Synced from Tinkso Margin Tracker\n`
    description += `**Last Updated:** ${new Date().toLocaleString()}`

    return description
  }

  // Sync all projects to ClickUp
  async syncAllProjects(): Promise<{
    success: boolean
    synced_count: number
    errors: string[]
  }> {
    const errors: string[] = []
    let syncedCount = 0

    try {
      // Get all projects from Supabase
      const { data: projects, error } = await this.supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          clickup_task_id,
          sync_enabled,
          client_invoices(amount_total, status),
          manual_expenses(amount),
          invoice_project_assignments(amount_assigned)
        `)

      if (error) {
        throw error
      }

      // Sync each project
      for (const project of projects || []) {
        try {
          // Calculate financial data
          const revenue = (project.client_invoices || []).reduce((sum: number, inv: any) => 
            inv.status === 'paid' ? sum + inv.amount_total : sum, 0
          )
          const costs = (project.manual_expenses || []).reduce((sum: number, exp: any) => 
            sum + exp.amount, 0
          ) + (project.invoice_project_assignments || []).reduce((sum: number, assign: any) => 
            sum + assign.amount_assigned, 0
          )
          const margin = revenue - costs
          const marginPercentage = revenue > 0 ? (margin / revenue) * 100 : 0

          const syncData: ProjectSyncData = {
            project_id: project.id,
            project_name: project.name,
            project_description: project.description,
            clickup_task_id: project.clickup_task_id,
            sync_enabled: project.sync_enabled,
            financial_data: {
              revenue,
              costs,
              margin,
              margin_percentage: marginPercentage
            }
          }

          const result = await this.syncProjectToClickUp(syncData)
          
          if (result.success) {
            syncedCount++
          } else {
            errors.push(`Project ${project.name}: ${result.error}`)
          }
        } catch (error) {
          errors.push(`Project ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return {
        success: errors.length === 0,
        synced_count: syncedCount,
        errors
      }
    } catch (error) {
      return {
        success: false,
        synced_count: syncedCount,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}