import { useCallback } from 'react'
import { useAuthStore } from '../store'
import { authService } from '../services'
import userService from '../services/user.service'
import type { User } from '../types/auth.types'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const isLoading = useAuthStore((state) => state.isLoading)
  
  const loginStore = useAuthStore((state) => state.login)
  const logoutStore = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)
  const initialize = useAuthStore((state) => state.initialize)
  const setLoading = useAuthStore((state) => state.setLoading)

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    
    // Store tokens in localStorage
    localStorage.setItem('token', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    
    // Prepare user data
    const initialUser: User = {
      ...response.user,
      profile_image: response.user.profile_image || response.user.profile_picture_url,
      profile_picture_url: response.user.profile_picture_url || response.user.profile_image,
    }
    
    // Update store with initial user data
        loginStore(initialUser, response.accessToken, response.refreshToken)
    
    return response
  }, [loginStore])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.warn("Logout API call failed, but clearing local state anyway:", error)
    }
    logoutStore()
  }, [logoutStore])

  return {
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    isLoading,
    signIn,
    logout,
    updateUser,
    initialize,
    setLoading,
  }
}