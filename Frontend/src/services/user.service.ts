import api, { API_ENDPOINTS } from './api.service'
import type { User } from '../types/auth.types'

interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get<User>(API_ENDPOINTS.USER.PROFILE)
    return response.data
  },
  
  async updateProfile(data: UpdateProfilePayload): Promise<User> {
    const response = await api.put<User>(API_ENDPOINTS.USER.UPDATE_PROFILE, data)
    return response.data
  },
  
  async changePassword(data: ChangePasswordPayload): Promise<void> {
    await api.post(API_ENDPOINTS.USER.CHANGE_PASSWORD, data)
  },
}

export default userService
