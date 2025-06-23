import { createClient } from './client'
import { 
  Project, 
  Task, 
  Profile,
  ProjectInsert,
  TaskInsert,
  ProjectWithTasks,
  TaskWithDetails 
} from './types'

// Client-side queries (for use in 'use client' components)

// Profile queries
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return { user, profile }
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  return data
}

// Project queries
export async function getProjects(): Promise<ProjectWithTasks[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      tasks (*),
      project_members (
        *,
        profiles (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`)
  }

  return data as ProjectWithTasks[]
}

export async function getProject(id: string): Promise<ProjectWithTasks | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      tasks (*),
      project_members (
        *,
        profiles (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch project: ${error.message}`)
  }

  return data as ProjectWithTasks
}

export async function createProject(project: ProjectInsert): Promise<Project> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }

  // Automatically add the owner as a project member
  const { error: memberError } = await supabase
    .from('project_members')
    .insert([{
      project_id: data.id,
      user_id: data.owner_id,
      role: 'owner'
    }])

  if (memberError) {
    console.error('Failed to add owner as project member:', memberError)
  }

  return data
}

export async function updateProject(id: string, updates: Partial<ProjectInsert>): Promise<Project> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`)
  }

  return data
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`)
  }
}

// Task queries
export async function getTasks(): Promise<TaskWithDetails[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (*),
      assignee:profiles!tasks_assignee_id_fkey (*),
      reporter:profiles!tasks_reporter_id_fkey (*),
      task_labels (*),
      comments (
        *,
        profiles (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return data as TaskWithDetails[]
}

export async function getTask(id: string): Promise<TaskWithDetails | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (*),
      assignee:profiles!tasks_assignee_id_fkey (*),
      reporter:profiles!tasks_reporter_id_fkey (*),
      task_labels (*),
      comments (
        *,
        profiles (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch task: ${error.message}`)
  }

  return data as TaskWithDetails
}

export async function getTasksByProject(projectId: string): Promise<TaskWithDetails[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (*),
      assignee:profiles!tasks_assignee_id_fkey (*),
      reporter:profiles!tasks_reporter_id_fkey (*),
      task_labels (*),
      comments (
        *,
        profiles (*)
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tasks for project: ${error.message}`)
  }

  return data as TaskWithDetails[]
}

export async function createTask(task: TaskInsert): Promise<Task> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  return data
}

export async function updateTask(id: string, updates: Partial<TaskInsert>): Promise<Task> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }

  return data
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`)
  }
}

// Team queries
export async function getTeamMembers(): Promise<Profile[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`)
  }

  return data
}

export async function getTeamMember(id: string): Promise<Profile | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch team member: ${error.message}`)
  }

  return data
}

// Utility functions
export async function generateProjectKey(name: string): Promise<string> {
  const supabase = createClient()
  
  // Create a base key from the first 4 letters of the project name
  const baseKey = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4)
  
  // Check if this key already exists
  const { data, error } = await supabase
    .from('projects')
    .select('key')
    .like('key', `${baseKey}%`)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    throw new Error(`Failed to check project keys: ${error.message}`)
  }
  
  // If no existing keys, use the base key with -001
  if (!data || data.length === 0) {
    return `${baseKey}-001`
  }
  
  // Otherwise, increment the number
  const lastKey = data[0].key
  const lastNumber = parseInt(lastKey.split('-').pop() || '000')
  const nextNumber = String(lastNumber + 1).padStart(3, '0')
  
  return `${baseKey}-${nextNumber}`
}

export async function generateTaskKey(projectKey: string): Promise<string> {
  const supabase = createClient()
  
  // Find the highest task number for this project
  const { data, error } = await supabase
    .from('tasks')
    .select('key')
    .like('key', `${projectKey}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    throw new Error(`Failed to check task keys: ${error.message}`)
  }
  
  let nextNumber = 1
  if (data && data.length > 0) {
    const lastKey = data[0].key
    const lastNumber = parseInt(lastKey.split('-').pop() || '0')
    nextNumber = lastNumber + 1
  }
  
  return `${projectKey}-${nextNumber}`
}