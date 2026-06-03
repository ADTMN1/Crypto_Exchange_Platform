import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API Configuration
const API_CONFIG = {
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
}

// Create axios instance
const api: AxiosInstance = axios.create(API_CONFIG)

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized or 403 Forbidden - Token expired
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.baseURL.replace('/api', '')}/api/auth/refresh-token`, {
            refreshToken,
          }, {
            withCredentials: true
          })
          
          const { accessToken } = response.data
          localStorage.setItem('token', accessToken)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// API Endpoints - Centralized endpoint configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  // User endpoints
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile/update',
    CHANGE_PASSWORD: '/user/change-password',
  },
  // Wallet endpoints
  WALLET: {
    BALANCE: '/wallet/balance',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    TRANSACTIONS: '/wallet/transactions',
  },
  // Trade endpoints
  TRADE: {
    ORDER_BOOK: (pair: string) => `/trade/${pair}/order-book`,
    PLACE_ORDER: '/trade/order',
    CANCEL_ORDER: (orderId: string) => `/trade/order/${orderId}`,
    ORDER_HISTORY: '/trade/orders',
    MARKET_DATA: '/trade/market-data',
  },
  // Admin endpoints
  ADMIN: {
    USERS: '/admin/users',
    USER_DETAILS: (userId: string) => `/admin/users/${userId}`,
    AUDIT_LOGS: '/admin/audit-logs',
    SYSTEM_STATS: '/admin/stats',
  },
}

// Utility function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}${endpoint}`
}

// Export base URL for direct fetch calls
export const API_BASE_URL = API_CONFIG.baseURL

export default api
