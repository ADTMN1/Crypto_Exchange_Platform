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
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      isLoading: true, // Start as true (hydrating)
      login: (user, accessToken = null, refreshToken = null) => {
        if (!user) {
          console.error('Cannot login with undefined user');
          return;
        }
        set({ user, isAuthenticated: true, accessToken, refreshToken, isLoading: false });
      },
      logout: () =>
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null, isLoading: false }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      updateUser: (updates) => {
        const currentState = get();
        if (!currentState.user) {
          console.error('Cannot update user: user is null');
          return;
        }
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      setHydrated: () => set({ isLoading: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
      // Add partialize to prevent circular reference issues (exclude isLoading from persistence)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // Ensure hydration is marked complete even with empty storage
      version: 1,
    }
  )
)
