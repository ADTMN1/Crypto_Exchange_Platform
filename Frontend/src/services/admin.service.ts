import api, { API_ENDPOINTS } from './api.service'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

interface AuditLog {
  id: string
  userId: string
  action: string
  timestamp: string
  details: string
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalVolume: number
}

const adminService = {
  async getUsers(filters?: any): Promise<AdminUser[]> {
    const response = await api.get<AdminUser[]>(API_ENDPOINTS.ADMIN.USERS, { params: filters })
    return response.data
  },
  
  async getUserDetails(userId: string): Promise<AdminUser> {
    const response = await api.get<AdminUser>(API_ENDPOINTS.ADMIN.USER_DETAILS(userId))
    return response.data
  },
  
  async updateUser(userId: string, data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await api.put<AdminUser>(API_ENDPOINTS.ADMIN.USER_DETAILS(userId), data)
    return response.data
  },
  
  async deleteUser(userId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ADMIN.USER_DETAILS(userId))
  },
  
  async getAuditLogs(filters?: any): Promise<AuditLog[]> {
    const response = await api.get<AuditLog[]>(API_ENDPOINTS.ADMIN.AUDIT_LOGS, { params: filters })
    return response.data
  },
  
  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get<SystemStats>(API_ENDPOINTS.ADMIN.SYSTEM_STATS)
    return response.data
  },
}

export default adminService
