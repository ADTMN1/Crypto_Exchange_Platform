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
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
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
      initialize: () => {
        try {
          const storedUser = localStorage.getItem('user');
          const storedAccessToken = localStorage.getItem('token');
          const storedRefreshToken = localStorage.getItem('refreshToken');
          
          if (storedUser && storedAccessToken && storedRefreshToken) {
            const user = JSON.parse(storedUser);
            if (user && typeof user === 'object') {
              set({
                user,
                isAuthenticated: true,
                accessToken: storedAccessToken,
                refreshToken: storedRefreshToken,
                isLoading: false,
              });
            } else {
              console.warn('Invalid user data in localStorage');
              set({ isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error initializing auth store:', error);
          set({ isLoading: false });
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
      // Add partialize to prevent circular reference issues
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
