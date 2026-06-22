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
          // The persist middleware should handle rehydration, but just to be safe
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsedStorage = JSON.parse(authStorage);
            const { state } = parsedStorage;
            if (state) {
              set({
                user: state.user || null,
                isAuthenticated: state.isAuthenticated || false,
                accessToken: state.accessToken || null,
                refreshToken: state.refreshToken || null,
                isLoading: false,
              });
            } else {
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
