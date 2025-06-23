import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/supabase/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await authMiddleware.requireAuth(request)
    const supabase = createServerClient(request)

    // Get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const session = await authMiddleware.requireAuth(request)
    const supabase = createServerClient(request)

    const { fullName, avatarUrl, settings } = await request.json()

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      profile: data,
      message: 'Profile updated successfully' 
    })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}