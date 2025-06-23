import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { dashboardServerQueries } from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await authMiddleware.requireAuth(request)

    // Get dashboard data
    const dashboardData = await dashboardServerQueries.getDashboardData(request)
    const summaryStats = await dashboardServerQueries.getSummaryStats(request)

    return NextResponse.json({
      projects: dashboardData,
      summary: summaryStats,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}