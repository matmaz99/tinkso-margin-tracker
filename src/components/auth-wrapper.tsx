'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthWrapper({ children, requireAuth = false }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session?.user)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN') {
          // User signed in, redirect to dashboard if on auth page
          if (window.location.pathname === '/login' || window.location.pathname === '/register') {
            router.push('/dashboard')
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out, redirect to login if on protected page
          const protectedRoutes = ['/dashboard', '/projects', '/invoices', '/clients', '/reports', '/settings']
          const isProtectedRoute = protectedRoutes.some(route => 
            window.location.pathname.startsWith(route)
          )
          if (isProtectedRoute) {
            router.push('/login')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if auth required but user not authenticated
  if (requireAuth && !user) {
    router.push('/login')
    return null
  }

  return <>{children}</>
}