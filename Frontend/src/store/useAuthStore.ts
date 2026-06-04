import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types/auth.types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  login: (user: User, accessToken: string | null, refreshToken: string | null) => void
  logout: () => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      login: (user, accessToken = null, refreshToken = null) =>
        set({ user, isAuthenticated: true, accessToken, refreshToken }),
      logout: () =>
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
