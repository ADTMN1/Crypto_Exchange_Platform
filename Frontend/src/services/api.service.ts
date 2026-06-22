import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API Configuration
const VITE_API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://crypto-exchange-platform.onrender.com'
const API_CONFIG = {
  baseURL: `${VITE_API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
}
console.log('API config:', { VITE_API_BASE, baseURL: API_CONFIG.baseURL })

// Create axios instance
const api: AxiosInstance = axios.create(API_CONFIG)

let csrfToken: string | null = null;

// Function to fetch CSRF token
const fetchCsrfToken = async () => {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

// Request interceptor - Add auth token and CSRF token to requests
// Note: backend also reads httpOnly cookie automatically via withCredentials
api.interceptors.request.use(
  async (config) => {
    console.log('Making API request to:', config.baseURL + config.url, 'with config:', config)
    
    // Add auth token from localStorage (fallback for cookie)
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token for state-changing requests - fetch new one every time for safety
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
      await fetchCsrfToken(); // Always fetch fresh token
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle expired access token by refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh on 401 — 403 means forbidden (e.g. not admin), not expired token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register') && !originalRequest.url?.includes('/auth/send-otp')) {
      originalRequest._retry = true

      try {
        const storedRefreshToken = localStorage.getItem('refreshToken')
        if (!storedRefreshToken) throw new Error('No refresh token available')

        // Call refresh — backend reads cookie OR body refreshToken, returns new accessToken in body
        const refreshResponse = await api.post('/auth/refresh-token', { refreshToken: storedRefreshToken })

        const newAccessToken = refreshResponse.data?.accessToken
        if (!newAccessToken) throw new Error('No access token returned from refresh')

        // Persist new token and retry
        localStorage.setItem('token', newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch {
        // Refresh failed — clear everything and send to login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('auth-storage')
        // Don't redirect if already on login/register page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login'
        }
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
    CREATE_DEPOSIT_REQUEST: '/wallet/deposit-request',
    ADMIN_PENDING_DEPOSITS: '/wallet/admin/pending-deposits',
    ADMIN_DEPOSITS: (status: string) => `/wallet/admin/deposits/${status}`,
    ADMIN_APPROVE_DEPOSIT: (transactionId: string) => `/wallet/admin/deposit/${transactionId}/approve`,
    ADMIN_REJECT_DEPOSIT: (transactionId: string) => `/wallet/admin/deposit/${transactionId}/reject`,
  },
  // Trade endpoints
  TRADE: {
    ORDER_BOOK: (pair: string) => `/trade/${pair}/order-book`,
    PLACE_ORDER: '/trade/order',
    CANCEL_ORDER: (orderId: string) => `/trade/order/${orderId}`,
    ORDER_HISTORY: '/trade/orders',
    MARKET_DATA: '/trade/market-data',
  },
  // Binary trading endpoints
  BINARY: {
    PLACE_TRADE: '/binary/trade',
    MY_TRADES: '/binary/my-trades',
    ADMIN_TRADES: (status: string) => `/binary/admin/trades/${status}`,
    SETTINGS: '/binary/settings',
    UPDATE_SETTINGS: '/binary/admin/settings',
  },
  // Trading pairs endpoints
  TRADING_PAIRS: {
    GET_ALL: '/trading-pairs',
    GET_BY_ID: (id: string) => `/trading-pairs/${id}`,
    CREATE: '/trading-pairs',
    UPDATE: (id: string) => `/trading-pairs/${id}`,
    DELETE: (id: string) => `/trading-pairs/${id}`,
  },
  // Withdrawal endpoints
  WITHDRAWALS: {
    CREATE: '/withdrawals',
    MY_WITHDRAWALS: '/withdrawals/me',
    ADMIN_ALL: '/withdrawals/admin/all',
    ADMIN_DETAIL: (id: string) => `/withdrawals/admin/${id}`,
    ADMIN_CHANGE_STATUS: (id: string) => `/withdrawals/admin/change-status/${id}`,
    ADMIN_UPDATE_WALLET: (walletId: string) => `/withdrawals/admin/update-wallet/${walletId}`,
  },
  // Admin endpoints
  ADMIN: {
    USERS: '/admin/users',
    ACTIVE_USERS: '/admin/users/active',
    BANNED_USERS: '/admin/users/banned',
    USER_DETAILS: (userId: string) => `/admin/users/${userId}`,
    USER_TRANSACTIONS: (userId: string) => `/admin/users/${userId}/transactions`,
    USER_WALLETS: (userId: string) => `/admin/users/${userId}/wallets`,
    IMPERSONATE_USER: (userId: string) => `/admin/users/${userId}/impersonate`,
    UPDATE_USER_STATUS: (userId: string) => `/admin/users/${userId}/status`,
    BAN_USER: (userId: string) => `/admin/users/${userId}/ban`,
    UNBAN_USER: (userId: string) => `/admin/users/${userId}/unban`,
    DELETE_USER: (userId: string) => `/admin/users/${userId}`,
    AUDIT_LOGS: '/admin/audit-logs',
    LOGIN_HISTORY: '/admin/login-history',
    SYSTEM_STATS: '/admin/stats',
    Notifications: '/notifications/admin',
    NOTIFICATIONS: '/notifications/admin',
    NOTIFICATIONS_UNREAD_COUNT: '/notifications/admin/unread-count',
    NOTIFICATIONS_READ_ALL: '/notifications/admin/read-all',
    NOTIFICATION_READ: (id: string) => `/notifications/admin/${id}/read`,
    NOTIFICATION_HISTORY: '/notifications/admin/history',
    NOTIFICATION_DETAIL: (id: string) => `/notifications/admin/history/${id}`,
    TRANSACTIONS: '/admin/transactions',
    TRANSACTION_DETAIL: (id: string) => `/admin/transactions/${id}`,
    // Admin order endpoints
    ORDERS: '/admin/orders',
    TRADES: '/admin/orders/trades',
    OPEN_ORDERS: '/admin/orders/open',
    ORDER_HISTORY: '/admin/orders/history',
    ORDER_DETAIL: (orderId: string) => `/admin/orders/${orderId}`,
    CANCEL_ORDER: (orderId: string) => `/admin/orders/${orderId}/cancel`,
  },
}

// Utility function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}${endpoint}`
}

// Export base URL for direct fetch calls
export const API_BASE_URL = API_CONFIG.baseURL

export default api
