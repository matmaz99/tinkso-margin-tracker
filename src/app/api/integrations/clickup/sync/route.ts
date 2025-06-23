import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { createClickUpClient, ClickUpFolder } from '@/lib/clickup/client'

// Enhanced ClickUp sync with incremental updates
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)

    const body = await request.json()
    const { force_full_sync = false } = body

    // Create ClickUp client
    const clickupClient = await createClickUpClient()
    if (!clickupClient) {
      return NextResponse.json(
        { error: 'ClickUp integration not configured' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const syncStartTime = new Date().toISOString()

    // Log sync start
    const { data: syncLog, error: logError } = await supabase
      .from('clickup_sync_log')
      .insert({
        sync_type: 'project_folders',
        sync_status: 'started',
        started_at: syncStartTime
      })
      .select()
      .single()

    if (logError) {
      console.error('Failed to create sync log:', logError)
      return NextResponse.json(
        { error: 'Failed to initialize sync' },
        { status: 500 }
      )
    }

    let recordsProcessed = 0
    let recordsCreated = 0
    let recordsUpdated = 0
    let errorMessage: string | null = null

    try {
      // Fetch all folders from ClickUp space (these represent client projects)
      // Include archived projects to ensure complete project sync
      const { folders } = await clickupClient.getFolders({
        archived: true
      })

      recordsProcessed = folders.length

      // Process each folder as a project
      for (const folder of folders) {
        try {
          // Skip hidden folders
          if (folder.hidden) {
            continue
          }

          const isNewProject = await syncProjectFromClickUpFolder(supabase, folder)
          if (isNewProject) {
            recordsCreated++
          } else {
            recordsUpdated++
          }
        } catch (folderError) {
          console.error(`Failed to sync folder ${folder.id}:`, folderError)
          // Continue with other folders
        }
      }

      // Update sync log with success
      await supabase
        .from('clickup_sync_log')
        .update({
          sync_status: 'completed',
          records_processed: recordsProcessed,
          records_updated: recordsUpdated,
          records_created: recordsCreated,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

      return NextResponse.json({
        success: true,
        sync_id: syncLog.id,
        records_processed: recordsProcessed,
        records_updated: recordsUpdated,
        records_created: recordsCreated,
        sync_type: 'project_folders'
      })

    } catch (syncError) {
      errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error'
      console.error('ClickUp sync failed:', syncError)

      // Update sync log with error
      await supabase
        .from('clickup_sync_log')
        .update({
          sync_status: 'failed',
          records_processed: recordsProcessed,
          records_updated: recordsUpdated,
          records_created: recordsCreated,
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

      return NextResponse.json(
        {
          error: 'Sync failed',
          details: errorMessage,
          records_processed: recordsProcessed
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('ClickUp sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Sync project data from ClickUp folder
async function syncProjectFromClickUpFolder(supabase: any, folder: ClickUpFolder): Promise<boolean> {
  // Use folder name as project name
  const projectName = folder.name

  // Check if project already exists by folder ID
  const { data: existingProject } = await supabase
    .from('projects')
    .select('id, clickup_folder_id')
    .eq('clickup_folder_id', folder.id)
    .single()

  const projectData = {
    clickup_folder_id: folder.id,
    name: projectName,
    description: `ClickUp project folder: ${folder.name}`,
    client_name: extractClientFromFolderName(projectName),
    status: 'active', // Default status for folders
    last_sync_at: new Date().toISOString(),
    sync_status: 'success'
  }

  if (existingProject) {
    // Update existing project
    await supabase
      .from('projects')
      .update(projectData)
      .eq('id', existingProject.id)
    
    return false // Not a new project
  } else {
    // Create new project
    await supabase
      .from('projects')
      .insert([projectData])
    
    return true // New project created
  }
}

// Extract client name from folder/project name
function extractClientFromFolderName(folderName: string): string | null {
  // Common patterns for client project folders:
  // "Client Name - Project Description"
  // "Project for Client Name"
  // "[Client] Project Name"
  
  // Pattern 1: "Client Name - Project Description"
  const dashPattern = folderName.match(/^([^-]+)\s*-\s*(.+)$/)
  if (dashPattern) {
    return dashPattern[1].trim()
  }
  
  // Pattern 2: "[Client] Project Name"
  const bracketPattern = folderName.match(/^\[([^\]]+)\]\s*(.+)$/)
  if (bracketPattern) {
    return bracketPattern[1].trim()
  }
  
  // Pattern 3: "Project for Client Name"
  const forPattern = folderName.match(/.*\s+for\s+(.+)$/i)
  if (forPattern) {
    return forPattern[1].trim()
  }
  
  // Default: use first word as potential client
  const words = folderName.split(' ')
  if (words.length > 1) {
    return words[0]
  }
  
  return null
}

// Map ClickUp status to project status
function mapClickUpStatusToProjectStatus(clickupStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'open': 'active',
    'in progress': 'active',
    'in review': 'active',
    'done': 'completed',
    'closed': 'completed',
    'cancelled': 'archived',
    'on hold': 'on-hold',
    'blocked': 'on-hold'
  }

  return statusMap[clickupStatus.toLowerCase()] || 'active'
}

// GET endpoint for sync status
export async function GET(request: NextRequest) {
  try {
    await authMiddleware.requireAuth(request)
    const supabase = await createClient()

    // Get recent sync logs
    const { data: syncLogs, error } = await supabase
      .from('clickup_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sync logs' },
        { status: 500 }
      )
    }

    // Get last successful sync
    const lastSuccessfulSync = syncLogs.find(log => log.sync_status === 'completed')

    return NextResponse.json({
      last_sync: lastSuccessfulSync?.completed_at || null,
      sync_logs: syncLogs,
      status: 'available'
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}