import { createClient } from './client'
import { createServerClient } from './server'
import type { UserProfile, UserProfileInsert } from './types'

// Client-side authentication functions
export const authClient = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: { fullName?: string }) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData?.fullName || '',
        }
      }
    })

    if (error) throw error

    // Create user profile after successful signup
    if (data.user) {
      await this.createUserProfile(data.user.id, {
        id: data.user.id,
        email: data.user.email!,
        full_name: userData?.fullName || null,
        role: 'user'
      })
    }

    return data
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Update last login timestamp
    if (data.user) {
      await this.updateLastLogin(data.user.id)
    }

    return data
  },

  // Sign out
  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error
  },

  // Update password
  async updatePassword(newPassword: string) {
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  },

  // Get current session
  async getSession() {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Get current user
  async getUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Create user profile in our custom table
  async createUserProfile(userId: string, profileData: UserProfileInsert) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update last login timestamp
  async updateLastLogin(userId: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) console.error('Failed to update last login:', error)
  },

  // Get user profile with role and permissions
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to get user profile:', error)
      return null
    }
    
    return data
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Server-side authentication functions
export const authServer = {
  // Get session from server
  async getSession(request: Request) {
    const supabase = createServerClient(request)
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Get user from server
  async getUser(request: Request) {
    const supabase = createServerClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Get user profile from server
  async getUserProfile(request: Request, userId?: string): Promise<UserProfile | null> {
    const supabase = createServerClient(request)
    
    // If no userId provided, get from current session
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      userId = user.id
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to get user profile:', error)
      return null
    }
    
    return data
  }
}

// Password validation utility
export const passwordValidation = {
  // Check password strength
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  // Generate password strength score (0-100)
  getPasswordStrength(password: string): number {
    let score = 0
    
    // Length scoring
    if (password.length >= 8) score += 20
    if (password.length >= 12) score += 10
    if (password.length >= 16) score += 10
    
    // Character type scoring
    if (/[a-z]/.test(password)) score += 10
    if (/[A-Z]/.test(password)) score += 10
    if (/\d/.test(password)) score += 10
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15
    
    // Complexity scoring
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 10
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) score += 15
    
    return Math.min(score, 100)
  }
}

// Role-based access control utilities
export const rbac = {
  // Check if user has specific role
  hasRole(userProfile: UserProfile | null, role: string): boolean {
    return userProfile?.role === role
  },

  // Check if user has admin role
  isAdmin(userProfile: UserProfile | null): boolean {
    return this.hasRole(userProfile, 'admin')
  },

  // Check if user has specific permission
  hasPermission(userProfile: UserProfile | null, permission: string): boolean {
    if (!userProfile || !userProfile.permissions) return false
    
    const permissions = Array.isArray(userProfile.permissions) 
      ? userProfile.permissions 
      : []
    
    return permissions.includes(permission)
  },

  // Check if user can access resource
  canAccess(userProfile: UserProfile | null, resource: string): boolean {
    if (!userProfile) return false
    
    // Admins can access everything
    if (this.isAdmin(userProfile)) return true
    
    // Check specific permissions
    return this.hasPermission(userProfile, `access:${resource}`)
  }
}

// Authentication middleware for API routes
export const authMiddleware = {
  // Require authentication
  async requireAuth(request: Request) {
    const session = await authServer.getSession(request)
    if (!session) {
      throw new Error('Authentication required')
    }
    return session
  },

  // Require specific role
  async requireRole(request: Request, role: string) {
    const session = await this.requireAuth(request)
    const userProfile = await authServer.getUserProfile(request, session.user.id)
    
    if (!rbac.hasRole(userProfile, role)) {
      throw new Error(`Role '${role}' required`)
    }
    
    return { session, userProfile }
  },

  // Require admin role
  async requireAdmin(request: Request) {
    return await this.requireRole(request, 'admin')
  }
}