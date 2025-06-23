import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { passwordValidation } from '@/lib/supabase/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordCheck = passwordValidation.validatePassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordCheck.errors
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient(request)

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        }
      }
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Create user profile after successful signup
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName || null,
          role: 'user' // Default role
        }])

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
        // Don't fail the registration if profile creation fails
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      message: data.user?.email_confirmed_at 
        ? 'Registration successful' 
        : 'Registration successful. Please check your email to confirm your account.'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}