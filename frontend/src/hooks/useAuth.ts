import { useState, useEffect } from 'react'

interface User {
  id: string
  telegram_id?: string
  username: string
  first_name?: string
  last_name?: string
  email: string
  role: 'user' | 'admin' | 'super-admin'
  status?: 'pending' | 'approved' | 'rejected'
  site_id?: string
  is_active?: boolean
  permissions?: string[]
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  })

  useEffect(() => {
    // Load user from localStorage synchronously for better test compatibility
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to load user'
      })
    }
  }, [])

  const login = (userData: User) => {
    try {
      // Persist synchronously
      localStorage.setItem('user', JSON.stringify(userData))
      // Update state synchronously for immediate UI response
      setAuthState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      return { success: true }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to login',
        isLoading: false
      }))
      return { success: false, error: 'Failed to login' }
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
  }

  const hasRole = (role: string) => {
    return authState.user?.role === role
  }

  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false

    // Check if user has custom permissions array
    if (authState.user.permissions) {
      // Super admin with '*' has all permissions
      if (authState.user.permissions.includes('*')) {
        return true
      }
      // Check if permission is in user's custom permissions
      if (authState.user.permissions.includes(permission)) {
        return true
      }
    }

    // Fallback to role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'user': ['view_own_data'],
      'admin': ['view_own_data', 'manage_users', 'view_reports'],
      'super-admin': ['view_own_data', 'manage_users', 'view_reports', 'manage_sites', 'system_admin']
    }

    return Boolean(rolePermissions[authState.user.role]?.includes(permission))
  }

  const hasAnyRole = (roles: string[]): boolean => {
    if (!authState.user) return false
    return roles.includes(authState.user.role)
  }

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
        return true
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
        return false
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to refresh auth'
      })
      return false
    }
  }

  return {
    ...authState,
    login,
    logout,
    hasRole,
    hasPermission,
    hasAnyRole,
    refreshAuth
  }
}
