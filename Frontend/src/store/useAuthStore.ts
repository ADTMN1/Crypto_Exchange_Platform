import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Assuming your User interface looks something like this
interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'crypto-auth-storage', // Unique key name for localStorage
      storage: createJSONStorage(() => localStorage), // Defaults to localStorage, safely handles JSON serialization
    }
  )
)