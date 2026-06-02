import api, { API_ENDPOINTS } from './api.service'
import type { UserCredentials, User } from '../types/auth.types'

const authService = {
  async signIn(email: string, password: string): Promise<User> {
    const response = await api.post<User>(API_ENDPOINTS.AUTH.LOGIN, { email, password })
    return response.data
  },
  async signUp(payload: UserCredentials): Promise<User> {
    const response = await api.post<User>(API_ENDPOINTS.AUTH.REGISTER, payload)
    return response.data
  },
  async logout(): Promise<void> {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  },
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken })
    return response.data
  },
  async googleAuth(token: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await api.post(API_ENDPOINTS.AUTH.GOOGLE, { token })
    return response.data
  },
}

export default authService
