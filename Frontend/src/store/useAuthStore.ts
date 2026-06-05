import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types/auth.types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  login: (user: User, accessToken: string | null, refreshToken: string | null) => void
  logout: () => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  updateUser: (updates: Partial<User>) => void
  initialize: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      login: (user, accessToken = null, refreshToken = null) =>
        set({ user, isAuthenticated: true, accessToken, refreshToken, isLoading: false }),
      logout: () =>
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null, isLoading: false }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      initialize: () => {
        const storedUser = localStorage.getItem('user')
        const storedAccessToken = localStorage.getItem('token')
        const storedRefreshToken = localStorage.getItem('refreshToken')
        
        if (storedUser && storedAccessToken && storedRefreshToken) {
          try {
            const user = JSON.parse(storedUser)
            set({
              user,
              isAuthenticated: true,
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
              isLoading: false,
            })
          } catch {
            set({ isLoading: false })
          }
        } else {
          set({ isLoading: false })
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false
        }
      },
    }
  )
)
