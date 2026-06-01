import api from './api.service'
import type { UserCredentials, User } from '../types/auth.types'

const authService = {
  async signIn(email: string, password: string): Promise<User> {
    const response = await api.post<User>('/auth/login', { email, password })
    return response.data
  },
  async signUp(payload: UserCredentials): Promise<User> {
    const response = await api.post<User>('/auth/register', payload)
    return response.data
  },
}

export default authService
