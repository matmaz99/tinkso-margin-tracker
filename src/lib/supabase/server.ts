import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

// Server component client (Next.js 15 compatible)
export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// API route client (for authentication middleware)
export function createServerClient(request: Request) {
  const url = new URL(request.url)
  const cookieHeader = request.headers.get('cookie') || ''
  
  // Parse cookies from header
  const cookies = cookieHeader
    .split(';')
    .map(cookie => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const [name, value] = cookie.split('=')
      if (name && value) {
        acc[name] = decodeURIComponent(value)
      }
      return acc
    }, {} as Record<string, string>)

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(cookies).map(([name, value]) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          // In API routes, we don't set cookies directly here
          // This would be handled by the response
        },
      },
    }
  )
}