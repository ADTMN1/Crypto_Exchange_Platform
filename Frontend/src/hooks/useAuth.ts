import { useCallback } from 'react'
import { useAuthStore } from '../store'
import authService from '../services/authService'

export function useAuth() {
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await authService.signIn(email, password)
    login(user)
  }, [login])

  return {
    signIn,
    logout,
  }
}
