// Central export point for all services
export { default as api } from './api.service'
export { default as authService } from './auth.service'
export { default as userService } from './user.service'
export { default as walletService } from './wallet.service'
export { default as historyService } from './history.service'
export { default as supportService } from './support.service'
export { default as notificationService } from './notification.service'
export { default as tradingGateService } from './trading-gate.service'

// Re-export commonly used utilities
export { API_ENDPOINTS, API_BASE_URL } from './api.service'
