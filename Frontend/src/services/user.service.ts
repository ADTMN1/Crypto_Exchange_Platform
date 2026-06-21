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
    const response = await api.get<any>(API_ENDPOINTS.USER.PROFILE)
    const userData = response.data.data as User
    return {
      ...userData,
      profile_image: userData.profile_image || userData.profile_picture_url,
      profile_picture_url: userData.profile_picture_url || userData.profile_image,
    }
  },
  
  async updateProfile(data: UpdateProfilePayload): Promise<User> {
    const response = await api.put<any>(API_ENDPOINTS.USER.UPDATE_PROFILE, data)
    const userData = response.data.data as User
    return {
      ...userData,
      profile_image: userData.profile_image || userData.profile_picture_url,
      profile_picture_url: userData.profile_picture_url || userData.profile_image,
    }
  },
  
  async changePassword(data: ChangePasswordPayload): Promise<void> {
    await api.post(API_ENDPOINTS.USER.CHANGE_PASSWORD, data)
  },

  async uploadProfileImage(file: File): Promise<{ imageUrl: string; user: User }> {
    const formData = new FormData()
    formData.append('profileImage', file)
    
    const response = await api.post('/user/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const data = response.data.data
    return {
      imageUrl: data.imageUrl,
      user: {
        ...data.user,
        profile_image: data.user.profile_image || data.user.profile_picture_url,
        profile_picture_url: data.user.profile_picture_url || data.user.profile_image,
      },
    }
  },

  async deleteProfileImage(): Promise<void> {
    await api.delete('/user/profile/image')
  },
}

export default userService
