import api from './api.service'
import type { LoginFormData, SignUpFormData } from '../types/auth.types'

interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      email: string
      username: string
      profile_picture_url?: string
      role?: string
    }
    accessToken?: string
    refreshToken?: string
  }
}

interface RegisterResponse {
  success: boolean
  message: string
  data: {
    id: string
    email: string
    username: string
  }
}

interface OTPResponse {
  success: boolean
  message: string
}

const authService = {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginFormData): Promise<{
    success: boolean
    message: string
    user: any
    accessToken: string
    refreshToken: string
  }> {
    const response = await api.post('/auth/login', credentials)
    const { user, success, message, accessToken, refreshToken } = response.data
    return {
      success,
      message,
      user: {
        ...user,
        profile_image: user.profile_image || user.profile_picture_url
      },
      accessToken,
      refreshToken
    }
  },

  /**
   * Send OTP to email
   */
  async sendOTP(email: string): Promise<OTPResponse> {
    const response = await api.post('/auth/send-otp', { email })
    return response.data
  },

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string): Promise<OTPResponse> {
    const response = await api.post('/auth/verify-otp', { email, otp })
    return response.data
  },

  /**
   * Register new user
   */
  async register(userData: SignUpFormData, otp: string): Promise<RegisterResponse> {
    const username = `${userData.firstName} ${userData.lastName}`
    const payload = {
      username,
      email: userData.email,
      phone_number: userData.phone_number,
      password: userData.password,
      otp,
    }
    const response = await api.post('/auth/register', payload)
    return response.data
  },

  /**
   * Google OAuth login
   */
  async googleLogin(token: string): Promise<{
    success: boolean
    message: string
    user: any
    accessToken: string
    refreshToken: string
  }> {
    const response = await api.post('/auth/google', { token })
    const { user, success, message, accessToken, refreshToken } = response.data
    return {
      success,
      message,
      user: {
        ...user,
        profile_image: user.profile_image || user.profile_picture_url
      },
      accessToken,
      refreshToken
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post('/auth/refresh-token', { refreshToken })
    return response.data
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post('/auth/verify-email', { token })
    return response.data
  },
}

export default authService
