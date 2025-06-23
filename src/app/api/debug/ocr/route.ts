import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all projects for debugging
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, client_name, status')
      .eq('status', 'active')

    if (projectsError) {
      console.error('Failed to fetch projects:', projectsError)
    }

    // Get latest OCR results for debugging
    const { data: ocrResults, error: ocrError } = await supabase
      .from('ai_processing_results')
      .select('*')
      .eq('processing_type', 'pdf_text_project_matching')
      .order('processed_at', { ascending: false })
      .limit(5)

    if (ocrError) {
      console.error('Failed to fetch OCR results:', ocrError)
    }

    return NextResponse.json({
      projects: projects || [],
      recent_ocr_results: ocrResults || [],
      project_count: projects?.length || 0,
      ocr_results_count: ocrResults?.length || 0
    })

  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}